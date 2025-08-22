import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PassrecoveryComponent } from './passrecovery.component';

describe('PassrecoveryComponent', () => {
  let component: PassrecoveryComponent;
  let fixture: ComponentFixture<PassrecoveryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PassrecoveryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PassrecoveryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
