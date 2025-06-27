import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MensajesdeservicioComponent } from './mensajesdeservicio.component';

describe('MensajesdeservicioComponent', () => {
  let component: MensajesdeservicioComponent;
  let fixture: ComponentFixture<MensajesdeservicioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MensajesdeservicioComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MensajesdeservicioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
