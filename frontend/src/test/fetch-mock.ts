import { vi, beforeEach, afterEach } from "vitest";


export const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

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

export function okRaw(body: unknown) {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
  } as Response);
}

export function fail(status = 500) {
  return Promise.resolve({ ok: false, status } as Response);
}

export function urlOf(call = 0): string {
  return fetchMock.mock.calls[call][0] as string;
}

export function optsOf(call = 0): RequestInit {
  return (fetchMock.mock.calls[call][1] ?? {}) as RequestInit;
}
