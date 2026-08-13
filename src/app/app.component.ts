import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputOtpModule } from 'primeng/inputotp';

import { estadoDeRuta, routeAnimations } from './shared/animations/route-animations';

@Component({
  selector: 'app-root',
  imports: [ButtonModule, InputOtpModule, RouterModule, RouterOutlet],
  // El trigger existía pero no estaba registrado acá, así que el template lo
  // usaba contra una animación inexistente. Este outlet sólo alterna auth y
  // dashboard; la navegación entre vistas se anima en DashboardComponent.
  animations: [routeAnimations],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'cirsubfrontend';
  value = 0;

  prepareRoute(outlet: RouterOutlet): string {
    return estadoDeRuta(outlet);
  }
}
