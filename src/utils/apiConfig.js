const runtimeApiBaseUrl =
  typeof window !== 'undefined' ? window.__APP_CONFIG__?.API_BASE_URL : undefined;

export const BASE_URL = runtimeApiBaseUrl || import.meta.env.VITE_API_BASE_URL;

if (
  typeof window !== 'undefined' &&
  window.location.protocol === 'https:' &&
  BASE_URL?.startsWith('http://')
) {
  console.error(
    'Mixed Content: frontend HTTPS membutuhkan API_BASE_URL dengan HTTPS. ' +
    'Set API_BASE_URL di environment deploy (Dokploy).'
  );
}
