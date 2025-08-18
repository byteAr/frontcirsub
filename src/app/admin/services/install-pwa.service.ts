// src/app/install-pwa.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

declare global {
  interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  }
  interface Window {
    __bipEvent?: BeforeInstallPromptEvent | null;
    __bipSubscribers?: Array<(e: BeforeInstallPromptEvent) => void>;
  }
}

@Injectable({ providedIn: 'root' })
export class InstallPwaService {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;

  // Mostrar/ocultar botón “Instalar”
  readonly canPrompt$ = new BehaviorSubject<boolean>(false);
  // Fallback iOS (no hay beforeinstallprompt)
  readonly isIosStandaloneBlocked$ = new BehaviorSubject<boolean>(false);

  constructor() {
    // 1) Ya instalada ⇒ ocultar botón
    const isStandalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true;

    if (isStandalone) this.canPrompt$.next(false);

    // 2) iOS/Safari (no dispara beforeinstallprompt)
    const ua = navigator.userAgent || '';
    const isIOS = /iphone|ipad|ipod/i.test(ua);
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
    if (isIOS && isSafari && !isStandalone) {
      this.isIosStandaloneBlocked$.next(true);
    }

    // 3) Si el evento ya ocurrió ANTES de que naciera el servicio, recupéralo del buffer global
    if (window.__bipEvent) {
      this.deferredPrompt = window.__bipEvent;
      this.canPrompt$.next(true);
    }

    // 4) Suscríbete para futuros disparos (en esta misma sesión)
    window.__bipSubscribers?.push((bip) => {
      this.deferredPrompt = bip;
      this.canPrompt$.next(true);
    });

    // 5) app instalada
    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.canPrompt$.next(false);
      this.isIosStandaloneBlocked$.next(false);
      console.log('PWA instalada ✅');
    });
  }

  async promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
    if (!this.deferredPrompt) return 'unavailable';
    this.canPrompt$.next(false); // evitar doble click
    await this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    this.deferredPrompt = null;
    return outcome;
  }
}
