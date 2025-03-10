import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.routes')
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./admin/admin.routes')
  },
  {
    path:'**',
    redirectTo: 'auth'
  }
];
