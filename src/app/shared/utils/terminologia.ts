/**
 * La mutual pasó a decir "asociado" donde antes decía "socio". Los textos de
 * la app ya están cambiados, pero algunos llegan desde la base —por ejemplo el
 * cargo que muestra la credencial— y se traducen al mostrarlos.
 *
 * Sólo reemplaza la palabra entera: "Cuota social" o "asociado" no se tocan.
 * Respeta cómo venía escrita: SOCIO -> ASOCIADO, Socio -> Asociado,
 * socio -> asociado, y también el femenino y el plural.
 */
const PALABRA_SOCIO = /\bsoci([oa])(s?)\b/gi;

export function comoAsociado(texto: string | null | undefined): string {
  return (texto ?? '').replace(PALABRA_SOCIO, (original, vocal: string, plural: string) => {
    const reemplazo = `asociad${vocal.toLowerCase()}${plural.toLowerCase()}`;

    if (original === original.toUpperCase()) return reemplazo.toUpperCase();
    if (original[0] === original[0].toUpperCase()) {
      return reemplazo.charAt(0).toUpperCase() + reemplazo.slice(1);
    }
    return reemplazo;
  });
}
