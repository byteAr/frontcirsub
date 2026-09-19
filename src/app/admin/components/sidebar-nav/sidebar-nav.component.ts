import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';

import { AuthService } from '../../../auth/services/auth.service';
import { LayoutService } from '../../../shared/services/layout.service';
import { GestionListasService } from '../../services/gestion-listas.service';

@Component({
  selector: 'app-sidebar-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar-nav.component.html',
  styleUrl: './sidebar-nav.component.css'
})
export class SidebarNavComponent {

  private router = inject(Router);
  private authService = inject(AuthService);
  private gestionListasService = inject(GestionListasService);
  layout = inject(LayoutService);

  /**
   * "Mis ahorros" y "Ayuda económica" se ofrecen sólo si el sistema de gestión
   * los habilita para el socio. Arrancan ocultos y aparecen cuando se
   * confirma: es menos molesto que mostrarlos y sacarlos a los dos segundos.
   */
  mostrarAhorros = signal<boolean>(false);
  mostrarAyudaEconomica = signal<boolean>(false);

  constructor() {
    this.gestionListasService.getListas().subscribe({
      next: ({ ahorros, ayudasEconomicas }) => {
        this.mostrarAhorros.set(ahorros.muestra);
        this.mostrarAyudaEconomica.set(ayudasEconomicas.muestra);
      },
      // Si no se pudo consultar, se ofrecen igual: cada vista tiene su propio
      // reintento, y es peor esconderle al socio algo que sí tiene.
      error: () => {
        this.mostrarAhorros.set(true);
        this.mostrarAyudaEconomica.set(true);
      },
    });
  }

  private urlActual = toSignal(
    this.router.events.pipe(
      filter((evento): evento is NavigationEnd => evento instanceof NavigationEnd),
      map(evento => evento.urlAfterRedirects),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  /** "Credencial Virtual" sólo aparece cuando no se está viendo la credencial. */
  mostrarCredencial = computed(() => !this.urlActual().includes('/dashboard/credencial'));

  /** La encuesta se ofrece sólo mientras el socio no la haya respondido. */
  mostrarEncuesta = computed(
    () => this.authService.user()?.Persona?.[0]?.Encuesta === false
  );

  /** Al navegar se cierra, si no tapa la vista que el socio acaba de elegir. */
  cerrar(): void {
    this.layout.cerrarSidebar();
  }
}
