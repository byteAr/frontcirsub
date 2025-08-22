import { Routes } from '@angular/router';
import { notAuthtenticatedGuard } from './auth/guards/not-authtenticated.guard';
import { authenticatedUserGuard } from './auth/guards/authenticated-user.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.routes'),
    /* canMatch:[notAuthtenticatedGuard] */
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./admin/admin.routes'),
    canMatch:[authenticatedUserGuard]
  },
  {
    path:'**',
    redirectTo: 'auth'
  }
];
