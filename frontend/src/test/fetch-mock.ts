import { vi, beforeEach, afterEach } from "vitest";

// Helpers partagés par les tests de services : chaque service repose sur
// apiFetch (fetch global). On stub fetch une bonne fois et on expose des
// fabriques de réponses conformes à l'enveloppe API { response_code, ... }.

export const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

/** Réponse fetch JSON 200. `data` est enveloppé dans le contrat API. */
export function ok(data: unknown, extra: Record<string, unknown> = {}) {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () =>
      Promise.resolve({
        response_code: 200,
        status: "ok",
        message: "",
        data,
        ...extra,
      }),
  } as Response);
}

/** Réponse fetch JSON 200 avec un corps brut (pas d'enveloppe `data`). */
export function okRaw(body: unknown) {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
  } as Response);
}

/** Réponse HTTP en échec (apiFetch lève alors une Error). */
export function fail(status = 500) {
  return Promise.resolve({ ok: false, status } as Response);
}

/** URL passée au n-ième appel de fetch (0-indexé). */
export function urlOf(call = 0): string {
  return fetchMock.mock.calls[call][0] as string;
}

/** Options (method/headers/body) passées au n-ième appel de fetch. */
export function optsOf(call = 0): RequestInit {
  return (fetchMock.mock.calls[call][1] ?? {}) as RequestInit;
}
