/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Basis URL API Finwall, mis. `http://localhost:3001`. */
  readonly VITE_API_BASE_URL?: string
  /** Base path aplikasi (untuk `createWebHistory`). */
  readonly VITE_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
