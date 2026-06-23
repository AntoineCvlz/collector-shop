/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Base URL de l'API backend.
   * - En dev : définie (ex. http://127.0.0.1) via docker-compose / .env.
   * - En prod : absente → URLs relatives (`/api/...`) servies par nginx-edge.
   */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
