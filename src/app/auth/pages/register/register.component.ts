// src/app/register/register.component.ts

import { InputTextModule } from 'primeng/inputtext';
import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormControl,  AbstractControl, ValidationErrors } from '@angular/forms';
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
  authService = inject(AuthService);

  user: any;
  visible: boolean = true;
  formotp: boolean = false
  error: string = '';
  repass: boolean = false;

  showPassword = false;
  showConfirm = false;

  private phoneNUmber : string = '';
  private idUser:number = 0;
  private email : string = '';

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

  formOtp = this.fb.group({
      digit1: ['', [Validators.required, Validators.pattern('[0-9]')]],
      digit2: ['', [Validators.required, Validators.pattern('[0-9]')]],
      digit3: ['', [Validators.required, Validators.pattern('[0-9]')]],
      digit4: ['', [Validators.required, Validators.pattern('[0-9]')]],
    });

    formsetPassword = this.fb.group({

      password: ['', [
        Validators.required,
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{8,}$/)
      ]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordsMatchValidator
    })

    get password() {
      return this.formsetPassword.get('password');
    }

    get confirmPassword() {
      return this.formsetPassword.get('confirmPassword');
    }

    togglePassword() {
      this.showPassword = !this.showPassword;
    }

    toggleConfirm() {
      this.showConfirm = !this.showConfirm;
    }

    passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
      const pass = group.get('password')?.value;
      const confirm = group.get('confirmPassword')?.value;
      return pass === confirm ? null : { passwordsMismatch: true };
    }
    onSubmitPassword() {
      const password = this.password?.value
      if (this.formsetPassword.valid) {
        console.log(this.user.Id, password);
        this.authService.resetPassword(this.user.Id, password!)
          .subscribe(resp => {
            console.log(resp);

          })

      } else {
        this.formsetPassword.markAllAsTouched();
      }
    }

  ngOnInit(): void {
  }

  omitirNoNumeros(event: KeyboardEvent): void {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      event.preventDefault();
    }
  }

  sendRegister() {    this.formSubmitted = true;

    if (this.visible) {
      if (this.dniControl.invalid) {
        console.log('DNI inválido. Errores:', this.dniControl.errors);
        return;
      }
      const {dni, telefono, email} = this.formRegister.value
      console.log(`este es el dni enviado desde el front${dni}`);
      this.authService.verifyDni(dni!)
        .subscribe(resp => {
          this.user = resp;
          console.log(`esta es la resp:`,resp)
          if (resp) {
            this.phoneNUmber = telefono!;
            this.email = email!;
            this.visible = false;
            this.error = '';
            this.formSubmitted = false;
            this.telefonoControl.markAsUntouched();
            this.telefonoControl.markAsPristine();
            this.emailControl.markAsUntouched();
            this.emailControl.markAsPristine();
            this.authService.sendOtp(`+549${telefono}`,email!)
              .subscribe({
                next: (resp)=> {
                  console.log('respuesta del backend al enviar el otp', resp);

                }
              })
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

  onKeyUp(event: KeyboardEvent, index: number, nextInput: HTMLInputElement | null, prevInput: HTMLInputElement | null = null) {
    const input = event.target as HTMLInputElement;

    // Si se presiona Backspace y el campo está vacío, mover al anterior
    if (event.key === 'Backspace' && !input.value && prevInput) {
      prevInput.focus();
      return;
    }

    // Si se ingresa un número y hay un siguiente campo, mover al siguiente
    if (input.value.match(/[0-9]/) && nextInput) {
      nextInput.focus();
    }
  }

  sendOtp() {
    // Si el formulario no es válido, no hacemos nada.
    if (this.formOtp.invalid) {
      return;
    }

    // CAPTURA DE LA CLAVE: Unimos los valores de cada control para formar el OTP final.
    const { digit1, digit2, digit3, digit4 } = this.formOtp.value;
    const otpCompleto = `${digit1}${digit2}${digit3}${digit4}`;



    this.authService.verifyOtp(`+549${this.phoneNUmber}`,otpCompleto)
      .subscribe( resp => {
        console.log(resp);
        this.repass = true

      })
  }
}
