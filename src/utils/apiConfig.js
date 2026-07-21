export function getBaseUrl() {
  const url = (
    (typeof window !== 'undefined' && window.__APP_CONFIG__?.API_BASE_URL) ||
    import.meta.env.VITE_API_BASE_URL ||
    ''
  ).trim().replace(/\/$/, '');

  if (!url) {
    throw new Error(
      'API_BASE_URL belum dikonfigurasi. Set API_BASE_URL di environment Dokploy.'
    );
  }

  if (!/^https?:\/\//i.test(url)) {
    throw new Error(
      `API_BASE_URL harus absolute URL (contoh: http://host:3001/api/v1), bukan: "${url}"`
    );
  }

  if (
    typeof window !== 'undefined' &&
    window.location.protocol === 'https:' &&
    url.startsWith('http://')
  ) {
    console.error(
      'Mixed Content: frontend HTTPS membutuhkan API_BASE_URL dengan HTTPS. ' +
      'Set API_BASE_URL di environment deploy (Dokploy).'
    );
  }

  return url;
}
