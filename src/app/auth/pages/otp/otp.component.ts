import { CommonModule } from '@angular/common';
import { Component, inject, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-otp',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './otp.component.html',
  styleUrl: './otp.component.css'
})
export class OtpComponent implements AfterViewInit {

  fb = inject(FormBuilder);

  @ViewChild('input1') input1!: ElementRef<HTMLInputElement>;

  formOtp = this.fb.group({
    digit1: ['', [Validators.required, Validators.pattern('[0-9]')]],
    digit2: ['', [Validators.required, Validators.pattern('[0-9]')]],
    digit3: ['', [Validators.required, Validators.pattern('[0-9]')]],
    digit4: ['', [Validators.required, Validators.pattern('[0-9]')]],
  });

  ngAfterViewInit(): void {
    this.input1.nativeElement.focus();
  }

  onKeyUp(event: KeyboardEvent, nextInput: HTMLInputElement | null, prevInput: HTMLInputElement | null = null) {
    const input = event.target as HTMLInputElement;

    if (event.key === 'Backspace' && !input.value && prevInput) {
      prevInput.focus();
      return;
    }

    if (input.value.match(/[0-9]/) && nextInput) {
      nextInput.focus();
    }

    if (this.formOtp.valid) {
      this.sendOtp();
    }
  }

  onPaste(event: ClipboardEvent, inputs: HTMLInputElement[]) {
    event.preventDefault();
    const digits = (event.clipboardData?.getData('text') ?? '').replace(/\D/g, '').slice(0, 4);
    const controls = ['digit1', 'digit2', 'digit3', 'digit4'];
    digits.split('').forEach((d, i) => this.formOtp.get(controls[i])?.setValue(d));
    if (digits.length > 0) {
      inputs[Math.min(digits.length - 1, 3)].focus();
    }
    if (digits.length === 4) {
      this.sendOtp();
    }
  }

  sendOtp() {
    if (this.formOtp.invalid) return;
    const { digit1, digit2, digit3, digit4 } = this.formOtp.value;
    const otpCompleto = `${digit1}${digit2}${digit3}${digit4}`;
    console.log('OTP enviado:', otpCompleto);
  }
}
