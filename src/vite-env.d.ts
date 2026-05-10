/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_FEATURE_DARK_MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
