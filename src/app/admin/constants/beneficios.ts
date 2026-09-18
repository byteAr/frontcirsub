/**
 * Lo que tienen en común todas las pantallas que hablan de beneficios: la
 * vista de Beneficios y el aviso de "no adherido" al pedir un reintegro.
 * Vive en un solo lugar para que el nombre y el WhatsApp de adhesión no se
 * desencuentren entre una y otra.
 */

/** Claves tal como vienen en userData.Beneficios de sp_Perfil_completo_detallado. */
export type ClaveBeneficio = 'far' | 'eva' | 'sep' | 'seg';

export const NOMBRE_BENEFICIO: Record<ClaveBeneficio, string> = {
  far: 'Farmacia',
  eva: 'Evacuaciones',
  sep: 'Seguro de sepelio',
  seg: 'Seguro de vida',
};

/** Número de adhesiones. */
export const WHATSAPP_ADHESIONES = '5491126526532';

export function enlaceWhatsapp(numero: string, mensaje: string): string {
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}

/**
 * El mensaje ya nombra el beneficio: así quien atiende sabe de entrada a qué
 * se quiere adherir el socio, en vez de tener que preguntarle.
 */
export function enlaceAdhesion(clave: ClaveBeneficio): string {
  return enlaceWhatsapp(
    WHATSAPP_ADHESIONES,
    `Hola, quiero adherirme al beneficio de ${NOMBRE_BENEFICIO[clave]}.`,
  );
}
