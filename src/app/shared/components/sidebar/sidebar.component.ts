import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';

import { BadgeModule } from 'primeng/badge';
import { OverlayBadgeModule } from 'primeng/overlaybadge';

@Component({
  selector: 'app-sidebar',
  imports: [DrawerModule, ButtonModule, CommonModule, RouterModule, BadgeModule, OverlayBadgeModule],
  templateUrl: './sidebar.component.html',
  styleUrl:'./sidebar.component.css'
})
export class SidebarComponent {
  badge: number = 2;
  isLeftSidebarCollapsed = input.required<boolean>();
  changeIsLeftSidebarCollapsed = output<boolean>();
  items = [
    {
      routeLink: 'notificaciones',
      icon: 'fal fa-solid fa-bell',
      label: 'Notificaciones',
      badge: true
    },
    {
      routeLink: 'tramites',
      icon: 'fal fa-solid fa-file-signature',
      label: 'Tramites',
    },
    {
      routeLink: 'credencial',
      icon: 'fal fa-address-card',
      label: 'Credencial Virtual',
    },
    {
      routeLink: 'pages',
      icon: 'fal fa-file',
      label: 'Pages',
    },
    {
      routeLink: 'settings',
      icon: 'fal fa-cog',
      label: 'Settings',
    },
  ];

  toggleCollapse(): void {
    this.changeIsLeftSidebarCollapsed.emit(!this.isLeftSidebarCollapsed());
  }

  closeSidenav(): void {
    this.changeIsLeftSidebarCollapsed.emit(true);
  }

}
