import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstallButtonComponent } from './install-button.component';

describe('InstallButtonComponent', () => {
  let component: InstallButtonComponent;
  let fixture: ComponentFixture<InstallButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstallButtonComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InstallButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
