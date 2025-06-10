import { CommonModule } from '@angular/common';
import { Component, inject, ElementRef } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-otp',
  standalone: true, // Es importante que sea standalone si usas 'imports'
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './otp.component.html',
  styleUrl: './otp.component.css'
})
export class OtpComponent {

  fb = inject(FormBuilder);

  // CORRECCIÓN: Creamos un control para cada dígito del OTP.
  // Esto permite una validación individual y es la forma correcta de manejar
  // múltiples campos de entrada con Reactive Forms.
  formOtp = this.fb.group({
    digit1: ['', [Validators.required, Validators.pattern('[0-9]')]],
    digit2: ['', [Validators.required, Validators.pattern('[0-9]')]],
    digit3: ['', [Validators.required, Validators.pattern('[0-9]')]],
    digit4: ['', [Validators.required, Validators.pattern('[0-9]')]],
  });

  sendOtp() {
    // Si el formulario no es válido, no hacemos nada.
    if (this.formOtp.invalid) {
      return;
    }

    // CAPTURA DE LA CLAVE: Unimos los valores de cada control para formar el OTP final.
    const { digit1, digit2, digit3, digit4 } = this.formOtp.value;
    const otpCompleto = `${digit1}${digit2}${digit3}${digit4}`;

    console.log('OTP enviado:', otpCompleto);
    // Aquí puedes agregar la lógica para enviar el 'otpCompleto' a tu backend.
  }

  // Lógica para mover el foco automáticamente entre los inputs
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
}
