import { inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter, interval } from 'rxjs';

/** Cada seis horas alcanza: la app se usa de a ratos, no todo el día. */
const CADA_SEIS_HORAS = 6 * 60 * 60 * 1000;

/**
 * Mantiene al día la versión instalada de la PWA.
 *
 * Sin esto, quien tiene la app instalada se queda con la versión que bajó el
 * día que la instaló hasta que cierre del todo la aplicación, y eso puede
 * tardar semanas. Es un problema real y no sólo estético: hay cambios que
 * necesitan que el front y el backend vayan a la par —el del CBU, sin ir más
 * lejos— y un front viejo contra el backend nuevo falla.
 *
 * Cómo funciona: cuando el service worker termina de bajar una versión nueva,
 * se la activa enseguida pero **no se recarga en el acto**, porque el asociado
 * puede estar a mitad de un formulario. Se espera al próximo cambio de
 * pantalla, que es un momento seguro, y ahí se recarga. Para quien entra y
 * navega, es instantáneo e invisible.
 */
@Injectable({ providedIn: 'root' })
export class ActualizacionAppService {
  private readonly swUpdate = inject(SwUpdate);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);

  private recargaPendiente = false;

  iniciar(): void {
    // En desarrollo y en los tests el service worker está apagado.
    if (!this.swUpdate.isEnabled) return;

    this.swUpdate.versionUpdates
      .pipe(filter((evento): evento is VersionReadyEvent => evento.type === 'VERSION_READY'))
      .subscribe(() => {
        this.swUpdate.activateUpdate().then(() => (this.recargaPendiente = true));
      });

    this.router.events
      .pipe(filter((evento) => evento instanceof NavigationEnd))
      .subscribe(() => {
        if (this.recargaPendiente) {
          this.recargaPendiente = false;
          this.document.defaultView?.location.reload();
        }
      });

    // Una consulta al entrar y otra cada seis horas, para las sesiones largas.
    this.buscarActualizacion();
    interval(CADA_SEIS_HORAS).subscribe(() => this.buscarActualizacion());
  }

  private buscarActualizacion(): void {
    // Si falla —sin conexión, por ejemplo— no importa: se reintenta después.
    this.swUpdate.checkForUpdate().catch(() => undefined);
  }
}
