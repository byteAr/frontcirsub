import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SepelioComponent } from './sepelio.component';

describe('SepelioComponent', () => {
  let component: SepelioComponent;
  let fixture: ComponentFixture<SepelioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SepelioComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SepelioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
