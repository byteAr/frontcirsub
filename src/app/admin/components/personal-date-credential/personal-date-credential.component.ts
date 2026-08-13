import { Component, computed, inject } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-personal-date-credential',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './personal-date-credential.component.html',
  styleUrl: './personal-date-credential.component.css'
})
export default class PersonalDateCredentialComponent {

  autService = inject(AuthService);
  private sanitizer = inject(DomSanitizer);

  user = this.autService.user;

  /**
   * La descarga la maneja AuthService: acá sólo se dibuja. La credencial
   * espera a que la foto esté resuelta antes de montar este componente, así
   * que cuando se ve ya no hay nada pendiente de cargar.
   */
  imagenUrl = computed<SafeUrl | null>(() => {
    const url = this.autService.imagenPerfilUrl();
    return url ? this.sanitizer.bypassSecurityTrustUrl(url) : null;
  });

  hasImage = computed(() => !!this.autService.imagenPerfilUrl());
}
