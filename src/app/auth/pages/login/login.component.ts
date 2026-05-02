import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs';
import { NotifViewModalComponent } from '../../../shared/components/notif-view-modal/notif-view-modal.component';

@Component({
  selector: 'app-login',
  imports: [RouterLink, ReactiveFormsModule, ToastModule, NotifViewModalComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  providers: [MessageService],
})
export class LoginComponent implements OnInit {
  fb = inject(FormBuilder);
  authService = inject(AuthService);
  router = inject(Router);
  route = inject(ActivatedRoute);
  messageService = inject(MessageService);

  hasError = signal(false);
  showPassword = signal(false);
  isLoading = signal(false);

  // Push notification modal
  showNotifModal = signal(false);
  notifTitle = signal('');
  notifBody = signal('');

  togglePasswordVisibility() {
    this.showPassword.set(!this.showPassword());
  }

  loginForm = this.fb.group({
    dni: ['', [Validators.required, Validators.minLength(7), Validators.pattern(/^\d+$/)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['notify']) {
        this.notifTitle.set(decodeURIComponent(params['title'] ?? ''));
        this.notifBody.set(decodeURIComponent(params['body'] ?? ''));
        this.showNotifModal.set(true);
      }
    });
  }

  onCloseNotifModal(): void {
    this.showNotifModal.set(false);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true,
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.showError();
      this.hasError.set(true);
      setTimeout(() => this.hasError.set(false), 3000);
      return;
    }

    const { dni = '', password = '' } = this.loginForm.value;
    this.isLoading.set(true);

    this.authService
      .login(dni!, password!)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((isAuthenticated) => {
        if (isAuthenticated) {
          this.router.navigateByUrl('/dashboard/credencial');
          return;
        }
        this.hasError.set(true);
        this.showError();
      });
  }

  showError() {
    this.messageService.add({
      severity: 'error',
      summary: 'Error al iniciar sesión',
      detail: 'Verifique los datos ingresados',
    });
  }
}
