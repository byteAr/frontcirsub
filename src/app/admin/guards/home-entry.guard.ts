// home-entry.guard.ts
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const homeEntryGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  // leer query param splash=1 de la URL de destino
  const urlTree = router.parseUrl(state.url);
  const forceSplash = urlTree.queryParams['splash'] === '1';
  if (forceSplash) {
    sessionStorage.removeItem('splashShown'); // resetea para esta prueba
  }

  const shown = sessionStorage.getItem('splashShown') === '1';
  if (!shown) {
    return router.createUrlTree(['/auth/splash']);
  }
  return true;
};
