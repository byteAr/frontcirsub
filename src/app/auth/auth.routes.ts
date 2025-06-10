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
    path: 'otp',
    loadComponent:() => import('../auth/pages/otp/otp.component').then(m => m.OtpComponent)
  },
  {
    path: 'password-reset',
    loadComponent:() => import('./pages/repassword/repassword.component').then(m => m.RepasswordComponent)
  },
  {
    path:'**',
    redirectTo: 'login'
  }
] as Routes
