import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, FormControl, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { switchMap, throwError } from 'rxjs';

@Component({
  selector: 'app-repassword',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './repassword.component.html',
  styleUrl: './repassword.component.css'
})
export class RepasswordComponent {

  fb = inject(FormBuilder);

  authService = inject(AuthService);

  hasError = signal(false);

  error: string = '';

  formSubmitted: boolean = false;

  repass=true;

  private passwordUser: string ='';
  private dniUser = '';

  repasswordForm = this.fb.group({
    dni: ['', [Validators.required, Validators.minLength(7), Validators.pattern(/^\d+$/)]],
    password:(['',[Validators.required, Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{8,}$/)]]),
    repassword:(['',[Validators.required], ]),
  }, { validators: this.passwordsMatchValidator})

  passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
      const pass = group.get('password')?.value;
      const confirm = group.get('repassword')?.value;
      return pass === confirm ? null : { passwordsMismatch: true };
  }



  omitirNoNumeros(event: KeyboardEvent): void {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      event.preventDefault();
    }
  }

  get dniControl(): FormControl {
      return this.repasswordForm.get('dni') as FormControl;
  }

  get password() {
    return this.repasswordForm.get('password');
  }

  get confirmPassword() {
    return this.repasswordForm.get('repassword');
  }

  onSubmit(){
    const password = this.password?.value
    const dni = this.dniControl?.value;
      if (this.repasswordForm.valid) {
        this.passwordUser = password!;
        this.dniUser = dni!;
        this.repass = false;
        this.authService.verifyDni(dni!).pipe(
          switchMap(user => {
            if(user.ok) {
              return this.authService.checkStatus()
            } else {
              return throwError(() => new Error('El DNI no existe'));
            }
          })
        )

      } else {
        this.repasswordForm.markAllAsTouched();
      }
  }




}
