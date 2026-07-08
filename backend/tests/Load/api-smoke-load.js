import http from "k6/http";
import { check, sleep } from "k6";
import { Trend } from "k6/metrics";

const BASE_URL = __ENV.LOAD_TEST_BASE_URL || "http://localhost";

const articleShowDuration = new Trend("article_show_duration");

export const options = {
  stages: [
    { duration: "30s", target: 10 },
    { duration: "1m", target: 20 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_failed: [{ threshold: "rate<0.01", abortOnFail: false }],
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

export function handleSummary(data) {
  return {
    stdout: textSummary(data),
    "k6-summary.json": JSON.stringify(data, null, 2),
  };
}

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
