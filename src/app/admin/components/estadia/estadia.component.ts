import { Component, inject } from '@angular/core';
import { AdherirseComponent } from "../adherirse/adherirse.component";
import { AuthService } from '../../../auth/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-estadia',
  imports: [AdherirseComponent, CommonModule],
  templateUrl: './estadia.component.html',
  styleUrl: './estadia.component.css'
})
export default class EstadiaComponent {

  evacuacion = inject(AuthService);

  user = this.evacuacion.user

}
