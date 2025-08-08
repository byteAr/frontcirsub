import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CBUComponent } from './cbu.component';

describe('CBUComponent', () => {
  let component: CBUComponent;
  let fixture: ComponentFixture<CBUComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CBUComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CBUComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
