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

  verifyDni(dni: string) {
    return this.http.post(`${this.url}/auth/verifyDni`, {dni})
  }

  register(dni: string, email: string, phoneNumber: string): Observable<any> {
    return this.http.post(`${this.url}/auth/register`, {dni, email, phoneNumber})
  }

  sendOtp(phoneNumber:string, email:string): Observable<any> {


    return this.http.post(`${this.url}/auth/send-otp`, { phoneNumber, email } )
  }

  verifyOtp( phoneNumber: string,otp: string) {
    return this.http.post(`${this.url}/auth/verify-otp`, {phoneNumber, otp})
  }

  resetPassword(id: number, password: string) {
    return this.http.post(`${this.url}/auth/resetPassword`, {
      id,
      password
    })

  }

}
