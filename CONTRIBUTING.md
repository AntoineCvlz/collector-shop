# Contributing to Collector Shop

Merci de contribuer ! Ce document décrit les conventions du projet.

## Workflow Git

Le travail se fait sur des **branches de fonctionnalité**, jamais directement sur `main`.

1. Crée une branche depuis `main` :
   ```bash
   git checkout main && git pull
   git checkout -b feat/ma-fonctionnalite
   ```
2. Développe, commit (voir conventions ci-dessous), pousse la branche.
3. Ouvre une **Pull Request** vers `main`.
4. La PR doit avoir **tous les checks au vert** avant merge (CI back/front, sécurité, commitlint).
5. Merge une fois la PR approuvée.

### Nommage des branches

| Préfixe | Usage |
|---------|-------|
| `feat/` | nouvelle fonctionnalité |
| `fix/` | correction de bug |
| `chore/` | maintenance, outillage |
| `docs/` | documentation |
| `refactor/` | refactorisation sans changement de comportement |

## Messages de commit

Le projet suit la spécification [Conventional Commits](https://www.conventionalcommits.org/),
validée automatiquement en CI ([commitlint.yml](.github/workflows/commitlint.yml)).

**Format :**

```
<type>(<scope>): <description>
```

Un préfixe d'aire optionnel `[backend]` / `[frontend]` / `[global]` peut précéder
le message (il peut être ajouté automatiquement) :

```
[backend] feat(auth): add login endpoint
```

**Types autorisés :** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`,
`test`, `build`, `ci`, `chore`, `revert`.

**Exemples valides :**

```
feat(cart): add quantity selector
fix(api): handle null user on logout
chore(ci): bump trivy to v0.71.0
[frontend] refactor(home): extract product card component
```

## Qualité du code

Avant de pousser, assure-toi que les vérifications passent localement.

### Backend (Laravel) — à lancer dans le conteneur Docker

> Le host `db` n'est résolvable que depuis le réseau Docker ; lance les
> commandes dans le conteneur `backend`.

```bash
cd docker
docker compose exec backend php artisan test          # tests (PHPUnit/Pest)
docker compose exec backend vendor/bin/phpstan analyse --memory-limit=1G  # PHPStan niveau 10
docker compose exec backend vendor/bin/pint           # style (Laravel Pint)
```

- **Couverture de tests** : seuil minimum piloté par la variable repo
  `COVERAGE_MIN` (actuellement 85 %). Toute baisse sous ce seuil fait échouer la CI.
- **PHPStan** : niveau 10 (maximum). Aucune erreur tolérée.

### Frontend (React/Vite)

```bash
cd frontend
npm run lint
npm run type-check
npm run build
```

## Pipeline CI/CD

Chaque PR déclenche les pipelines de [.github/workflows/](.github/workflows/) :
build & tests, SAST, SCA, scan de secrets, scan IaC, build & scan Docker, DAST.
Les vulnérabilités **CRITICAL/HIGH** bloquent la chaîne. Tous les checks doivent
être verts pour merger.
