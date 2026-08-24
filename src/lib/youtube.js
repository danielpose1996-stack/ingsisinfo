/**
 * Utilidades para procesamiento, validación y embebido seguro y compatible de videos de YouTube.
 */

/**
 * Extrae el ID del video de YouTube a partir de cualquier enlace estándar, corto, shorts, live o código <iframe>.
 * @param {string} input - Enlace o código iframe de YouTube.
 * @returns {string|null} - ID limpio del video (11 caracteres) o null si no es válido.
 */
export function extractYouTubeId(input) {
  if (!input || typeof input !== 'string') return null;

  let text = input.trim();

  // 1. Si es un <iframe>, extraer el valor del atributo src
  if (text.includes('<iframe') || text.includes('src=')) {
    const srcMatch = text.match(/src=["']([^"']+)["']/i);
    if (srcMatch && srcMatch[1]) {
      text = srcMatch[1].trim();
    }
  }

  // 2. Si es una URL o ID directa, decodificar entidades HTML si existen
  text = text.replace(/&amp;/g, '&');

  // Si el usuario ingresó directamente el ID de 11 caracteres alfanumérico
  if (/^[a-zA-Z0-9_-]{11}$/.test(text)) {
    return text;
  }

  // 3. Patrones de extracción robustos
  const patterns = [
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/|live\/)|youtu\.be\/|youtube-nocookie\.com\/embed\/)([a-zA-Z0-9_-]{11})/i,
    /^[a-zA-Z0-9_-]{11}$/
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  // Fallback con URL parser estándar si es una URL válida
  try {
    const urlObj = new URL(text.startsWith('http') ? text : `https://${text}`);
    if (urlObj.hostname.includes('youtube.com')) {
      const v = urlObj.searchParams.get('v');
      if (v && v.length === 11) return v;
      
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      if (pathParts.length > 0) {
        const lastPart = pathParts[pathParts.length - 1];
        if (lastPart.length === 11) return lastPart;
      }
    } else if (urlObj.hostname.includes('youtu.be')) {
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      if (pathParts.length > 0 && pathParts[0].length === 11) {
        return pathParts[0];
      }
    }
  } catch {
    // Si no es URL válida, ignorar
  }

  return null;
}

/**
 * Genera la URL segura y 100% compatible para el iframe embebido de YouTube.
 * Evita parámetros como 'origin' o 'enablejsapi' que causan bloqueos de seguridad en navegadores y YouTube CSP.
 * @param {string} videoIdOrUrl - ID o URL del video.
 * @param {object} options - Opciones de reproducción (autoplay, rel, start).
 * @returns {string} - URL lista para el atributo src del iframe.
 */
export function getYouTubeEmbedUrl(videoIdOrUrl, options = {}) {
  const videoId = extractYouTubeId(videoIdOrUrl);
  if (!videoId) return '';

  const {
    autoplay = 0,
    rel = 0,
    start = 0
  } = options;

  const params = new URLSearchParams();
  if (autoplay) params.set('autoplay', '1');
  if (rel === 0) params.set('rel', '0');
  if (start > 0) params.set('start', start.toString());

  const queryString = params.toString();
  return `https://www.youtube.com/embed/${videoId}${queryString ? `?${queryString}` : ''}`;
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
