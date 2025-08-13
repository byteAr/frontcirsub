import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AuthService } from '../../../auth/services/auth.service';

interface Seguro {
  tipoSeguro: string;
  estado: boolean;
  fechaDeAlta: string;
}

@Component({
  selector: 'app-sepelio',
  imports: [CommonModule],
  templateUrl: './sepelio.component.html',
  styleUrl: './sepelio.component.css'
})
export default class SepelioComponent {

authService = inject(AuthService)

user = this.authService.user
}
