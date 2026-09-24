import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import GrupoFamiliarComponent from './grupo-familiar.component';

describe('GrupoFamiliarComponent', () => {
  let component: GrupoFamiliarComponent;
  let fixture: ComponentFixture<GrupoFamiliarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GrupoFamiliarComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideServiceWorker('ngsw-worker.js', { enabled: false }), provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GrupoFamiliarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
