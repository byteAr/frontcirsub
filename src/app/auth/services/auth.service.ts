import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, map, Observable, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, UserData } from '../interfaces/user.interface';

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

  register(dni: string, password: string): Observable<boolean> {

    return this.http.post<User>(`${this.url}/auth/register`, {dni, password})
    .pipe(
      tap( resp=> console.log( 'esta es la respuesta al registrarme:',resp)),
      map(resp => this.handleAuthSuccess(resp)),
      catchError((error: any) => this.handleAuthError(error))
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

    return this.http.get<User>(`${this.url}/auth/check-status`, {
      headers: {
        Authorization: `Bearer ${ token }`
      },
      })
      .pipe(
        map(resp => this.handleAuthSuccess(resp)),
        catchError((error: any) => this.handleAuthError(error))
      )
  }

  logout() {
    this._User.set(null)
    this._token.set(null)
    this._authStatus.set('not-authenticated')
    localStorage.removeItem('token')
  }

  private handleAuthSuccess(resp: User) {
    this._User.set(resp.userData);
    this._authStatus.set('authenticated');
    this._token.set(resp.token);

    localStorage.setItem('token', resp.token);
    return true
  }

  private handleAuthError( error: any ) {
    this.logout();
    return of(false)
  }

  getProfileImageUrl(userId: number): string {
    return `${this.url}/auth/profile-image/${userId}`;
  }

}
