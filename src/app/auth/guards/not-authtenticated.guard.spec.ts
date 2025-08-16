import { TestBed } from '@angular/core/testing';
import { CanMatchFn } from '@angular/router';

import { notAuthtenticatedGuard } from './not-authtenticated.guard';

describe('notAuthtenticatedGuard', () => {
  const executeGuard: CanMatchFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => notAuthtenticatedGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
