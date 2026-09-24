import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import NotificationsOficialesComponent from './notifications-oficiales.component';

describe('NotificationsOficialesComponent', () => {
  let component: NotificationsOficialesComponent;
  let fixture: ComponentFixture<NotificationsOficialesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationsOficialesComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideServiceWorker('ngsw-worker.js', { enabled: false }), provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotificationsOficialesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
