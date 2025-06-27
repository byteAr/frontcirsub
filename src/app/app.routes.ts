import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.routes')
    //TODO: GUARDS
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./admin/admin.routes'),
    //TODO: GUARDS
  },
  {
    path:'**',
    redirectTo: 'auth'
  }
];
