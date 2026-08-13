import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';

import { AuthService } from '../../../auth/services/auth.service';
import { LayoutService } from '../../../shared/services/layout.service';

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
  layout = inject(LayoutService);

  /** Submenú de Beneficios: arranca cerrado y se abre al tocarlo. */
  beneficiosAbierto = signal<boolean>(false);

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

  alternarBeneficios(): void {
    this.beneficiosAbierto.update(abierto => !abierto);
  }

  /** Al navegar se cierra, si no tapa la vista que el socio acaba de elegir. */
  cerrar(): void {
    this.layout.cerrarSidebar();
  }
}
