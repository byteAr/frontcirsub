// src/app/install-button.component.ts
import { Component, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InstallPwaService } from '../../services/install-pwa.service';

@Component({
  selector: 'app-install-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './install-button.component.html',
  styleUrl: './install-button.component.css'
})
export class InstallButtonComponent {
  canPrompt = signal(false);
  iosHint = signal(false);
  msg = signal('');

  constructor(private pwa: InstallPwaService) {
    // puente RxJS → signals
    this.pwa.canPrompt$.subscribe(v => this.canPrompt.set(v));
    this.pwa.isIosStandaloneBlocked$.subscribe(v => this.iosHint.set(v));
  }

  async install() {
    const outcome = await this.pwa.promptInstall();
    if (outcome === 'accepted') this.msg.set('¡Gracias! Instalación iniciada ✅');
    else if (outcome === 'dismissed') this.msg.set('Instalación cancelada');
    else this.msg.set('Instalación no disponible');
  }
}
