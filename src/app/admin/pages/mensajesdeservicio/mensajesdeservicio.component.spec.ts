import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { MensajesdeservicioComponent } from './mensajesdeservicio.component';

describe('MensajesdeservicioComponent', () => {
  let component: MensajesdeservicioComponent;
  let fixture: ComponentFixture<MensajesdeservicioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MensajesdeservicioComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideServiceWorker('ngsw-worker.js', { enabled: false }), provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MensajesdeservicioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
