# Collector.shop — Frontend

Interface utilisateur de [Collector.shop](../README.md) : SPA **React 19 + TypeScript** propulsée par **Vite 7**. Consomme l'API [backend](../backend/README.md) (même origine, pas de CORS).

## Stack

- **React 19** + **TypeScript** + **Vite 7**
- **Tailwind CSS 4** + Radix UI (`react-slot`), `class-variance-authority`, `lucide-react`
- **TanStack Query** — data fetching / cache
- **react-router-dom 7** — routing
- **i18next** — internationalisation
- **Zod** — validation de schémas
- Tests : **Vitest** + Testing Library (unitaires), **Playwright** + `@axe-core` (e2e & accessibilité)

## Structure

```
src/           Composants, pages, hooks, i18n
public/         Assets statiques
tests / e2e     Vitest (unit) et Playwright (e2e)
```

## Scripts

```bash
npm install
npm run dev            # serveur de dev (Vite + HMR)
npm run build          # build de production (tsc + vite build)
npm run preview        # prévisualiser le build

npm run lint           # ESLint
npm run type-check     # vérification TypeScript (tsc --noEmit)
npm run test           # tests unitaires (Vitest)
npm run test:coverage  # tests + couverture
```

Les e2e Playwright et l'audit Lighthouse sont exécutés par la [pipeline CI](../docs/PIPELINE.md).

## Qualité

Avant de pousser, la CI vérifie : `lint`, `type-check`, `test:coverage`, e2e Playwright (avec contrôles d'accessibilité `axe-core`) et Lighthouse. Garde ces commandes vertes localement pour éviter les échecs de pipeline.
