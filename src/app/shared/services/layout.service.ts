import { Injectable, signal } from '@angular/core';

/**
 * Estado del sidebar. Vive en un servicio y no en el layout porque lo abre el
 * header (la hamburguesa) y lo cierra el propio sidebar al navegar.
 */
@Injectable({
  providedIn: 'root'
})
export class LayoutService {

  readonly sidebarAbierto = signal<boolean>(false);

  abrirSidebar(): void {
    this.sidebarAbierto.set(true);
  }

  cerrarSidebar(): void {
    this.sidebarAbierto.set(false);
  }

  alternarSidebar(): void {
    this.sidebarAbierto.update(abierto => !abierto);
  }
}
