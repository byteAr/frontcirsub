import { InputTextModule } from 'primeng/inputtext';
import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

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
  imports: [RouterLink, ReactiveFormsModule, CommonModule, InputTextModule, SelectModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {



  selectPerioricidad: tipoDni | undefined;

  fb = inject(FormBuilder);

  tramitesService = inject(TramitesService);

  authService = inject(AuthService);

  formRegister = this.fb.group({
    dni: ['',[Validators.required, Validators.minLength(7), Validators.pattern(/^\d+$/)]],
    telefono: ['',[Validators.required, Validators.minLength(8), Validators.pattern(/^\d+$/)]],
  })

  ngOnInit(): void {
  }

  sendRegister(){
    const dni = this.formRegister.controls['dni'].value;
    if(!dni) return
    this.authService.register(dni)
      .subscribe(resp => {
        console.log(resp);
      })

  }

}
