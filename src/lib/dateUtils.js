/**
 * Utilitario de fechas seguro contra desfases de zona horaria (UTC vs Local)
 * Garantiza que fechas sin zona horaria o almacenadas en UTC a medianoche no retrocedan un día en zonas horarias occidentales (ej. GMT-5 Colombia).
 */

/**
 * Parsea una fecha en formato string ("YYYY-MM-DD", "YYYY-MM-DDTHH:mm", etc.)
 * garantizando que se interprete en la zona horaria local del navegador
 * sin retroceder un día por desfase UTC.
 * 
 * @param {string|Date} dateInput 
 * @returns {Date|null}
 */
export function parseLocalDate(dateInput) {
  if (!dateInput) return null;
  if (dateInput instanceof Date) return isNaN(dateInput.getTime()) ? null : dateInput;

  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    // Caso 1: Formato sólo fecha "YYYY-MM-DD"
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [y, m, d] = trimmed.split('-').map(Number);
      return new Date(y, m - 1, d, 0, 0, 0);
    }

    // Caso 2: Formato "YYYY-MM-DDTHH:mm" o con segundos sin zona horaria
    const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/);
    if (match && !trimmed.endsWith('Z') && !trimmed.includes('+') && !trimmed.includes('-05')) {
      const [, y, m, d, h, min, s] = match;
      return new Date(Number(y), Number(m) - 1, Number(d), Number(h), Number(min), Number(s || 0));
    }

    // Caso 3: Si tiene T00:00:00+00:00 o T00:00:00Z (guardado en UTC a medianoche para una fecha específica)
    // Extraer la fecha YYYY-MM-DD original para no retroceder de día
    if (/^\d{4}-\d{2}-\d{2}T00:00:00(\.0+)?(\+00:00|Z)?$/.test(trimmed)) {
      const [y, m, d] = trimmed.slice(0, 10).split('-').map(Number);
      return new Date(y, m - 1, d, 0, 0, 0);
    }
  }

  const fallback = new Date(dateInput);
  return isNaN(fallback.getTime()) ? null : fallback;
}

/**
 * Convierte cualquier fecha a formato "YYYY-MM-DDTHH:mm" para <input type="datetime-local">
 * utilizando los componentes locales del usuario, NO UTC.
 * 
 * @param {string|Date} dateInput 
 * @returns {string}
 */
export function toLocalDatetimeInput(dateInput) {
  if (!dateInput) return '';
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput.trim())) {
    return `${dateInput.trim()}T00:00`;
  }
  const d = parseLocalDate(dateInput);
  if (!d) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Convierte cualquier fecha a formato "YYYY-MM-DD" para <input type="date">
 * utilizando los componentes locales del usuario.
 * 
 * @param {string|Date} dateInput 
 * @returns {string}
 */
export function toLocalDateInput(dateInput) {
  if (!dateInput) return '';
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput.trim())) {
    return dateInput.trim();
  }
  const d = parseLocalDate(dateInput);
  if (!d) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formateador seguro de fecha en español para eventos y noticias
 */
export function formatFriendlyDate(dateInput, options = {}) {
  const d = parseLocalDate(dateInput);
  if (!d) return '';
  return d.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...options
  });
}
