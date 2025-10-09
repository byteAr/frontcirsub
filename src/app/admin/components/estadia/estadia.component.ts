import { Component, computed, inject, OnInit } from '@angular/core';
import { AdherirseComponent } from "../adherirse/adherirse.component";
import { AuthService } from '../../../auth/services/auth.service';
import { CommonModule } from '@angular/common';



@Component({
  selector: 'app-estadia',
  imports: [AdherirseComponent, CommonModule],
  templateUrl: './estadia.component.html',
  styleUrl: './estadia.component.css'
})
export default class EstadiaComponent implements OnInit{


  evacuacion = inject(AuthService);

  user = this.evacuacion.user;

  ngOnInit(): void {
    console.log('estes es el User', this.user());

    ;
  }

  tieneBeneficio2 = computed(() =>
    (this.user()?.Beneficios ?? []).some(
      (b) => b.eva === true
    )
  );


}
