export function toSafeImageSrc(src) {
  if (!src || typeof src !== 'string') return src;

  try {
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && src.startsWith('http://')) {
      return `https://${src.slice('http://'.length)}`;
    }
  } catch {
    return src;
  }

  return src;
}

export function withQueryParam(src, key, value) {
  if (!src || value === undefined || value === null) return src;
  const separator = src.includes('?') ? '&' : '?';
  return `${src}${separator}${key}=${value}`;
}

export function withCacheBust(src, attempt) {
  return withQueryParam(src, 't', attempt > 0 ? attempt : undefined);
}
