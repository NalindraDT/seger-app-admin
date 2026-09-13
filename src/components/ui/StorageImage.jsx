import { useEffect, useMemo, useState } from 'react';
import { ImageOff } from 'lucide-react';
import { toSafeImageSrc, withCacheBust, withQueryParam } from '../../utils/storageUrl';

export default function StorageImage({
  src,
  alt = '',
  className = '',
  fallback,
  maxRetries = 2,
  lazy = false,
  placeholderClassName = '',
  width,
}) {
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setAttempt(0);
    setFailed(false);
    setLoaded(false);
  }, [src]);

  const safeSrc = useMemo(() => {
    const safe = toSafeImageSrc(src);
    if (!width || typeof safe !== 'string' || safe.startsWith('blob:') || safe.startsWith('data:')) return safe;
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const pixels = Math.min(2048, Math.max(32, Math.ceil(width * dpr)));
    return withQueryParam(safe, 'w', pixels);
  }, [src, width]);
  const displaySrc = useMemo(() => {
    if (failed) return fallback || '';
    return withCacheBust(safeSrc, attempt);
  }, [safeSrc, attempt, failed, fallback]);

  if (!src && !fallback) {
    return null;
  }

  if (failed && !fallback) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 text-gray-400 ${placeholderClassName || className}`}>
        <ImageOff className="h-5 w-5" />
        <span className="sr-only">{alt || 'Gagal memuat gambar'}</span>
      </div>
    );
  }

  return (
    <img
      src={displaySrc || fallback}
      alt={alt}
      className={`${className}${loaded ? '' : ' bg-gray-100'}`}
      loading={lazy ? 'lazy' : undefined}
      onLoad={() => setLoaded(true)}
      onError={() => {
        if (!failed && attempt < maxRetries) {
          setAttempt((current) => current + 1);
          return;
        }
        setFailed(true);
      }}
    />
  );
}
