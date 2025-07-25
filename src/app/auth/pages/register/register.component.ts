// src/app/register/register.component.ts

import { InputTextModule } from 'primeng/inputtext';
import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
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

  @ViewChild('videoElement') videoElement!: ElementRef;
  @ViewChild('canvas') canvas!: ElementRef;

  capturedImage: string | null = null;
  private mediaStream: MediaStream | null = null;
  isLoading: boolean = false;

  async ngAfterViewInit() {
    this.canvas.nativeElement.width = 300;
    this.canvas.nativeElement.height = 300;
    await this.startCamera();
  }

  async captureProfileImage() {
    this.canvas.nativeElement.width = 300;
    this.canvas.nativeElement.height = 300;
    await this.startCamera();
  }

  selectPerioricidad: tipoDni | undefined;

  fb = inject(FormBuilder);
  router = inject(Router);
  authService = inject(AuthService);

  user: any;
  userId: number = 0;
  visible: boolean = true;
  formotp: boolean = false
  error: string = '';
  repass: boolean = false;
  avatar: boolean = false;

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
        this.repass = false;
        this.avatar = true
        setTimeout(()=> {
          this.capturePhoto();
          this.retakePhoto()
        }, 200)


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
          if (resp.ok) {
            this.userId = resp.userId;
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

  // logica captura de imagen
  async startCamera() {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      this.videoElement.nativeElement.srcObject = this.mediaStream;
      await this.videoElement.nativeElement.play();
    } catch (err) {
      console.error('Error al acceder a la cámara', err);
      alert('No se pudo acceder a la cámara. Asegúrate de otorgar permisos.');
    }
  }

  stopCamera() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
  }

  capturePhoto() {
    const video = this.videoElement.nativeElement;
    const canvas = this.canvas.nativeElement;
    const context = canvas.getContext('2d');

    if (!context) {
      console.error('No se pudo obtener el contexto 2D del canvas.');
      return;
    }

    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    const squareSize = Math.min(videoWidth, videoHeight);

    // Recortar desde el centro
    const startX = (videoWidth - squareSize) / 2;
    const startY = (videoHeight - squareSize) / 2;

    // Canvas cuadrado
    canvas.width = squareSize;
    canvas.height = squareSize;

    // Espejo horizontal
    context.translate(squareSize, 0);
    context.scale(-1, 1);

    // Capturar imagen centrada y cuadrada
    context.drawImage(video, startX, startY, squareSize, squareSize, 0, 0, squareSize, squareSize);

    this.capturedImage = canvas.toDataURL('image/png');
    this.stopCamera();
  }

  async retakePhoto() {
    this.capturedImage = null;
    await this.startCamera();
  }

  async updateProfile() {
    if (!this.capturedImage) {
      alert('Por favor, toma una foto primero.');
      return;
    }

    this.isLoading = true; // Activa el estado de carga

    // Convertir Data URL a Blob
    // Esta función auxiliar convierte una data URL en un objeto Blob
    const dataURLtoBlob = (dataurl: string): Promise<Blob> => {
      return new Promise((resolve, reject) => {
        const arr = dataurl.split(',');
        // @ts-ignore
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        resolve(new Blob([u8arr], { type: mime }));
      });
    };

    try {
      const imageBlob = await dataURLtoBlob(this.capturedImage);

      // Crear un FormData para enviar el archivo
      // Esto es crucial para enviar archivos binarios en peticiones multipart/form-data
      const formData = new FormData();
      formData.append('profilePicture', imageBlob, 'profile.jpeg');
      console.log(this.userId) // 'profilePicture' es el nombre del campo en el backend
      formData.append('userId', this.userId.toString()); // 'userId' es el nombre del campo en el backend

      const {dni, telefono, email} = this.formRegister.value;

      this.authService.register(dni!, this.passwordUser, telefono!, this.userId, email!)
      .subscribe({
        next: (res) => {
          console.log('Registro exitoso', res);
          this.authService.sendAvatar(formData)
            .subscribe({
              next: (res) => console.log('Avatar subido', res),
              error: (err) => console.error('Error al subir avatar', err)
            });
          this.router.navigateByUrl('/dashboard/credencial')
        },
        error: (err) => console.error('Error en registro', err)
      });

    } catch (blobError) {
      this.isLoading = false;
      console.error('Error al convertir Data URL a Blob:', blobError);
      alert('Error interno al preparar la imagen.');
    }
  }

  ngOnDestroy() {
    this.stopCamera(); // Detener la cámara al destruir el componente
  }


}
