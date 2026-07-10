# Cache credencial (foto, checkStatus, CBU) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the 3x loader flicker on the credencial photo and stop re-fetching user/CBU data on every view entry, while keeping CBU updates able to invalidate their own cache.

**Architecture:** In-memory caching only (no localStorage/sessionStorage). `AuthService.checkStatus()` gets a `shareReplay(1)` cache reset on logout, plus a skip-if-unchanged guard before reassigning the user signal. Profile image blob URLs are cached in `AuthService` keyed by userId. `CredencialService.getCbu(id)` gets a per-id `shareReplay(1)` cache that `updateCbu`/`updateCbuPhp` invalidate on success.

**Tech Stack:** Angular 19 (standalone components, signals), RxJS, Jasmine/Karma (`HttpClientTestingModule` via `provideHttpClientTesting`).

---

### Task 1: `AuthService.checkStatus()` cache + skip redundant signal writes

**Files:**
- Modify: `src/app/auth/services/auth.service.ts`
- Test: `src/app/auth/services/auth.service.spec.ts` (new file)

- [ ] **Step 1: Write the failing tests**

Create `src/app/auth/services/auth.service.spec.ts`:

```typescript
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

describe('AuthService caching', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const mockUser = {
    ok: true,
    token: 'abc123',
    userData: {
      Persona: [{
        Id: 1,
        Documento: '111',
        Apellido: 'Perez',
        Nombre: 'Ana',
        Fecha_Nacimiento: '1990-01-01',
        Sexo: 'F',
        Validado: true,
        Socios_Personas_Id_Titular: 1,
        Discapacitado: false,
        Encuesta: true,
        Usuario_Registrado: true,
        Usuario_Bloqueado: false,
      }],
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.setItem('token', 'sometoken');
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('shares a single HTTP call across multiple checkStatus() subscribers', () => {
    service.checkStatus().subscribe();
    service.checkStatus().subscribe();

    const reqs = httpMock.match(`${environment.API_URL}/auth/check-status`);
    expect(reqs.length).toBe(1);
    reqs[0].flush(mockUser);
  });

  it('issues a fresh HTTP call after logout() resets the cache', () => {
    service.checkStatus().subscribe();
    httpMock.expectOne(`${environment.API_URL}/auth/check-status`).flush(mockUser);

    service.logout();
    localStorage.setItem('token', 'sometoken');

    service.checkStatus().subscribe();
    httpMock.expectOne(`${environment.API_URL}/auth/check-status`).flush(mockUser);
  });

  it('does not replace the user signal reference when auth data is unchanged', () => {
    service.login('111', 'pass').subscribe();
    httpMock.expectOne(`${environment.API_URL}/auth/login`).flush(mockUser);
    const firstRef = service.user();

    service.login('111', 'pass').subscribe();
    httpMock.expectOne(`${environment.API_URL}/auth/login`).flush(mockUser);
    const secondRef = service.user();

    expect(secondRef).toBe(firstRef);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx ng test --include=src/app/auth/services/auth.service.spec.ts --watch=false --browsers=ChromeHeadless`
Expected: FAIL — `httpMock.match(...)` finds 2 requests (no cache yet), and/or `secondRef` is not `===` `firstRef` (no skip-if-unchanged guard yet).

- [ ] **Step 3: Implement the cache in `auth.service.ts`**

In `src/app/auth/services/auth.service.ts`, update the imports (line 3):

```typescript
import { catchError, finalize, map, Observable, of, shareReplay, tap } from 'rxjs';
```

Add a private field near the other private signals (after line 22, `_token`):

```typescript
  private checkStatus$?: Observable<boolean>;
  private profileImageUrls = new Map<number, string>();
```

Replace `checkStatus()` (current lines 134-151):

```typescript
  checkStatus(): Observable<boolean> {
    const token = localStorage.getItem('token');

    if(!token) {
      this.logout();
      return of(false)
    }

    if (!this.checkStatus$) {
      this.checkStatus$ = this.http.get<User>(`${this.url}/auth/check-status`, {
        headers: {
          Authorization: `Bearer ${ token }`
        },
        })
        .pipe(
          map(resp => this.handleAuthSuccess(resp)),
          catchError((error: any) => this.handleAuthError(error)),
          shareReplay(1)
        );
    }

    return this.checkStatus$;
  }
```

Replace `logout()` (current lines 153-158):

```typescript
  logout() {
    this._User.set(null)
    this._token.set(null)
    this._authStatus.set('not-authenticated')
    localStorage.removeItem('token')
    this.checkStatus$ = undefined;
    this.clearProfileImageCache();
  }
```

Replace `handleAuthSuccess` (current lines 160-171):

```typescript
  private handleAuthSuccess(resp: User) {
    const current = this._User();
    if (!current || JSON.stringify(current) !== JSON.stringify(resp.userData)) {
      this._User.set(resp.userData);
    }
    this._authStatus.set('authenticated');
    this._token.set(resp.token);

    localStorage.setItem('token', resp.token);

    const userId = resp.userData?.Persona?.[0]?.Id;
    if (userId) this.pushService.subscribeAfterLogin(userId);

    return true;
  }
```

Add profile-image cache helpers after `getProfileImageUrl` (current lines 178-180, keep that method and add below it, before the closing `}` of the class):

```typescript
  getCachedProfileImageUrl(userId: number): string | undefined {
    return this.profileImageUrls.get(userId);
  }

  cacheProfileImageUrl(userId: number, objectUrl: string): void {
    this.profileImageUrls.set(userId, objectUrl);
  }

  private clearProfileImageCache(): void {
    this.profileImageUrls.forEach(url => URL.revokeObjectURL(url));
    this.profileImageUrls.clear();
  }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx ng test --include=src/app/auth/services/auth.service.spec.ts --watch=false --browsers=ChromeHeadless`
Expected: PASS (3 specs)

- [ ] **Step 5: Commit**

```bash
git add src/app/auth/services/auth.service.ts src/app/auth/services/auth.service.spec.ts
git commit -m "feat(auth): cache checkStatus() and skip redundant user signal writes"
```

---

### Task 2: Profile image cache in `PersonalDateCredentialComponent`

**Files:**
- Modify: `src/app/admin/components/personal-date-credential/personal-date-credential.component.ts`
- Test: `src/app/admin/components/personal-date-credential/personal-date-credential.component.spec.ts`

- [ ] **Step 1: Write the failing test**

Replace `src/app/admin/components/personal-date-credential/personal-date-credential.component.spec.ts` entirely:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { PersonalDateCredentialComponent } from './personal-date-credential.component';
import { AuthService } from '../../../auth/services/auth.service';

describe('PersonalDateCredentialComponent', () => {
  let fixture: ComponentFixture<PersonalDateCredentialComponent>;
  let component: PersonalDateCredentialComponent;
  let httpMock: HttpTestingController;
  let authService: AuthService;

  const userData = {
    Persona: [{
      Id: 42,
      Documento: '111',
      Apellido: 'Perez',
      Nombre: 'Ana',
    }],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonalDateCredentialComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    authService = TestBed.inject(AuthService);
    spyOn(authService, 'checkStatus').and.returnValue(of(true));
    (authService as any).user = () => userData;

    httpMock = TestBed.inject(HttpTestingController);

    fixture = TestBed.createComponent(PersonalDateCredentialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('fetches the profile image once and reuses it for a second mounted instance', () => {
    const req = httpMock.expectOne(authService.getProfileImageUrl(42));
    req.flush(new Blob(['fake-image']));
    fixture.detectChanges();

    expect(component.hasImage()).toBeTrue();

    const fixture2 = TestBed.createComponent(PersonalDateCredentialComponent);
    fixture2.detectChanges();

    httpMock.expectNone(authService.getProfileImageUrl(42));
    expect(fixture2.componentInstance.hasImage()).toBeTrue();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx ng test --include=src/app/admin/components/personal-date-credential/personal-date-credential.component.spec.ts --watch=false --browsers=ChromeHeadless`
Expected: FAIL — second `httpMock.expectNone(...)` finds an unexpected request (no cache yet).

- [ ] **Step 3: Implement the cache in the component**

Replace the full contents of `src/app/admin/components/personal-date-credential/personal-date-credential.component.ts`:

```typescript
import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-personal-date-credential',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './personal-date-credential.component.html',
  styleUrl: './personal-date-credential.component.css'
})
export default class PersonalDateCredentialComponent {

  private destroyRef = inject(DestroyRef);
  private http = inject(HttpClient);
  autService = inject(AuthService);
  private sanitizer = inject(DomSanitizer);

  imagenUrl: SafeUrl | null = null;
  loading = signal<boolean>(true);
  hasImage = signal<boolean>(false);

  user = this.autService.user;

  constructor() {
    // Hidrata sesión (si ya usás APP_INITIALIZER, podés omitirlo)
    this.autService.checkStatus().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();

    // Reacciona al cambio de usuario; sólo pide imagen cuando hay Id
    effect(() => {
      const id = this.autService.user()?.Persona?.[0]?.Id;

      if (!id) {
        this.loading.set(true);
        this.hasImage.set(false);
        this.imagenUrl = null;
        return;
      }

      const cachedUrl = this.autService.getCachedProfileImageUrl(id);
      if (cachedUrl) {
        this.imagenUrl = this.sanitizer.bypassSecurityTrustUrl(cachedUrl);
        this.hasImage.set(true);
        this.loading.set(false);
        return;
      }

      this.loading.set(true);
      this.http.get(this.autService.getProfileImageUrl(id), { responseType: 'blob' })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (blob) => {
            const objectUrl = URL.createObjectURL(blob);
            this.autService.cacheProfileImageUrl(id, objectUrl);
            this.imagenUrl = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
            this.hasImage.set(true);
            this.loading.set(false);
          },
          error: () => {
            this.imagenUrl = null;
            this.hasImage.set(false);
            this.loading.set(false);
          }
        });
    });
  }
}
```

Notes on this rewrite:
- Removed the duplicate `ngOnInit()` (`implements OnInit` too) — the constructor already calls `checkStatus()`; calling it twice was one of the three redundant calls causing the flicker.
- Removed the per-component `objectUrl`/`clearObjectUrl`/`ngOnDestroy` — the object URL is now owned by `AuthService`'s cache and must survive across component (re)mounts, so a single component instance revoking it on destroy would break the cache for the next mount.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx ng test --include=src/app/admin/components/personal-date-credential/personal-date-credential.component.spec.ts --watch=false --browsers=ChromeHeadless`
Expected: PASS (2 specs)

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/components/personal-date-credential/personal-date-credential.component.ts src/app/admin/components/personal-date-credential/personal-date-credential.component.spec.ts
git commit -m "fix(credencial): cache profile image blob url and drop duplicate checkStatus call"
```

---

### Task 3: `CredencialService.getCbu` cache with invalidation on update

**Files:**
- Modify: `src/app/admin/services/credencial.service.ts`
- Test: `src/app/admin/services/credencial.service.spec.ts`

- [ ] **Step 1: Write the failing tests**

Replace `src/app/admin/services/credencial.service.spec.ts` entirely:

```typescript
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { CredencialService } from './credencial.service';
import { environment } from '../../../environments/environment';

describe('CredencialService', () => {
  let service: CredencialService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CredencialService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('caches getCbu(id) so a second call does not hit the backend again', () => {
    service.getCbu('7').subscribe();
    service.getCbu('7').subscribe();

    const reqs = httpMock.match(`${environment.API_URL}/credencial?id=7`);
    expect(reqs.length).toBe(1);
    reqs[0].flush({ cbu: '1234567890123456789012' });
  });

  it('does not cache a failed getCbu request', () => {
    service.getCbu('9').subscribe({ error: () => {} });
    httpMock.expectOne(`${environment.API_URL}/credencial?id=9`)
      .flush('error', { status: 500, statusText: 'Server Error' });

    service.getCbu('9').subscribe({ error: () => {} });
    httpMock.expectOne(`${environment.API_URL}/credencial?id=9`)
      .flush('error', { status: 500, statusText: 'Server Error' });
  });

  it('invalidates the cached getCbu(id) after updateCbu succeeds', () => {
    service.getCbu('7').subscribe();
    httpMock.expectOne(`${environment.API_URL}/credencial?id=7`)
      .flush({ cbu: '1111111111111111111111' });

    service.updateCbu(7, '2222222222222222222222').subscribe();
    httpMock.expectOne(`${environment.API_URL}/credencial`).flush({ ok: true });

    service.getCbu('7').subscribe();
    httpMock.expectOne(`${environment.API_URL}/credencial?id=7`)
      .flush({ cbu: '2222222222222222222222' });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx ng test --include=src/app/admin/services/credencial.service.spec.ts --watch=false --browsers=ChromeHeadless`
Expected: FAIL — the "caches getCbu" and "invalidates" specs see 2 requests instead of 1 (no cache yet).

- [ ] **Step 3: Implement the cache in `credencial.service.ts`**

Replace the full contents of `src/app/admin/services/credencial.service.ts`:

```typescript
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { catchError, Observable, shareReplay, tap, throwError } from 'rxjs';

interface Cbu {
  cbu: string
}

@Injectable({
  providedIn: 'root'
})
export class CredencialService {

  http = inject(HttpClient);

  url = environment.API_URL;

  private cbuCache = new Map<string, Observable<Cbu>>();

  constructor() { }

  getCbu(id: string): Observable<Cbu> {
    const cached = this.cbuCache.get(id);
    if (cached) return cached;

    const request$ = this.http.get<Cbu>(`${this.url}/credencial?id=${id}`).pipe(
      catchError(error => {
        this.cbuCache.delete(id);
        return throwError(() => error);
      }),
      shareReplay(1)
    );

    this.cbuCache.set(id, request$);
    return request$;
  }

  updateCbu(id: number, cbu: string) {
    return this.http.patch(`${this.url}/credencial`, { id, cbu }).pipe(
      tap(() => this.cbuCache.delete(id.toString()))
    );
  }

  updateCbuPhp(id: number, cbu: string) {
    return this.http.post(`https://gestion.cirsubgn.org.ar/Cirsub/CirsubApp/Transf/receptorcbu.php`, { id, cbu }).pipe(
      tap(() => this.cbuCache.delete(id.toString()))
    );
  }

  updateEncuesta(id: number, servicio: number, atencion: number): Observable<any> {
    return this.http.post(`${this.url}/credencial/encuesta`, { id, servicio, atencion })
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx ng test --include=src/app/admin/services/credencial.service.spec.ts --watch=false --browsers=ChromeHeadless`
Expected: PASS (4 specs)

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/services/credencial.service.ts src/app/admin/services/credencial.service.spec.ts
git commit -m "feat(credencial): cache getCbu per id and invalidate it on update"
```

---

### Task 4: Manual verification in browser

**Files:** none (manual QA pass, no code changes)

- [ ] **Step 1: Start the dev server**

Run: `npm start`

- [ ] **Step 2: Verify the photo no longer flickers**

Log in, navigate to `/credencial`. Confirm the profile photo loader shows exactly once (not 3 times). Navigate away to another route and back to `/credencial` — the photo should appear instantly from cache, no loader.

- [ ] **Step 3: Verify CBU cache + invalidation**

Open the CBU view twice without changing anything — confirm (via DevTools Network tab) the `GET /credencial?id=...` call only fires on the first visit. Then update the CBU and reopen the CBU view — confirm a fresh `GET /credencial?id=...` fires and shows the new value.

- [ ] **Step 4: Commit (if any manual fixups were needed)**

Only if Step 2 or 3 uncovered an issue requiring a code fix — otherwise no commit for this task.
