import { Routes } from "@angular/router";

export default [
  {
    path:'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent:() => import('./pages/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path:'**',
    redirectTo: 'login'
  }
] as Routes
