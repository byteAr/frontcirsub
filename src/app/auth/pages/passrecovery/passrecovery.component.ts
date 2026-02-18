import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

export interface tipoDni {
  id: number;
  detalle: string
}

@Component({
  selector: 'app-passrecovery',
  imports: [RouterLink, ReactiveFormsModule, CommonModule, InputTextModule, ToastModule],
  templateUrl: './passrecovery.component.html',
  styleUrl: './passrecovery.component.css',
  providers: [MessageService]
})
export class PassrecoveryComponent implements OnInit {


    @ViewChild('videoElement') videoElement!: ElementRef;
    @ViewChild('canvas') canvas!: ElementRef;
    @ViewChild('modal', { static: true }) modal!: ElementRef<HTMLDialogElement>;
    @ViewChild('input1') input1?: ElementRef<HTMLInputElement>;

    capturedImage: string | null = null;
    private mediaStream: MediaStream | null = null;
    isLoading: boolean = false;


    selectPerioricidad: tipoDni | undefined;

    fb = inject(FormBuilder);
    router = inject(Router);
    authService = inject(AuthService);
    messageService= inject(MessageService)

    user: any;
    userId: number = 0;
    visible: boolean = true;
    formotp: boolean = false
    error: string = '';
    repass: boolean = false;
    avatar: boolean = false;
    isChecked = false;
    showOtp = false;

    message='';
    errorMessage: boolean= false

    showPassword = false;
    showConfirm = false;

    private phoneNUmber : string = '';
    private idUser:number = 0;
    private email : string = '';
    private passwordUser: string =''

    formSubmitted: boolean = false;

    formRegister = this.fb.group({
      dni: ['', [Validators.required, Validators.minLength(7), Validators.pattern(/^\d+$/)]],
      telefono: ['', [
        Validators.required,
        Validators.pattern('^[0-9]*$'),
        Validators.minLength(8),
        Validators.maxLength(12)
      ]]
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
      }, { validators: this.passwordsMatchValidator})

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
          this.passwordUser = password!;
          this.authService.resetPassword(this.userId, password!)
            .subscribe({
              next: resp => {
                console.log('Respuesta de resetPassword:', resp);
                if(resp.ok){
                  this.showSuccess();
                  setTimeout(() => {
                    this.router.navigateByUrl('/auth/login')
                  }, 3500);
                } else {
                  console.log('resetPassword devolvió ok: false', resp);
                  this.message = resp.message || 'Error al cambiar la contraseña';
                }
              },
              error: (err) => {
                console.error('Error en resetPassword:', err);
                this.message = 'Error al cambiar la contraseña. Intente nuevamente.';
              }
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

    sendRegister() {
      this.formSubmitted = true;
      if (this.visible) {
        if (this.dniControl.invalid) {
          console.log('DNI inválido. Errores:', this.dniControl.errors);
          return;
        }
        const {dni, telefono} = this.formRegister.value;

        this.authService.verifyDniRecoveryPass(dni!, telefono!)
          .subscribe(resp => {
            if (resp.ok) {
              this.user = true;
              this.userId = resp.userData.Persona[0].Id;
              this.phoneNUmber = telefono!;
              this.visible = false;
              this.error = '';
              this.formSubmitted = false;
              this.telefonoControl.markAsUntouched();
              this.telefonoControl.markAsPristine();
              this.authService.sendOtp(`+549${telefono}`)
                .subscribe({
                  next: (resp)=> {
                    console.log('respuesta del backend al enviar el otp', resp);
                  }
                })
            } else {
              this.openDialog();
              this.error = 'Hubo un problema contactese con afiliaciones';
              console.log(this.error);
            }
          }, error => {
            this.error = 'Error al verificar DNI. Intente nuevamente.';
            console.error(error);
          });

          } else {
            if (this.formRegister.invalid) {
              console.log('Formulario de contacto inválido. Errores Teléfono:', this.telefonoControl.errors);
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
          console.log('esta es la respuesta del servicio otp: ', resp);
          this.repass = true
        })
    }

    openDialog() {
      this.modal.nativeElement.showModal();
    }

    close(returnValue: string = '') {
      this.modal.nativeElement.close(returnValue);
    }

    onClose(ev: Event) {
      const dlg = ev.target as HTMLDialogElement;
      console.log('closed with:', dlg.returnValue);
    }

    onCancel(ev: Event) {
      // ev.preventDefault(); // descomenta para bloquear cierre por Esc
    }

    showSuccess() {
        this.messageService.add({ severity: 'success', summary: 'Operación exitosa', detail: 'Contraseña actualizada' });
    }

    ngOnDestroy() {
      // Detener la cámara al destruir el componente
    }



  focusInput() {
    this.showOtp = true;                       // activa el *ngIf
    queueMicrotask(() => this.input1?.nativeElement.focus());
  }

}
