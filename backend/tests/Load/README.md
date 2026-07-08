# Test de charge (k6)

Test de charge léger sur les routes **GET publiques** du catalogue
(`/up`, `/api/categories`, `/api/articles`, `/api/articles/{id}`).
Sans authentification ni écriture — ne modifie pas les données de la cible.

**Lancé à la demande** (pas dans la CI/CD) : on le déclenche manuellement
contre l'environnement de son choix.

## Lancer

```bash
# Défaut : http://localhost
./run-load-test.sh

# Cible explicite (staging, prod…)
./run-load-test.sh https://collector-shop.antoine-cuvilliez.fr
```

Ou directement avec k6 :

```bash
k6 run -e LOAD_TEST_BASE_URL=https://mon-domaine.fr api-smoke-load.js
```

Ou via Docker (sans installer k6) :

```bash
docker run --rm -v "$PWD":/scripts -w /scripts \
  -e LOAD_TEST_BASE_URL=https://mon-domaine.fr \
  grafana/k6:latest run api-smoke-load.js
```

## Charge & seuils

- Montée : 10 → 20 utilisateurs virtuels, ~2 min au total.
- Seuils (dans `options.thresholds`) :
  - taux d'échec HTTP < 1 %
  - `p(95)` de la durée des requêtes < 800 ms

Si un seuil n'est pas respecté, `k6 run` sort avec le **code 99**.
Un résumé s'affiche sur la sortie standard et un `k6-summary.json` est écrit
dans le dossier courant.

> ⚠️ Cible la **vraie** application : lancer contre la prod génère une charge
> réelle. Rester sur une charge modérée (valeurs par défaut) ou viser un
> environnement de staging pour des tests plus agressifs.
