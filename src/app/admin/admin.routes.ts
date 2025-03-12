
import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: ()=> import('./pages/dashboard/dashboard.component'),
    children:[
      {
        path:'tramites',
        children:[
          {
            path:'',
        loadComponent: ()=> import('./pages/tramites/tramites.component'),

          },
          {
            path:'nuevo',
            loadComponent: ()=> import('./pages/nuevo-tramite/nuevo-tramite.component'),
            children:[
              {
                path: '',
                loadComponent: ()=> import('./components/tramites-detail/tramites-detail.component')
              },
              {
                path: 'responsable',
                loadComponent: ()=> import('./components/responsable-tramite-detail/responsable-tramite-detail.component')
              }
            ]
          }
        ]
      },
      {
        path:'credencial',
        loadComponent: ()=> import('./pages/credencial/credencial.component')
      }
    ]
  }
] as Routes
