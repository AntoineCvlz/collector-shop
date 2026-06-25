# Observabilité — Prometheus + Grafana

Stack de monitoring **dédiée** et découplée de l'application. Périmètre :
**infra** (métriques de l'hôte + des conteneurs Docker).

| Service         | Rôle                                            | Exposition          |
| --------------- | ----------------------------------------------- | ------------------- |
| `prometheus`    | scrape + stockage des métriques (rétention 15j) | **interne** (aucun) |
| `grafana`       | dashboards                                      | HTTPS via Caddy     |
| `node-exporter` | métriques de l'hôte (CPU, RAM, disque, réseau)  | interne             |
| `cadvisor`      | métriques par conteneur Docker                  | interne             |

Grafana est le **seul** service exposé, via le proxy Caddy frontal :
`https://grafana.antoine-cuvilliez.fr`. Prometheus et les exporters restent
sur le réseau interne `monitoring`.

## Déploiement (sur le VPS)

Pré-requis déjà en place via `provision-vps.sh` : Docker + réseau `web`.

```bash
# 1. Récupérer ce dossier dans /opt/monitoring (ex: scp / git / CI)
# 2. Configurer les secrets Grafana
cd /opt/monitoring
cp .env.monitoring.example .env
nano .env                      # définir GF_SECURITY_ADMIN_PASSWORD

# 3. DNS : créer un enregistrement A
#    grafana.antoine-cuvilliez.fr → IP du VPS

# 4. Démarrer la stack
docker compose -f docker-compose.monitoring.yaml up -d

# 5. Recharger Caddy pour prendre le nouveau bloc grafana.*
#    (cf. docker/proxy/Caddyfile, déjà mis à jour)
docker exec proxy_caddy caddy reload --config /etc/caddy/Caddyfile
```

Première connexion : `https://grafana.antoine-cuvilliez.fr`
avec l'utilisateur/mot de passe du `.env`.

## Ce qui est auto-provisionné (zéro clic)

- **Datasource Prometheus** (`grafana/provisioning/datasources/`) — uid stable
  `prometheus`, définie par défaut.
- **Dashboards** (`grafana/dashboards/`), chargés au démarrage dans le dossier
  Grafana « Infra » :
  - `node-exporter-full.json` — [Node Exporter Full](https://grafana.com/grafana/dashboards/1860) (ID 1860)
  - `cadvisor.json` — [Cadvisor exporter](https://grafana.com/grafana/dashboards/14282) (ID 14282)

## Vérifier que tout scrape

Cibles Prometheus (depuis le VPS, Prometheus n'étant pas exposé) :

```bash
docker exec mon_prometheus wget -qO- http://localhost:9090/api/v1/targets \
  | grep -o '"health":"[^"]*"'
# attendu : "health":"up" pour prometheus, node, cadvisor
```

## Ajouter un dashboard

Déposer un JSON dans `grafana/dashboards/` puis `docker compose ... up -d`
(ou attendre 30 s, le provider recharge automatiquement). Veiller à ce que les
panneaux référencent la datasource d'uid `prometheus` (les dashboards importés
depuis grafana.com via `__inputs` doivent être nettoyés au préalable).

## Étendre le périmètre plus tard

- **PostgreSQL** : ajouter un `postgres-exporter` pointant sur `app_db`
  (le brancher aussi sur le réseau `app-network` de l'app) + un job Prometheus.
- **App Laravel** : exposer un endpoint `/metrics` côté backend + un job.
- **Caddy** : activer les métriques natives Caddy + un job.
