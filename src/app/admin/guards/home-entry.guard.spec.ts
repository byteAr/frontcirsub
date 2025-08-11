import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { homeEntryGuard } from './home-entry.guard';

describe('homeEntryGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => homeEntryGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
