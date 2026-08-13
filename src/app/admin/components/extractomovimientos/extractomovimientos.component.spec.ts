import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import ExtractomovimientosComponent from './extractomovimientos.component';

describe('ExtractomovimientosComponent', () => {
  let component: ExtractomovimientosComponent;
  let fixture: ComponentFixture<ExtractomovimientosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExtractomovimientosComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideServiceWorker('ngsw-worker.js', { enabled: false }), provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExtractomovimientosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
