
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
        loadComponent: ()=> import('./pages/credencial/credencial.component'),
        children: [
          {
            path: '',
            loadComponent: ()=> import('./components/personal-date-credential/personal-date-credential.component'),
            outlet:'front'
          },
          {
            path: 'info',
            loadComponent: ()=> import('./components/info-contact/info-contact.component'),
            outlet:'front'
          },
          {
            path: 'mensajes',
            loadComponent: ()=> import('./components/notifications/notifications.component'),
            outlet:'front'
          },
          {
            path: 'grupofamiliar',
            loadComponent: ()=> import('./components/grupo-familiar/grupo-familiar.component'),
            outlet:'back'
          },
          {
            path: 'farmacia',
            loadComponent: ()=> import('./components/farmacia/farmacia.component'),
            outlet:'back'
          },
          {
            path: 'estadia',
            loadComponent: ()=> import('./components/estadia/estadia.component'),
            outlet:'back'
          },
          {
            path: 'sepelio',
            loadComponent: ()=> import('./components/sepelio/sepelio.component'),
            outlet:'back'
          },
          {
            path: 'ahorros',
            loadComponent: ()=> import('./components/ahorros/ahorros.component'),
            outlet:'back'
          },
          {
            path: 'movimientos',
            loadComponent: ()=> import('./components/extractomovimientos/extractomovimientos.component'),
            outlet:'back'
          },
        ]
      },
      {
        path:'notificaciones',
        loadComponent: ()=> import('./pages/notificaciones/notificaciones.component')
      }
    ]
  }
] as Routes
