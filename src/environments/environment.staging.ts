/**
 * Entorno de pruebas: corre en el servidor, detrás de la VPN, sobre IP privada.
 * No hay dominio, por eso la API va por IP y puerto.
 *
 * vapidPublicKey va vacío a propósito: en staging las push están apagadas
 * (el backend no tiene claves VAPID cargadas), así que no tiene sentido que el
 * navegador intente suscribirse.
 */
export const environment = {
  API_URL: 'https://192.168.1.2:3010',
  vapidPublicKey: '',
};
