import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  fb = inject(FormBuilder);

  authService = inject(AuthService)

  hasError = signal(false);

  router= inject(Router)


  loginForm = this.fb.group({
    dni: ['', [Validators.required, Validators.minLength(7), Validators.pattern(/^\d+$/)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  onSubmit(){
    if(this.loginForm.invalid) {
      this.hasError.set(true);
      setTimeout(() => {
        this.hasError.set(false)
      }, 3000);
      return;
    }

    const { dni='', password='' } = this.loginForm.value

    this.authService.login(dni!, password!)
      .subscribe(isAuthenticated => {
        if(isAuthenticated) {
          this.router.navigateByUrl('/dashboard/credencial')
          return
        }

        this.hasError.set(true);
        setTimeout(() => {
          this.hasError.set(false)
        }, 3000);
      });
  }


}
