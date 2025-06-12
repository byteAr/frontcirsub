import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';

@Injectable({providedIn: 'root'})
export class AuthService {

  url = environment.API_URL

  http = inject(HttpClient)
  constructor() { }

  createPerson(dni:string): Observable<any>{
    return this.http.post(`${this.url}/auth/addpersona`, dni)
  }

  register(dni: string): Observable<any> {
    return this.http.post(`${this.url}/auth/register`, {dni})
  }

  sendOtp(phoneNumber:string, email:string): Observable<any> {
    console.log('llego als ervicio auth');

    return this.http.post(`${this.url}/auth/send-otp`, { phoneNumber, email } )
  }

}
