# Déploiement en production (VPS unique)

Architecture : **1 VPS** (IONOS/…) avec un **proxy Caddy frontal partagé**
(SSL Let's Encrypt automatique) qui route **par sous-domaine** vers chaque
appli. Chaque appli tourne dans sa propre stack Docker Compose ; pour
collector-shop : front (React/Vite), back (Laravel/PHP-FPM), Postgres et un
**nginx-edge**. Front et back sont sur la **même origine** → pas de CORS.

```
Internet :80/:443
   │  Caddy (frontal partagé, SSL auto, réseau Docker "web")
   ├─ collector-shop.antoine-cuvilliez.fr → app_edge ─/────────→ frontend (:8080)
   │                                                 └─/api,/up,…→ nginx → backend (:9000) → postgres
   └─ <futur>.antoine-cuvilliez.fr        → autre_edge (autre appli)
```

> **Ajouter une appli plus tard** : la rattacher au réseau externe `web`
> (sans publier de port hôte), puis ajouter un bloc dans
> `docker/proxy/Caddyfile` (`sous-domaine { reverse_proxy son_edge:80 }`)
> et un enregistrement DNS A vers l'IP du VPS. Caddy gère le certificat.

Le déploiement est **automatique** : un push sur `main` déclenche la CI
(tests, sécurité, build, publication Docker Hub) puis, après approbation
manuelle de l'environnement `production`, le job `deploy`.

---

## 1. Provisionner le VPS (une seule fois)

Récupérer la **clé publique** de déploiement (sur ta machine) :

```bash
cat ~/.ssh/collector_deploy.pub
```

Sur le VPS, en **root** :

```bash
DEPLOY_PUBKEY="ssh-ed25519 AAAA... github-actions-collector-shop" \
  bash provision-vps.sh
```

(ou exécuter manuellement les étapes : user `deploy`, Docker, ufw 22+80+443,
réseau Docker `web`, `/opt/collector-shop`). Script : `docker/provision-vps.sh`.

### DNS (chez IONOS)

Dans la zone DNS de `antoine-cuvilliez.fr`, créer un enregistrement **A** :

| Type | Nom (sous-domaine) | Valeur      | TTL    |
|------|--------------------|-------------|--------|
| A    | `collector-shop`   | `<IP_VPS>`  | 1 h    |

(et un **AAAA** vers l'IPv6 du VPS si tu en as une). Vérifier la propagation
avant le déploiement : `dig +short collector-shop.antoine-cuvilliez.fr`
doit renvoyer l'IP du VPS — sinon Let's Encrypt échouera à émettre le certif.

Vérifier l'accès par clé depuis ta machine :

```bash
ssh -i ~/.ssh/collector_deploy deploy@<IP_VPS> "docker compose version"
```

## 2. Créer le `.env` de prod sur le VPS

```bash
ssh -i ~/.ssh/collector_deploy deploy@<IP_VPS>
cd /opt/collector-shop
nano .env        # se baser sur docker/.env.prod.example
```

Générer `APP_KEY` (Laravel) :

```bash
docker run --rm <DOCKERHUB_USERNAME>/<BACKEND_IMAGE>:latest php artisan key:generate --show
```

Coller la valeur dans `APP_KEY=` du `.env`. Mettre un `DB_PASSWORD` fort.

> ⚠️ Le `.env` contient des secrets : il vit **uniquement sur le VPS**,
> il n'est jamais committé. Seul `docker-compose.prod.yaml` et les confs
> nginx sont synchronisés par la CI.

## 3. Configurer GitHub

**Settings → Environments → `production`** :

| Type   | Nom                       | Valeur                                  |
|--------|---------------------------|-----------------------------------------|
| Secret | `SSH_HOST`                | IP du VPS (`<IP_VPS>`)                   |
| Secret | `SSH_USER`                | `deploy`                                 |
| Secret | `SSH_PRIVATE_KEY`         | contenu de `~/.ssh/collector_deploy`     |
| Secret | `DOCKERHUB_USERNAME`      | ton user Docker Hub                      |

**Required reviewers** : t'ajouter → le déploiement prod attend ton approbation.

**Settings → Secrets and variables → Actions → Variables** (niveau repo) :

| Nom                        | Valeur                                          |
|----------------------------|-------------------------------------------------|
| `PRODUCTION_URL`           | `https://collector-shop.antoine-cuvilliez.fr`   |
| `DEPLOY_APPLI_NAME`        | nom image **backend** (Hub)     |
| `DEPLOY_APPLI_NAME_FRONT`  | nom image **frontend** (Hub)    |

(les secrets Docker Hub `DOCKERHUB_USERNAME` / `DOCKERHUB_TOKEN`,
`SEMGREP_APP_TOKEN`, `MAIL_*` etc. sont déjà utilisés par la CI existante.)

## 4. Déployer

```bash
git push origin main          # touchant backend/** ou frontend/**
```

Pipeline → build → publication Docker Hub → **approbation** → `deploy` :
- sync `docker-compose.prod.yaml` + confs nginx sur le VPS,
- `docker compose pull && up -d`,
- `php artisan migrate --force` + `config:cache`,
- health check `http://<IP_VPS>/up`.

## 5. Vérifier / dépanner

```bash
ssh -i ~/.ssh/collector_deploy deploy@<IP_VPS>
cd /opt/collector-shop
docker compose -f docker-compose.prod.yaml ps
docker compose -f docker-compose.prod.yaml logs -f edge backend

# Proxy / SSL
docker compose -f proxy/docker-compose.proxy.yaml logs -f caddy   # voir l'émission du certif
docker exec proxy_caddy caddy reload --config /etc/caddy/Caddyfile  # recharger après edit du Caddyfile
curl -f https://collector-shop.antoine-cuvilliez.fr/up             # health Laravel via HTTPS
```

> Penser à passer `APP_URL=https://collector-shop.antoine-cuvilliez.fr` dans
> le `.env` du VPS (Laravel génère URLs/liens à partir de là), puis
> `php artisan config:cache`. nginx-edge fixe déjà `X-Forwarded-Proto`.

### Premier certificat : que se passe-t-il ?

Au 1er `up`, Caddy contacte Let's Encrypt (challenge HTTP-01 sur le port 80)
et obtient le certificat. Il est stocké dans le volume `caddy-data`
(persistant) et **renouvelé automatiquement**. Si l'émission échoue, vérifier :
le DNS pointe bien vers le VPS, les ports 80 **et** 443 sont ouverts (ufw),
et qu'aucun autre service ne tient le port 80 (`sudo lsof -i :80`).

> **Erreur `lookup ... on 127.0.0.53:53: connection refused`** dans les logs
> Caddy : les conteneurs ne résolvent pas le DNS (le systemd-resolved d'Ubuntu
> n'est pas joignable depuis Docker). Créer `/etc/docker/daemon.json` avec
> `{ "dns": ["1.1.1.1", "8.8.8.8"] }`, `sudo systemctl restart docker`, puis
> relancer les `up`. (`provision-vps.sh` le configure automatiquement.)

## Évolutions

- **Staging** : ajouter un second environnement/VPS et réintroduire un job
  `deploy-staging` en amont de la prod.
- **Nouvelle appli** : nouvelle stack rattachée au réseau `web` + un bloc dans
  `docker/proxy/Caddyfile` + un DNS A. (cf. encadré en tête de doc.)
