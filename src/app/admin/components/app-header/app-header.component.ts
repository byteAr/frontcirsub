import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../auth/services/auth.service';
import { AdminNotifService } from '../../../shared/services/admin-notif.service';
import { LayoutService } from '../../../shared/services/layout.service';

@Component({
  selector: 'app-app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './app-header.component.html',
  styleUrl: './app-header.component.css'
})
export class AppHeaderComponent {

  private router = inject(Router);
  authService = inject(AuthService);
  adminNotifService = inject(AdminNotifService);
  layout = inject(LayoutService);

  salir(): void {
    this.authService.logout();
    this.router.navigateByUrl('/auth/login');
  }
}
