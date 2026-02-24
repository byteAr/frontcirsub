import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PushNotificationService {
  private swPush = inject(SwPush);
  private http = inject(HttpClient);
  private url = environment.API_URL;

  async subscribeAfterLogin(userId: number): Promise<void> {
    if (!this.swPush.isEnabled) return;
    if (!('Notification' in window)) return;

    try {
      const subscription = await this.swPush.requestSubscription({
        serverPublicKey: environment.vapidPublicKey,
      });

      await firstValueFrom(
        this.http.post(`${this.url}/push/subscribe`, {
          userId,
          endpoint: subscription.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
            auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))),
          },
        }),
      );
    } catch {
      // El usuario rechazó el permiso o el SW no está disponible (modo dev).
      // No bloqueamos el flujo de login.
    }
  }
}
