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

export function withCacheBust(src, attempt) {
  if (!src || attempt <= 0) return src;
  const separator = src.includes('?') ? '&' : '?';
  return `${src}${separator}t=${attempt}`;
}
