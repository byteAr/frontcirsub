import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

import { EstadisticasService, Plataforma } from '../../admin/services/estadisticas.service';

/**
 * Le avisa al backend cada vez que el asociado abre una pantalla de la app,
 * y desde dónde: la app instalada (PWA) o el navegador. Con eso se arman las
 * estadísticas de uso.
 *
 * Sólo cuenta dentro de /dashboard, o sea con sesión iniciada: la pantalla de
 * login no suma. Y nunca molesta: si el aviso falla, se descarta en silencio.
 */
@Injectable({ providedIn: 'root' })
export class RegistroActividadService {
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly estadisticas = inject(EstadisticasService);

  iniciar(): void {
    this.router.events
      .pipe(filter((evento): evento is NavigationEnd => evento instanceof NavigationEnd))
      .subscribe((evento) => {
        if (!evento.urlAfterRedirects.startsWith('/dashboard')) return;
        if (!localStorage.getItem('token')) return;

        this.estadisticas.registrarActividad(this.plataforma()).subscribe({ error: () => undefined });
      });
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
}
