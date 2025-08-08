import { Component, DestroyRef, effect, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-personal-date-credential',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './personal-date-credential.component.html',
  styleUrl: './personal-date-credential.component.css'
})
export default class PersonalDateCredentialComponent implements OnInit {

  private destroyRef = inject(DestroyRef);
  private http = inject(HttpClient);
  autService = inject(AuthService);
  private sanitizer = inject(DomSanitizer);

  imagenUrl: SafeUrl | null = null;
  loading = signal<boolean>(true);
  hasImage = signal<boolean>(false);
  private objectUrl?: string;

  user = this.autService.user;

  constructor() {
    // Hidrata sesión (si ya usás APP_INITIALIZER, podés omitirlo)

    this.autService.checkStatus().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();

    // Reacciona al cambio de usuario; sólo pide imagen cuando hay Id
    effect(() => {
      const id = this.autService.user()?.Persona?.[0]?.Id;

      // Si aún no hay user/Id, resetea y muestra spinner
      if (!id) {
        this.loading.set(true);
        this.hasImage.set(false);
        this.clearObjectUrl();
        this.imagenUrl = null;
        return;
      }

      // Carga la imagen para el Id
      this.loading.set(true);
      this.http.get(this.autService.getProfileImageUrl(id), { responseType: 'blob' })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (blob) => {
            this.clearObjectUrl();
            this.objectUrl = URL.createObjectURL(blob);
            this.imagenUrl = this.sanitizer.bypassSecurityTrustUrl(this.objectUrl);
            this.hasImage.set(true);
            this.loading.set(false);
          },
          error: () => {
            this.clearObjectUrl();
            this.imagenUrl = null;
            this.hasImage.set(false);
            this.loading.set(false);
          }
        });
    });
  }
  ngOnInit(): void {
    this.autService.checkStatus().subscribe();
  }

  ngOnDestroy() {
    this.clearObjectUrl();
  }

  private clearObjectUrl() {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = undefined;
    }
  }
}
