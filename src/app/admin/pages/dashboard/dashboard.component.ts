import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { AppHeaderComponent } from '../../components/app-header/app-header.component';
import { SidebarNavComponent } from '../../components/sidebar-nav/sidebar-nav.component';

/**
 * Layout del área privada: header arriba, sidebar deslizante a la izquierda y
 * la vista de la ruta activa en el medio. Antes cada vista se renderizaba
 * dentro de la credencial; ahora la credencial es una vista más.
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterOutlet, FooterComponent, AppHeaderComponent, SidebarNavComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export default class DashboardComponent {}
