# Collector.shop — Backend (API)

API et couche web de [Collector.shop](../README.md), construite avec **Laravel 12** (PHP 8.2). Fournit l'authentification (Laravel Passport), le catalogue, le tunnel d'achat avec commission et le back-office d'administration.

## Stack

- **PHP 8.2** / **Laravel 12**
- **Laravel Passport** — authentification OAuth2
- **Postgres** — base de données
- **Prometheus client** — métriques (`/up`, observabilité)
- Qualité & tests : **Pest 4**, **Larastan** (PHPStan), **Pint** (formatage), **Infection** (tests de mutation)

## Structure

Application Laravel standard :

```
app/            Modèles, contrôleurs, Form Requests, Policies
database/       Migrations, factories, seeders
routes/         api.php, web.php
tests/          Feature & Unit (Pest)
```

Les rôles (Acheteur, Vendeur, Admin) et l'isolation des permissions sont gérés via les Policies. Toute entrée est validée par des **Form Requests**.

## Développement

Le projet tourne en conteneurs (voir [docker/](../docker/)). Commandes usuelles, exécutées dans le conteneur backend :

```bash
composer install
php artisan migrate --seed
php artisan serve
```

> Pas d'environnement PHP local : `composer.lock` doit être régénéré dans un conteneur, pas sur la machine hôte.

## Qualité & tests

Ces commandes sont celles vérifiées par la pipeline CI :

```bash
./vendor/bin/pest --coverage      # tests + couverture
./vendor/bin/phpstan analyse       # analyse statique (Larastan)
./vendor/bin/pint --test           # vérification du formatage
./vendor/bin/infection             # tests de mutation
```

## Sécurité

- Validation stricte des données entrantes (Form Requests).
- Isolation des rôles via Policies.
- Protection contre les failles OWASP (couvertes par les jobs SAST/DAST/SCA de la [pipeline](../docs/PIPELINE.md)).
