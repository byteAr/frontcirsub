import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-personal-date-credential',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './personal-date-credential.component.html',
  styleUrl: './personal-date-credential.component.css'
})
export default class PersonalDateCredentialComponent {

  private destroyRef = inject(DestroyRef);
  private http = inject(HttpClient);
  autService = inject(AuthService);
  private sanitizer = inject(DomSanitizer);

  imagenUrl: SafeUrl | null = null;
  loading = signal<boolean>(true);
  hasImage = signal<boolean>(false);

  user = this.autService.user;

  constructor() {
    // Hidrata sesión (si ya usás APP_INITIALIZER, podés omitirlo)
    this.autService.checkStatus().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();

    // Reacciona al cambio de usuario; sólo pide imagen cuando hay Id
    effect(() => {
      const id = this.autService.user()?.Persona?.[0]?.Id;

      if (!id) {
        this.loading.set(true);
        this.hasImage.set(false);
        this.imagenUrl = null;
        return;
      }

      const cachedUrl = this.autService.getCachedProfileImageUrl(id);
      if (cachedUrl) {
        this.imagenUrl = this.sanitizer.bypassSecurityTrustUrl(cachedUrl);
        this.hasImage.set(true);
        this.loading.set(false);
        return;
      }

      this.loading.set(true);
      this.http.get(this.autService.getProfileImageUrl(id), { responseType: 'blob' })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (blob) => {
            const objectUrl = URL.createObjectURL(blob);
            this.autService.cacheProfileImageUrl(id, objectUrl);
            this.imagenUrl = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
            this.hasImage.set(true);
            this.loading.set(false);
          },
          error: () => {
            this.imagenUrl = null;
            this.hasImage.set(false);
            this.loading.set(false);
          }
        });
    });
  }
}
