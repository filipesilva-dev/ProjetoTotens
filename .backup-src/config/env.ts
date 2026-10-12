export const ENV = {
  apiUrl: import.meta.env.VITE_API_URL ?? '/api',
  appName: import.meta.env.VITE_APP_NAME ?? 'FastLanches',
  useMocks: String(import.meta.env.VITE_USE_MOCKS ?? 'true') === 'true',
} as const;
