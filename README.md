# Collector.shop

Plateforme de vente en ligne d'objets de collection **entre particuliers** (vintage / collection). Monolithe organisé en monorepo : une API Laravel et un front React/Vite, déployés en conteneurs sur un VPS unique derrière un proxy Caddy.

## Architecture

```
collector-shop/
├── backend/     API & web — Laravel 12 (PHP 8.2), Passport, Postgres
├── frontend/    SPA — React 19 + TypeScript + Vite, Tailwind, TanStack Query
├── docker/      Compose (dev/prod), Caddy proxy, nginx-edge, monitoring
├── docs/        DEPLOY.md, PIPELINE.md
└── .github/     Pipeline CI/CD (GitHub Actions)
```

Front et back sont servis sur la **même origine** (pas de CORS). L'authentification (inscription, connexion, déconnexion) s'appuie sur **Laravel Passport**.

## Stack

| | Technologies |
|---|---|
| **Backend** | PHP 8.2, Laravel 12, Passport, Pest, Larastan, Pint, Infection |
| **Frontend** | React 19, TypeScript, Vite 7, Tailwind 4, TanStack Query, react-router 7, i18next, Zod, Vitest, Playwright |
| **Infra** | Docker Compose, Caddy (SSL auto), nginx, Postgres, Prometheus/Grafana |

## Fonctionnalités

- **Profils & espaces utilisateurs** — rôles Acheteur / Vendeur / Admin (un compte peut être Acheteur *et* Vendeur), suivi des achats/ventes, historique, notation entre membres, centres d'intérêt.
- **Catalogue & publication** — catalogue public (sans authentification), création d'annonces par un vendeur, workflow de modération (statut *En attente de contrôle* → *Publié*).
- **Tunnel d'achat & commission** — paiement par carte (simulation), commission plateforme de **5 %** prélevée et enregistrée à la validation du paiement.
- **Back-office** — gestion des catégories, modération (suppression d'articles, bannissement de vendeurs).

## Démarrage rapide

Le développement se fait via Docker Compose (aucune installation locale de PHP/Node requise) :

```bash
cd docker
cp .env.prod.example .env      # adapter les variables
docker compose -f docker-compose.yaml up --build
```

Détails backend et frontend dans leurs README respectifs :
- [backend/README.md](backend/README.md)
- [frontend/README.md](frontend/README.md)

## CI/CD

Chaque push/PR sur `main` déclenche la pipeline GitHub Actions : build, tests, analyse statique (PHPStan/ESLint), SAST/DAST/SCA, tests de mutation, e2e Playwright, Lighthouse, build & scan des images Docker, publication Docker Hub, puis déploiement.

- Schéma complet : [docs/PIPELINE.md](docs/PIPELINE.md)
- Déploiement : [docs/DEPLOY.md](docs/DEPLOY.md)

## Contribution

Les conventions (branches, commits conventionnels, hooks) sont décrites dans [CONTRIBUTING.md](CONTRIBUTING.md). Les messages de commit sont validés par `commitlint`.
