import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-splash',
  templateUrl: './splash.component.html'
})
export default class SplashComponent implements OnInit {
  private router = inject(Router);

  ngOnInit(): void {
    // Duración = 1.6s (igual que el keyframe). Agrega un pelín de margen.
    setTimeout(() => {
      sessionStorage.setItem('splashShown', '1');
      this.router.navigateByUrl('/auth/login', { replaceUrl: true });
    }, 1700);
  }
}
