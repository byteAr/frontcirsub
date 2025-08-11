import { Routes } from "@angular/router";
import { homeEntryGuard } from "../admin/guards/home-entry.guard";


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
    path: 'verify-code',
    loadComponent:() => import('../auth/pages/otp/otp.component').then(m => m.OtpComponent)
  },
  {
    path: 'avatar-profile',
    loadComponent:() => import('../auth/pages/avatar-profile/avatar-profile.component').then(m => m.default)
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
