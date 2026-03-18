import DOMPurify from 'dompurify';

/**
 * Sanitiza contenido HTML para su uso con dangerouslySetInnerHTML.
 * Permite etiquetas básicas de formato pero elimina scripts y atributos peligrosos.
 */
export function sanitizeHTML(html) {
  if (!html) return '';
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li', 'br', 
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span', 'blockquote',
      'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'class']
  });
}

/**
 * Sanitiza texto plano eliminando cualquier etiqueta HTML.
 * Útil para campos como nombres de proyectos u observaciones.
 */
export function sanitizeText(text) {
  if (!text) return '';
  // Elimina todas las etiquetas HTML
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}
