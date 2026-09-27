import { Component, inject } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { InputOtpModule } from 'primeng/inputotp';

import { estadoDeRuta, routeAnimations } from './shared/animations/route-animations';
import { ActualizacionAppService } from './shared/services/actualizacion-app.service';
import { RegistroActividadService } from './shared/services/registro-actividad.service';

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

  constructor() {
    // Mantiene al día la versión instalada de la PWA. Ver el servicio: sin
    // esto, quien tiene la app instalada se queda con la versión vieja.
    inject(ActualizacionAppService).iniciar();
    // Cuenta las pantallas que abre cada asociado, para las estadísticas.
    inject(RegistroActividadService).iniciar();
  }

  prepareRoute(outlet: RouterOutlet): string {
    return estadoDeRuta(outlet);
  }
}
