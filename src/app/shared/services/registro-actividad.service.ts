import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, fromEvent, interval } from 'rxjs';

import { EstadisticasService, Plataforma } from '../../admin/services/estadisticas.service';

/**
 * Cada cuánto avisa la app que sigue abierta. El backend da a alguien por ido
 * a los 2 minutos sin noticias, así que 30 segundos deja cuatro latidos de
 * margen para una red lenta.
 */
const LATIDO_MS = 30_000;

/**
 * Le cuenta al backend cómo usa la app cada asociado, para las estadísticas:
 *
 * - **Visita**: cada pantalla que abre, y desde dónde (app instalada o
 *   navegador).
 * - **Latido**: mientras la app está a la vista, cada 30 segundos, aunque no
 *   toque nada. Es lo que lo mantiene en "usando la app ahora" mientras lee.
 * - **Salida**: al cerrarla, mandarla al fondo o cerrar sesión. Sale de
 *   "ahora" en el acto, en lugar de esperar a que venza.
 *
 * Sólo con sesión iniciada y dentro de /dashboard: la pantalla de login no
 * cuenta. Y nunca molesta: si un aviso falla, se descarta en silencio.
 */
@Injectable({ providedIn: 'root' })
export class RegistroActividadService {
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly estadisticas = inject(EstadisticasService);

  private urlActual = '';

  iniciar(): void {
    this.router.events
      .pipe(filter((evento): evento is NavigationEnd => evento instanceof NavigationEnd))
      .subscribe((evento) => {
        this.urlActual = evento.urlAfterRedirects;
        if (this.enLaApp()) {
          this.estadisticas.registrarActividad(this.plataforma()).subscribe({ error: () => undefined });
        }
      });

    interval(LATIDO_MS).subscribe(() => {
      if (this.enLaApp() && this.aLaVista()) this.latir();
    });

    // En el celular, cerrar la app o cambiar a otra la pasa a "hidden": es el
    // único aviso confiable, porque al cerrarla del todo no llega ningún otro.
    fromEvent(this.document, 'visibilitychange').subscribe(() => {
      if (!this.enLaApp()) return;
      if (this.aLaVista()) this.latir();
      else this.salir();
    });

    const ventana = this.document.defaultView;
    if (ventana) {
      fromEvent(ventana, 'pagehide').subscribe(() => {
        if (this.enLaApp()) this.salir();
      });
    }
  }

  /** Avisa que el asociado se fue. Lo llama también el cierre de sesión. */
  salir(): void {
    this.estadisticas.avisarSalida(this.plataforma());
  }

  /**
   * La app instalada se abre en modo "standalone", sin barra del navegador.
   * iOS no implementa el media query y lo expone en `navigator.standalone`.
   */
  plataforma(): Plataforma {
    const ventana = this.document.defaultView;
    const instalada =
      ventana?.matchMedia?.('(display-mode: standalone)').matches ||
      (ventana?.navigator as { standalone?: boolean } | undefined)?.standalone === true;

    return instalada ? 'pwa' : 'web';
  }

  private latir(): void {
    this.estadisticas.latido(this.plataforma()).subscribe({ error: () => undefined });
  }

  private enLaApp(): boolean {
    return this.urlActual.startsWith('/dashboard') && !!localStorage.getItem('token');
  }

  private aLaVista(): boolean {
    return this.document.visibilityState !== 'hidden';
  }
}
