# Schéma de la pipeline CI/CD

Pipeline principale : [.github/workflows/main-pipeline.yml](../.github/workflows/main-pipeline.yml)

## Déclencheurs

- `push` sur `main` (chemins : `backend/**`, `frontend/**`, `docker/**`, `.github/workflows/**`)
- `pull_request` vers `main` (mêmes chemins)
- `schedule` : chaque lundi à 02h00 (`0 2 * * 1`)
- `workflow_dispatch` (manuel)

> Concurrence : un seul run par ref à la fois (`cancel-in-progress: true`).
> Le job `mutation-tests` est ignoré sur les pull requests.
> Le job `deploy` ne s'exécute que sur `push` vers `main`.

## Vue d'ensemble

```mermaid
flowchart TD
    subgraph BACK["🐘 Backend"]
        BT[build-and-test]
        BT --> SAST[code-quality-sast]
        BT --> SEC[secret-scanning]
        BT --> SCA[sca-dependency-scan]
        BT --> UD[unused-deps]
        BT --> IAC[secure-iac-dockerfile-scan]
        BT --> PS[phpstan]
        BT --> MT[mutation-tests]

        SAST --> BSD[build-and-scan-docker]
        SEC --> BSD
        IAC --> BSD
        SCA --> BSD
        UD --> BSD
        PS --> BSD

        BSD --> PUB[publish-docker-hub]
        PUB --> DAST[dast-zap-test]
    end

    subgraph FRONT["⚛️ Frontend"]
        BTF[build-and-test-front]
        BTF --> SASTF[code-quality-sast-front]
        BTF --> SCAF[sca-dependency-scan-front]
        BTF --> UDF[unused-deps-front]
        BTF --> IACF[secure-iac-dockerfile-scan-front]
        BTF --> CQL[codeql-front]
        BTF --> E2E[e2e-playwright-front]
        BTF --> LH[lighthouse-ci-front]

        SASTF --> BSDF[build-and-scan-docker-front]
        SCAF --> BSDF
        UDF --> BSDF
        IACF --> BSDF
        CQL --> BSDF
        E2E --> BSDF
        LH --> BSDF

        BSDF --> PUBF[publish-docker-hub-front]
        PUBF --> DASTF[dast-zap-test-front]
    end

    SEC -.-> BSDF

    DAST --> DEPLOY[🚀 deploy]
    MT --> DEPLOY
    DASTF --> DEPLOY

    DEPLOY --> NOTIF[📧 send-notifications<br/>if: always]
    DAST -.-> NOTIF
    DASTF -.-> NOTIF
```

## Étapes

### Branche Backend (PHP / Laravel)
| Job | Rôle |
|-----|------|
| `build-and-test` | Build + tests unitaires (racine de la branche) |
| `code-quality-sast` | Analyse statique de sécurité (Semgrep) |
| `secret-scanning` | Détection de secrets |
| `sca-dependency-scan` | Analyse des dépendances (SCA) |
| `unused-deps` | Détection de dépendances inutilisées |
| `secure-iac-dockerfile-scan` | Scan sécurité du Dockerfile (IaC) |
| `phpstan` | Analyse statique PHPStan |
| `mutation-tests` | Tests de mutation (hors PR) |
| `build-and-scan-docker` | Build + scan de l'image Docker |
| `publish-docker-hub` | Publication de l'image sur Docker Hub |
| `dast-zap-test` | Test dynamique de sécurité (OWASP ZAP) |

### Branche Frontend
| Job | Rôle |
|-----|------|
| `build-and-test-front` | Build + tests unitaires |
| `code-quality-sast-front` | Analyse statique de sécurité (Semgrep) |
| `sca-dependency-scan-front` | Analyse des dépendances (SCA) |
| `unused-deps-front` | Détection de dépendances inutilisées |
| `secure-iac-dockerfile-scan-front` | Scan sécurité du Dockerfile (IaC) |
| `codeql-front` | Analyse CodeQL |
| `e2e-playwright-front` | Tests end-to-end Playwright |
| `lighthouse-ci-front` | Audit performance/accessibilité Lighthouse |
| `build-and-scan-docker-front` | Build + scan de l'image Docker |
| `publish-docker-hub-front` | Publication de l'image sur Docker Hub |
| `dast-zap-test-front` | Test dynamique de sécurité (OWASP ZAP) |

### Convergence
| Job | Dépend de | Condition |
|-----|-----------|-----------|
| `deploy` | `dast-zap-test`, `mutation-tests`, `dast-zap-test-front` | `push` sur `main` uniquement |
| `send-notifications` | tous les jobs | `always()` — notifie par mail le résultat de chaque job |

> Note : `secret-scanning` (backend) est aussi une dépendance de `build-and-scan-docker-front` (arête en pointillés).
</content>
</invoke>
