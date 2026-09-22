import { InjectionToken } from '@angular/core';

/**
 * MODO DEMO DE LA ENCUESTA — PROVISORIO, para la presentación de la app.
 *
 * Prendido (true):
 *   - La encuesta aparece en el sidebar cada vez que se ingresa, aunque el
 *     asociado ya haya calificado antes.
 *   - Al calificar desaparece hasta el próximo ingreso, igual que en serio.
 *   - NO se manda nada al backend: el envío se simula. Staging usa la base de
 *     producción, y así las calificaciones de prueba no ensucian las reales.
 *
 * Apagado (false): el comportamiento normal. La encuesta se ofrece una sola
 * vez, mientras el perfil diga que el asociado no respondió, y se guarda.
 *
 * PARA VOLVER A LA NORMALIDAD: cambiar el `true` de abajo por `false`. Una vez
 * que no haga más falta, se puede borrar este archivo y lo que lo usa
 * (AuthService y CredencialService).
 *
 * Es un InjectionToken y no una constante para que los tests puedan probar
 * los dos modos sin tocar este archivo.
 */
export const ENCUESTA_MODO_DEMO = new InjectionToken<boolean>('ENCUESTA_MODO_DEMO', {
  providedIn: 'root',
  factory: () => true,
});
