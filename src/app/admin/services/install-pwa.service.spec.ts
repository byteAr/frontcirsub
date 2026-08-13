import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { InstallPwaService } from './install-pwa.service';

describe('InstallPwaService', () => {
  let service: InstallPwaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InstallPwaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
