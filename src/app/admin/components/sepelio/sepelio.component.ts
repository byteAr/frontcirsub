import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { AuthService } from '../../../auth/services/auth.service';
import { AdherirseComponent } from "../adherirse/adherirse.component";

interface Seguro {
  tipoSeguro: string;
  estado: boolean;
  fechaDeAlta: string;
}

@Component({
  selector: 'app-sepelio',
  imports: [CommonModule, AdherirseComponent],
  templateUrl: './sepelio.component.html',
  styleUrl: './sepelio.component.css'
})
export default class SepelioComponent {

authService = inject(AuthService)

user = this.authService.user

  tieneSeguroSepelio = computed(() =>
    (this.user()?.Beneficios ?? []).some(
      (b) => b.sep === true
    )
  );

  tieneSeguroVida = computed(() =>
    (this.user()?.Beneficios ?? []).some(
      (b) => b.seg === true
    )
  );

  notieneNada() {
    if(this.tieneSeguroSepelio() || this.tieneSeguroVida()) {
      return true;
    } else {
      return false;
    }
  }
}


