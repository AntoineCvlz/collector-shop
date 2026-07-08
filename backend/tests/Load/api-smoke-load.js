// Test de charge k6 — lancé À LA DEMANDE (voir backend/tests/Load/README.md).
// N'est PAS dans la CI/CD : on le déclenche manuellement contre l'environnement
// de son choix (local, staging, prod) via la variable LOAD_TEST_BASE_URL.
//
//   k6 run -e LOAD_TEST_BASE_URL=https://mon-domaine api-smoke-load.js
//
// Ne couvre QUE des routes GET publiques, sans authentification ni écriture :
// on mesure la perf du catalogue sans générer de données ni de charge
// d'écriture sur la cible.
import http from "k6/http";
import { check, sleep } from "k6";
import { Trend } from "k6/metrics";

const BASE_URL = __ENV.LOAD_TEST_BASE_URL || "http://localhost";

const articleShowDuration = new Trend("article_show_duration");

// Montée en charge courte et modérée : suffisant pour détecter une
// régression de perf sans stresser sérieusement le VPS mono-instance.
//
// Le respect des seuils est évalué par k6 lui-même : si l'un d'eux échoue,
// la commande `k6 run` sort avec le code 99 (utile en script).
export const options = {
  stages: [
    { duration: "30s", target: 10 },
    { duration: "1m", target: 20 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    // Taux d'échec HTTP < 1 %.
    http_req_failed: [{ threshold: "rate<0.01", abortOnFail: false }],
    // 95 % des requêtes sous 800 ms.
    http_req_duration: [{ threshold: "p(95)<800", abortOnFail: false }],
  },
};

export default function () {
  const health = http.get(`${BASE_URL}/up`);
  check(health, { "/up → 200": (r) => r.status === 200 });

  const categories = http.get(`${BASE_URL}/api/categories`);
  check(categories, { "/api/categories → 200": (r) => r.status === 200 });

  const articles = http.get(`${BASE_URL}/api/articles`);
  const articlesOk = check(articles, {
    "/api/articles → 200": (r) => r.status === 200,
  });

  // Détail d'un article, si le catalogue en propose un — dépend des
  // données réelles en prod, donc on reste défensif.
  if (articlesOk) {
    const body = articles.json();
    const firstId = body?.data?.data?.[0]?.id ?? body?.data?.[0]?.id;
    if (firstId) {
      const show = http.get(`${BASE_URL}/api/articles/${firstId}`);
      articleShowDuration.add(show.timings.duration);
      check(show, { "/api/articles/{id} → 200": (r) => r.status === 200 });
    }
  }

  sleep(1);
}

// Résumé lisible sur stdout + export JSON dans le dossier courant.
export function handleSummary(data) {
  return {
    stdout: textSummary(data),
    "k6-summary.json": JSON.stringify(data, null, 2),
  };
}

// Mini résumé texte (évite d'importer le module distant k6-summary, qui peut
// être bloqué hors ligne).
function textSummary(data) {
  const dur = data.metrics.http_req_duration?.values ?? {};
  const failed = data.metrics.http_req_failed?.values ?? {};
  const reqs = data.metrics.http_reqs?.values ?? {};
  return [
    "",
    "── Résumé du test de charge ──",
    `Requêtes totales : ${reqs.count ?? 0}`,
    `Taux d'échec     : ${((failed.rate ?? 0) * 100).toFixed(2)} %`,
    `Durée p(95)      : ${(dur["p(95)"] ?? 0).toFixed(0)} ms (seuil 800 ms)`,
    `Durée moyenne    : ${(dur.avg ?? 0).toFixed(0)} ms`,
    "",
  ].join("\n");
}
