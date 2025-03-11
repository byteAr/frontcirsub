
import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: ()=> import('./pages/dashboard/dashboard.component'),
    children:[
      {
        path:'tramites',
        loadComponent: ()=> import('./pages/tramites/tramites.component')
      },
      {
        path:'credencial',
        loadComponent: ()=> import('./pages/credencial/credencial.component')
      }
    ]
  }
] as Routes
