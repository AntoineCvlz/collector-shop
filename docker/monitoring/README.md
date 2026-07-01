# Observabilité — Prometheus + Grafana

Stack de monitoring **dédiée** et découplée de l'application, mais **déployée
automatiquement à chaque merge sur `main`** (cf. `.github/workflows/deploy.yml`).

Périmètre : **infra** (hôte + conteneurs) **+ PostgreSQL + application Laravel**.

| Service             | Rôle                                              | Exposition          |
| ------------------- | ------------------------------------------------- | ------------------- |
| `prometheus`        | scrape + stockage des métriques (rétention 15j)   | **interne** (aucun) |
| `grafana`           | dashboards                                        | HTTPS via Caddy     |
| `node-exporter`     | métriques de l'hôte (CPU, RAM, disque, réseau)    | interne             |
| `cadvisor`          | métriques par conteneur Docker                    | interne             |
| `postgres-exporter` | métriques de la base `app_db`                     | interne             |
| *(app Laravel)*     | endpoint `/metrics` servi par le backend          | interne             |

Grafana est le **seul** service exposé, via le proxy Caddy frontal :
`https://grafana.antoine-cuvilliez.fr`. Prometheus et les exporters restent
internes. L'endpoint `/metrics` de Laravel n'est **pas** proxifié par
nginx-edge : Prometheus le scrape en interne via `app_nginx:80` sur le réseau
`monitoring`.

## Déploiement — automatique (CI)

À chaque merge sur `main`, le job `deploy` :

1. copie les fichiers de monitoring dans `/opt/collector-shop/monitoring/` ;
2. **génère `monitoring/.env`** à partir des secrets GitHub de l'environnement
   `production` (jamais committé, reste sur le VPS) ;
3. démarre / met à jour la stack (`docker compose up -d`).

### Secrets GitHub requis (environnement `production`)

| Secret                         | Rôle                                               |
| ------------------------------ | -------------------------------------------------- |
| `GF_SECURITY_ADMIN_USER`       | login admin Grafana                                |
| `GF_SECURITY_ADMIN_PASSWORD`   | mot de passe admin Grafana                         |
| `MONITORING_DATA_SOURCE_NAME`  | DSN PostgreSQL du `postgres-exporter` (cf. ci-dessous) |

`MONITORING_DATA_SOURCE_NAME`, idéalement avec un rôle **lecture seule** dédié :

```
postgresql://<user>:<password>@app_db:5432/<database>?sslmode=disable
```

Ajout via l'UI GitHub (Settings → Environments → production → Secrets) ou :

```bash
gh secret set GF_SECURITY_ADMIN_USER      --env production
gh secret set GF_SECURITY_ADMIN_PASSWORD  --env production
gh secret set MONITORING_DATA_SOURCE_NAME --env production
```

### Pré-requis (une fois)

- `provision-vps.sh` déjà exécuté (Docker + réseau `web`).
- DNS : `grafana.antoine-cuvilliez.fr` → IP du VPS.
- Le bloc Caddy `grafana.*` (cf. `docker/proxy/Caddyfile`, déjà présent).

Les réseaux `web` et `monitoring` sont créés idempotemment par le job de
déploiement avant tout `docker compose`.

## Déploiement — manuel (dépannage sur le VPS)

```bash
cd /opt/collector-shop
cp monitoring/.env.monitoring.example monitoring/.env
nano monitoring/.env    # GF_SECURITY_ADMIN_PASSWORD + DATA_SOURCE_NAME
docker network inspect monitoring >/dev/null 2>&1 || docker network create monitoring
docker compose -f monitoring/docker-compose.monitoring.yaml up -d
docker exec proxy_caddy caddy reload --config /etc/caddy/Caddyfile
```

## Ce qui est auto-provisionné (zéro clic)

- **Datasource Prometheus** (`grafana/provisioning/datasources/`) — uid stable
  `prometheus`, définie par défaut.
- **Dashboards** (`grafana/dashboards/`), chargés au démarrage dans le dossier
  Grafana « Infra » :
  - `node-exporter-full.json` — [Node Exporter Full](https://grafana.com/grafana/dashboards/1860) (ID 1860)
  - `cadvisor.json` — [Cadvisor exporter](https://grafana.com/grafana/dashboards/14282) (ID 14282)
  - `postgres.json` — PostgreSQL (métriques `postgres-exporter`)
  - `laravel-app.json` — Application Laravel (trafic HTTP, latence, métier)

## Vérifier que tout scrape

```bash
docker exec mon_prometheus wget -qO- http://localhost:9090/api/v1/targets \
  | grep -o '"health":"[^"]*"'
# attendu : "health":"up" pour prometheus, node, cadvisor, postgres, laravel
```

## Métriques applicatives Laravel

Le backend expose `/metrics` (format texte Prometheus) via
`App\Http\Controllers\MetricsController`, alimenté par :

- `App\Http\Middleware\CollectHttpMetrics` — compteur + histogramme de latence
  par méthode / route / status (namespace `collector_http_*`) ;
- des gauges métier échantillonnées à chaque scrape (`collector_users_total`,
  `collector_articles_published_total`, `collector_articles_sold_total`,
  `collector_orders_total`).

Stockage APCu (ext-apcu, activée dans le `Dockerfile` du backend).

## Ajouter un dashboard

Déposer un JSON dans `grafana/dashboards/`, l'ajouter à la liste `source:` du
SCP dans `deploy.yml`, puis merger. Veiller à ce que les panneaux référencent la
datasource d'uid `prometheus`.
