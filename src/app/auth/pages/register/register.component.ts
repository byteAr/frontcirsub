import { InputTextModule } from 'primeng/inputtext';
import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DatePicker } from 'primeng/datepicker';
import { FloatLabel } from 'primeng/floatlabel';
import { TramitesService } from '../../../admin/services/tramites.service';
import { SelectModule } from 'primeng/select';
import { AuthService } from '../../services/auth.service';

export interface tipoDni {
  id: number;
  detalle: string
}

@Component({
  selector: 'app-register',
  imports: [RouterLink, DatePicker, ReactiveFormsModule, CommonModule, FloatLabel, InputTextModule, SelectModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {



  tiposDni: tipoDni[] | undefined;
  selectPerioricidad: tipoDni | undefined;

  fb = inject(FormBuilder);

  tramitesService = inject(TramitesService);

  authService = inject(AuthService);

  formRegister = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(4)]],
    apellido: ['',[ Validators.required, Validators.minLength(4)]],
    tipodni:[Validators.required],
    dni: ['',[Validators.required, Validators.minLength(7), Validators.pattern(/^\d+$/)]],
    fechaNacimiento: [Date ,Validators.required ]
  })

  ngOnInit(): void {
    this.tramitesService.getTypesDni()
    .subscribe( resp => {
      this.tiposDni = resp
    })
  }

  sendRegister(){
    this.authService.createPerson(this.formRegister.value)
      .subscribe(resp => {
        console.log(resp);
      })

  }

}
