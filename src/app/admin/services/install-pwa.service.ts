// src/app/install-pwa.service.ts
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

declare global {
  interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  }
}

@Injectable({ providedIn: 'root' })
export class InstallPwaService {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;

  // Para mostrar/ocultar botón “Instalar”
  readonly canPrompt$ = new BehaviorSubject<boolean>(false);
  // Para mostrar fallback de iOS
  readonly isIosStandaloneBlocked$ = new BehaviorSubject<boolean>(false);

  constructor() {
    // ya instalada ⇒ ocultar botón
    const isStandalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      // iOS viejo:
      (window.navigator as any).standalone === true;

    if (isStandalone) this.canPrompt$.next(false);

    // iOS/Safari no dispara beforeinstallprompt
    const ua = window.navigator.userAgent || '';
    const isIOS = /iphone|ipad|ipod/i.test(ua);
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);

    if (isIOS && isSafari && !isStandalone) {
      this.isIosStandaloneBlocked$.next(true);
    }

    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      this.canPrompt$.next(true);
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.canPrompt$.next(false);
      this.isIosStandaloneBlocked$.next(false);
      console.log('PWA instalada ✅');
    });
  }

  async promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
    if (!this.deferredPrompt) return 'unavailable';
    this.canPrompt$.next(false); // oculto para evitar doble click
    await this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    this.deferredPrompt = null;
    return outcome;
  }
}
