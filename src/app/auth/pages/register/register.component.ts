// src/app/register/register.component.ts

import { InputTextModule } from 'primeng/inputtext';
import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';


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
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, CommonModule, InputTextModule, SelectModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {

  selectPerioricidad: tipoDni | undefined;

  fb = inject(FormBuilder);
  router = inject(Router);
  tramitesService = inject(TramitesService);
  authService = inject(AuthService);

  user: any;
  visible: boolean = true;
  error: string = '';

  formSubmitted: boolean = false;

  formRegister = this.fb.group({
    dni: ['', [Validators.required, Validators.minLength(7), Validators.pattern(/^\d+$/)]],
    telefono: ['', [
      Validators.required,
      Validators.pattern('^[0-9]*$'),
      Validators.minLength(8),
      Validators.maxLength(12)
    ]],
    email: ['', [Validators.required, Validators.email, Validators.minLength(8)]],
  });

  ngOnInit(): void {
  }

  omitirNoNumeros(event: KeyboardEvent): void {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      event.preventDefault();
    }
  }

  sendRegister() {
    this.formSubmitted = true;

    if (this.visible) {
      if (this.dniControl.invalid) {
        console.log('DNI inválido. Errores:', this.dniControl.errors);
        return;
      }


      const dni = this.formRegister.controls['dni'].value as string;




      this.authService.register(dni)
        .subscribe(resp => {
          this.user = resp;
          if (resp) {
            this.visible = false;
            this.error = '';
            this.formSubmitted = false;
            this.telefonoControl.markAsUntouched();
            this.telefonoControl.markAsPristine();
            this.emailControl.markAsUntouched();
            this.emailControl.markAsPristine();

          } else {
            this.error = 'DNI no encontrado o inválido';
            console.log(this.error);
          }
          console.log(this.user);
        }, error => {
          this.error = 'Error al verificar DNI. Intente nuevamente.';
          console.error(error);
        });

    } else {
      if (this.formRegister.invalid) {
        console.log('Formulario de contacto inválido. Errores Teléfono:', this.telefonoControl.errors);
        console.log('Errores Email:', this.emailControl.errors);
        return;
      }

      console.log('Formulario de contacto válido y enviado:', this.formRegister.value);
      const telefono = this.formRegister.controls['telefono'].value as string;
      const email = this.formRegister.controls['email'].value as string;

      this.authService.sendOtp(`+549${telefono}`,email)
        .subscribe({
          next: (resp)=> {
            console.log('respuesta del backend', resp);

          }
        })



      this.router.navigateByUrl('/auth/verify-code');
    }
  }

  get dniControl(): FormControl {
    return this.formRegister.get('dni') as FormControl;
  }

  get telefonoControl(): FormControl {
    return this.formRegister.get('telefono') as FormControl;
  }

  get emailControl(): FormControl {
    return this.formRegister.get('email') as FormControl;
  }
}
