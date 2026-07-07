// Test de charge k6 — exécuté après chaque déploiement en production
// (voir .github/workflows/load-test.yml, appelé depuis main-pipeline.yml).
//
// Ne couvre QUE des routes GET publiques, sans authentification ni écriture :
// on mesure la dégradation de perf introduite par un déploiement, on ne
// génère pas de données ni de charge d'écriture sur la prod réelle.
import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

const BASE_URL = __ENV.LOAD_TEST_BASE_URL || "http://localhost";

const errorRate = new Rate("errors");
const articleShowDuration = new Trend("article_show_duration");

// Montée en charge courte et modérée : suffisant pour détecter une
// régression de perf sans stresser sérieusement le VPS mono-instance.
export const options = {
  stages: [
    { duration: "30s", target: 10 },
    { duration: "1m", target: 20 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<800"],
    errors: ["rate<0.01"],
  },
};

export default function () {
  const health = http.get(`${BASE_URL}/up`);
  check(health, { "/up → 200": (r) => r.status === 200 }) || errorRate.add(1);

  const categories = http.get(`${BASE_URL}/api/categories`);
  check(categories, { "/api/categories → 200": (r) => r.status === 200 }) ||
    errorRate.add(1);

  const articles = http.get(`${BASE_URL}/api/articles`);
  const articlesOk = check(articles, {
    "/api/articles → 200": (r) => r.status === 200,
  });
  if (!articlesOk) errorRate.add(1);

  // Détail d'un article, si le catalogue en propose un — dépend des
  // données réelles en prod, donc on reste défensif.
  if (articlesOk) {
    const body = articles.json();
    const firstId = body?.data?.[0]?.id ?? body?.[0]?.id;
    if (firstId) {
      const show = http.get(`${BASE_URL}/api/articles/${firstId}`);
      articleShowDuration.add(show.timings.duration);
      check(show, { "/api/articles/{id} → 200": (r) => r.status === 200 }) ||
        errorRate.add(1);
    }
  }

  sleep(1);
}
