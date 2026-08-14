/**
 * Entorno de pruebas.
 *
 * La API va por ruta relativa a propósito: el mismo bundle sirve tanto para
 * https://credencialtest.cirsubgn.org.ar como para el acceso por VPN en
 * https://192.168.1.2:4300, porque en los dos casos hay un nginx adelante que
 * reparte /api hacia el backend. De paso desaparece el CORS —es el mismo
 * origen— y la cookie de Cloudflare Access cubre las llamadas del navegador
 * sin hacer nada especial.
 *
 * vapidPublicKey va vacío: en staging las push están apagadas, el backend no
 * tiene claves VAPID cargadas.
 */
export const environment = {
  API_URL: '/api',
  vapidPublicKey: '',
};
