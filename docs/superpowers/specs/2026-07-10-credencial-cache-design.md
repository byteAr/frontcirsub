# Cache credencial: foto perfil, checkStatus, CBU

## Problema

Vista credencial parpadea 3x al entrar: loader de foto se muestra y oculta 3 veces.

Causa raíz: `AuthService.checkStatus()` se invoca de forma redundante desde múltiples puntos (guards `authenticated-user.guard.ts`, `not-authtenticated.guard.ts`, `credencial.component.ts` ngOnInit, `personal-date-credential.component.ts` constructor + ngOnInit duplicado, `farmacia.component.ts`, `grupo-familiar.component.ts`). Cada llamada exitosa hace `_User.set(nuevoObjeto)` — nueva referencia de objeto aunque los datos sean iguales — lo que dispara el `effect()` en `PersonalDateCredentialComponent` que re-descarga el blob de la foto de perfil vía HTTP cada vez.

`CredencialService.getCbu` tampoco cachea: cada entrada a la vista CBU repregunta al backend aunque el valor no cambió.

## Alcance

- `src/app/auth/services/auth.service.ts`
- `src/app/admin/components/personal-date-credential/personal-date-credential.component.ts`
- `src/app/admin/services/credencial.service.ts`
- `src/app/admin/components/cbu/cbu.component.ts` (invalidación de caché tras update)

Fuera de alcance: interceptor HTTP genérico, persistencia en localStorage/sessionStorage/IndexedDB, cache de notificaciones/mensajes.

## Diseño

### 1. `AuthService.checkStatus()` — caché de sesión + no-op en datos iguales

- Cachear el observable de `checkStatus()` con `shareReplay(1)` mientras la sesión esté activa (variable `private checkStatus$?: Observable<boolean>` reseteada en `logout()`).
- Múltiples suscriptores casi simultáneos (guards + componentes) comparten 1 sola llamada HTTP real.
- En `handleAuthSuccess`, comparar el nuevo `userData` con el actual (`JSON.stringify` shallow compare alcanza acá) antes de `_User.set(...)`; si es igual, no reasignar la señal (evita nueva referencia y por ende evita re-disparar el `effect` de la foto).

### 2. Foto de perfil — caché en memoria por `userId`

- Nuevo estado en `AuthService` (o servicio dedicado pequeño): `Map<number, SafeUrl>` de blob-URLs ya resueltas, mantenido vivo mientras dure la sesión (limpiado en `logout()` con `URL.revokeObjectURL` de cada entrada).
- `PersonalDateCredentialComponent`: antes de pedir el blob, chequea el cache; si existe, usa el valor cacheado sin llamar al backend, sin mostrar loader.
- Eliminar el `checkStatus()` duplicado en `ngOnInit` (constructor ya lo dispara); reduce a 1 punto de disparo por instancia de este componente.

### 3. `CredencialService.getCbu` — caché con invalidación en update

- Cachear `getCbu(id)` con `shareReplay(1)` guardado por `id` (`Map<string, Observable<Cbu>>`).
- `updateCbu(id, cbu)` y `updateCbuPhp` — al completar con éxito, borrar la entrada cacheada de ese `id` (`this.cbuCache.delete(id)`), forzando refetch real la próxima vez que se pida.

## Errores / edge cases

- Logout debe limpiar toda caché (checkStatus$, foto, CBU) para no filtrar datos entre sesiones/usuarios distintos en el mismo navegador.
- Si `getCbu` falla (error HTTP), no cachear la respuesta fallida — sólo cachear success.

## Testing

- Verificar manualmente en navegador: entrar a `/credencial`, confirmar 1 sólo loader de foto (no 3), navegar fuera y volver sin nuevo fetch de imagen.
- Actualizar CBU y confirmar que la próxima carga de CBU refleja el nuevo valor (no el cacheado viejo).
