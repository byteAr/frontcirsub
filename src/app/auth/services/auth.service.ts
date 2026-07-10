import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, map, Observable, of, shareReplay, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, UserData } from '../interfaces/user.interface';
import { PushNotificationService } from '../../shared/services/push-notification.service';

import { rxResource } from '@angular/core/rxjs-interop'

interface Resp {
  ok: boolean;
  userId: number
}

type AuthStatus = 'checking' | 'authenticated' | 'not-authenticated';

@Injectable({providedIn: 'root'})
export class AuthService {

  private _authStatus = signal<AuthStatus>('checking');
  private _User = signal<UserData | null>(null);
  private _token = signal<string | null>(null);
  _encuesta = signal<boolean | null>(false)

  private checkStatus$?: Observable<boolean>;
  private profileImageUrls = new Map<number, string>();

  authStatus = computed<AuthStatus>(() => {
    if(this._authStatus() === 'checking') return 'checking';

    if(this._User()) {
      return 'authenticated'
    }

    return 'not-authenticated'
  })

  user = computed<UserData|null>(() => this._User());

  token = computed(()=> this._token());

  url = environment.API_URL;

  http = inject(HttpClient);
  private pushService = inject(PushNotificationService);

  checkStatusResources = rxResource({
    loader: () => this.checkStatus(),
  })

  login(dni: string, password: string):Observable<boolean>   {
    return this.http.post<User>(`${this.url}/auth/login`, { dni, password })
    .pipe(
      tap( resp=> console.log('Esta es la respuesta al loguearme:', resp)),
      map(resp => this.handleAuthSuccess(resp)),
      catchError((error: any) => this.handleAuthError(error))
    )
  }

  getUserId():number {
    return this. _User()!.Persona[0].Id;
  }




  createPerson(dni:string): Observable<any>{
    return this.http.post(`${this.url}/auth/addpersona`, dni)
  }

  verifyDni(dni: string, telefono:string): Observable<any> {
    return this.http.post(`${this.url}/auth/verify-dni`, {dni, telefono})
  }

  verifyDniRecoveryPass(dni: string,  telefono:string): Observable<any> {
    return this.http.post(`${this.url}/auth/verify-repass`, {dni, telefono})
  }

  register(dni: string, password: string): Observable<{success: boolean, error?: string}> {

    return this.http.post<User>(`${this.url}/auth/register`, {dni, password})
    .pipe(
      tap( resp=> {
        console.log('=== RESPUESTA REGISTRO EXITOSA ===');
        console.log('Respuesta completa:', resp);
        console.log('================================');
      }),
      map(resp => {
        this.handleAuthSuccess(resp);
        return { success: true };
      }),
      catchError((error: any) => {
        console.error('=== ERROR EN REGISTRO ===');
        console.error('Error completo:', error);
        console.error('error.error:', error?.error);
        console.error('error.status:', error?.status);
        console.error('error.message:', error?.message);
        console.error('=========================');
        const errorMessage = error?.error?.message || error?.message || 'Error desconocido al registrar';
        return of({ success: false, error: errorMessage });
      })
    )
  }

  sendAvatar(formData: FormData):  Observable<any>  {
    return this.http.post(`${this.url}/auth/upload-profileimage`, formData)
  }

  updateAvatar(formData: FormData):  Observable<any>  {
    console.log(formData);

    return this.http.post(`${this.url}/auth/update-profileimage`, formData)
  }


  sendOtp(phoneNumber:string): Observable<any> {

    return this.http.post(`${this.url}/auth/send-otp`, { phoneNumber } )
  }

  verifyOtp( phoneNumber: string,otp: string) {
    return this.http.post(`${this.url}/auth/verify-otp`, {phoneNumber, otp})
  }

  resetPassword(id: number, password: string): Observable<any> {
    return this.http.post(`${this.url}/auth/resetPassword`, {
      id,
      password
    })

  }

  getContacto(id: string) {

  }

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

  logout() {
    this._User.set(null)
    this._token.set(null)
    this._authStatus.set('not-authenticated')
    localStorage.removeItem('token')
    this.checkStatus$ = undefined;
    this.clearProfileImageCache();
  }

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

  private handleAuthError( error: any ) {
    this.logout();
    return of(false)
  }

  getProfileImageUrl(userId: number): string {
    return `${this.url}/auth/profile-image/${userId}`;
  }

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

}
