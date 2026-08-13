import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./pages/dashboard/dashboard.component'),
    children: [
      {
        path: 'tramites',
        children: [
          {
            path: '',
            loadComponent: () => import('./pages/tramites/tramites.component'),
          },
          {
            path: 'nuevo',
            loadComponent: () => import('./pages/nuevo-tramite/nuevo-tramite.component'),
            children: [
              {
                path: '',
                loadComponent: () => import('./components/tramites-detail/tramites-detail.component')
              },
              {
                path: 'responsable',
                loadComponent: () => import('./components/responsable-tramite-detail/responsable-tramite-detail.component')
              }
            ]
          }
        ]
      },
      {
        // La credencial ya no aloja al resto de las vistas: conserva sólo su
        // propio frente (datos e info de contacto) y su dorso (grupo familiar).
        path: 'credencial',
        loadComponent: () => import('./pages/credencial/credencial.component'),
        children: [
          {
            path: '',
            loadComponent: () => import('./components/personal-date-credential/personal-date-credential.component'),
            outlet: 'front'
          },
          {
            path: 'info',
            loadComponent: () => import('./components/info-contact/info-contact.component'),
            outlet: 'front'
          }
        ]
      },
      {
        path: 'beneficios',
        children: [
          {
            path: 'farmacia',
            loadComponent: () => import('./components/farmacia/farmacia.component')
          },
          {
            path: 'evacuaciones',
            loadComponent: () => import('./components/estadia/estadia.component')
          },
          {
            path: 'seguros',
            loadComponent: () => import('./components/sepelio/sepelio.component')
          },
          {
            path: '',
            redirectTo: 'farmacia',
            pathMatch: 'full'
          }
        ]
      },
      {
        path: 'cbu',
        loadComponent: () => import('./components/cbu/cbu.component')
      },
      {
        path: 'encuesta',
        loadComponent: () => import('./components/encuesta/encuesta.component')
      },
      {
        path: 'reintegros',
        loadComponent: () => import('./pages/reintegros/reintegros.component')
      },
      {
        path: 'notificaciones',
        loadComponent: () => import('./pages/notificaciones/notificaciones.component')
      },
      {
        // Al entrar se ve la credencial.
        path: '',
        redirectTo: 'credencial',
        pathMatch: 'full'
      }
    ]
  }
] as Routes
