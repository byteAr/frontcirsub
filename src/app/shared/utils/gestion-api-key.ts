/**
 * Clave que espera el sistema PHP de gestion.cirsubgn.org.ar en el header
 * X-API-KEY: la fecha del día en horario argentino con un prefijo fijo.
 *
 * Es el mismo helper que ya tiene el backend en common/gestion-api-key.ts.
 * Está duplicado a propósito: el listado de valores y tipos de trámite lo pide
 * el navegador directo al PHP, sin pasar por NestJS.
 *
 * La zona va explícita y no se toma del reloj del dispositivo: un celular con
 * la hora mal configurada, o un socio viajando, generaría la clave de otro día
 * y el PHP contestaría 401.
 */
export function buildGestionApiKey(fecha: Date = new Date()): string {
  const partes = new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  }).formatToParts(fecha);

  const dd = partes.find(p => p.type === 'day')!.value;
  const mm = partes.find(p => p.type === 'month')!.value;
  const yy = partes.find(p => p.type === 'year')!.value;

  return `api-key-tk-${dd}${mm}${yy}`;
}

/** Base de las funciones PHP del sistema de gestión. */
export const GESTION_API_BASE =
  'https://gestion.cirsubgn.org.ar/Cirsub/CirsubApp/Migrante/funciones';
