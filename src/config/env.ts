export const ENV = {
  apiUrl: import.meta.env.VITE_API_URL ?? '/api/v1',
  appName: import.meta.env.VITE_APP_NAME ?? 'FastLanches',
} as const;
