/**
 * Utilidades para procesamiento, validación y embebido seguro de videos de YouTube.
 */

/**
 * Extrae el ID del video de YouTube a partir de una URL estándar, corta, shorts o código <iframe>.
 * @param {string} input - Enlace o código iframe de YouTube.
 * @returns {string|null} - ID del video (11 caracteres) o null si no es válido.
 */
export function extractYouTubeId(input) {
  if (!input || typeof input !== 'string') return null;

  const trimmed = input.trim();

  // 1. Si es un <iframe>, extraer el atributo src
  if (trimmed.startsWith('<iframe') || trimmed.includes('<iframe')) {
    const srcMatch = trimmed.match(/src=["']([^"']+)["']/i);
    if (srcMatch && srcMatch[1]) {
      return extractYouTubeId(srcMatch[1]);
    }
  }

  // 2. Patrones comunes de URL de YouTube
  // - https://www.youtube.com/watch?v=VIDEO_ID
  // - https://youtu.be/VIDEO_ID
  // - https://www.youtube.com/embed/VIDEO_ID
  // - https://www.youtube.com/v/VIDEO_ID
  // - https://www.youtube.com/shorts/VIDEO_ID
  // - https://m.youtube.com/watch?v=VIDEO_ID
  const patterns = [
    /(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/watch\?(?:.*&)?v=([a-zA-Z0-9_-]{11})/i,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/i,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/i,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})/i,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/i,
    /^[a-zA-Z0-9_-]{11}$/ // Si el usuario ingresó directamente el ID
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
    if (pattern.test(trimmed) && trimmed.length === 11) {
      return trimmed;
    }
  }

  return null;
}

/**
 * Genera la URL segura para el iframe embebido de YouTube.
 * @param {string} videoIdOrUrl - ID o URL del video.
 * @param {object} options - Opciones de reproducción (autoplay, rel, etc.).
 * @returns {string} - URL lista para el atributo src del iframe.
 */
export function getYouTubeEmbedUrl(videoIdOrUrl, options = {}) {
  const videoId = extractYouTubeId(videoIdOrUrl);
  if (!videoId) return '';

  const {
    autoplay = 0,
    rel = 0,
    modestbranding = 1,
    enablejsapi = 1
  } = options;

  const params = new URLSearchParams({
    autoplay: autoplay.toString(),
    rel: rel.toString(),
    modestbranding: modestbranding.toString(),
    enablejsapi: enablejsapi.toString(),
    origin: typeof window !== 'undefined' ? window.location.origin : ''
  });

  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}

/**
 * Obtiene la miniatura (thumbnail) oficial de YouTube en alta resolución.
 * @param {string} videoIdOrUrl - ID o URL del video.
 * @param {'hq'|'mq'|'maxres'} quality - Calidad de la miniatura.
 * @returns {string} - URL de la imagen.
 */
export function getYouTubeThumbnail(videoIdOrUrl, quality = 'hq') {
  const videoId = extractYouTubeId(videoIdOrUrl);
  if (!videoId) return '';

  if (quality === 'maxres') {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  }
  if (quality === 'mq') {
    return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  }
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * Valida si un texto corresponde a un video de YouTube identificable.
 * @param {string} input - Enlace o código.
 * @returns {boolean}
 */
export function isValidYouTubeInput(input) {
  return extractYouTubeId(input) !== null;
}
