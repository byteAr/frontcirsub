import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { firstValueFrom } from 'rxjs';

export const notAuthtenticatedGuard: CanMatchFn = async (route, segments) => {

  const authservice = inject(AuthService);
  const router = inject(Router);

  const isAuthenticated = await firstValueFrom(authservice.checkStatus());

  if(isAuthenticated) {
    router.navigateByUrl('/dashboard/credencial')
    return false
  }

  return true;
};
