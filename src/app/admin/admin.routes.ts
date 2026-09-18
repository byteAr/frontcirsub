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
        // Los cuatro beneficios en una sola vista, uno por tarjeta.
        path: 'beneficios',
        loadComponent: () => import('./pages/beneficios/beneficios.component')
      },
      {
        // Las vistas sueltas de antes. Se redirigen en vez de borrarse para que
        // no se rompa un acceso guardado ni la última ruta de la PWA instalada.
        path: 'beneficios/:beneficio',
        redirectTo: 'beneficios'
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
        path: 'descuentos',
        loadComponent: () => import('./pages/descuentos/descuentos.component')
      },
      {
        path: 'ahorros',
        loadComponent: () => import('./pages/ahorros/ahorros.component')
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
