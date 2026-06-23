# Déploiement en production (VPS unique)

Architecture : **1 VPS** (IONOS/Hetzner/…) faisant tourner, via Docker Compose,
le front (React/Vite), le back (Laravel/PHP-FPM), Postgres et un **nginx-edge**
en frontal. Front et back sont servis sur la **même origine** → pas de CORS.

```
Internet :80 → nginx-edge ──/──────────→ frontend (:8080)
                          └─/api,/up,…──→ nginx → backend (PHP-FPM :9000) → postgres
```

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

(ou exécuter manuellement les étapes : user `deploy`, Docker, ufw 22+80,
`/opt/collector-shop`). Le script est dans `docker/provision-vps.sh`.

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

| Nom                        | Valeur                          |
|----------------------------|---------------------------------|
| `PRODUCTION_URL`           | `http://<IP_VPS>`               |
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
curl -f http://localhost/up        # health Laravel
```

## Évolutions

- **HTTPS + domaine** : pointer un domaine sur l'IP, remplacer nginx-edge par
  Caddy/Traefik (Let's Encrypt auto) et passer `APP_URL` en `https://`.
- **Staging** : ajouter un second environnement/VPS et réintroduire un job
  `deploy-staging` en amont de la prod.
