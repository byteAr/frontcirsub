import { Routes } from "@angular/router";

export default [
  {
    path:'',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent:() => import('./pages/register/register.component').then(m => m.RegisterComponent)
  }
] as Routes
