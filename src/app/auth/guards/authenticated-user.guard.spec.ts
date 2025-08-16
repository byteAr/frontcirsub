import { TestBed } from '@angular/core/testing';
import { CanMatchFn } from '@angular/router';

import { authenticatedUserGuard } from './authenticated-user.guard';

describe('authenticatedUserGuard', () => {
  const executeGuard: CanMatchFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => authenticatedUserGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
