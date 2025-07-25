import { AfterViewInit, Component, inject, OnInit } from '@angular/core';
import { UserData } from '../../../auth/interfaces/user.interface';
import { AuthService } from '../../../auth/services/auth.service';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-personal-date-credential',
  imports: [CommonModule, RouterLink],
  templateUrl: './personal-date-credential.component.html',
  styleUrl: './personal-date-credential.component.css'
})
export default class PersonalDateCredentialComponent implements OnInit, AfterViewInit {


  imagenUrl: SafeUrl  | null = null;

  http = inject(HttpClient)

  autService = inject(AuthService);
  sanitizer = inject(DomSanitizer);

  user : UserData | null = null

  ngOnInit(): void {
    setTimeout(() => {
      const id = this.user?.Persona[0].Id;
    const idString = id?.toString();
    this.http.get(`http://localhost:3000/auth/profile-image/${idString}`, {
      responseType: 'blob'
    }).subscribe(blob => {
      const objectURL = URL.createObjectURL(blob);
      this.imagenUrl = this.sanitizer.bypassSecurityTrustUrl(objectURL);
    });
    }, 50);


  };

  ngAfterViewInit(): void {
    this.user = this.autService.user();
  }


}
