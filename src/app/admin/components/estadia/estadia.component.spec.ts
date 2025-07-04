import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EstadiaComponent } from './estadia.component';

describe('EstadiaComponent', () => {
  let component: EstadiaComponent;
  let fixture: ComponentFixture<EstadiaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EstadiaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EstadiaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
