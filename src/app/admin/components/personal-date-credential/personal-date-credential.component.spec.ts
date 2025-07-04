import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PersonalDateCredentialComponent } from './personal-date-credential.component';

describe('PersonalDateCredentialComponent', () => {
  let component: PersonalDateCredentialComponent;
  let fixture: ComponentFixture<PersonalDateCredentialComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonalDateCredentialComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PersonalDateCredentialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
