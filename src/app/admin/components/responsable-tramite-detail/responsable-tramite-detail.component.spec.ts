import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResponsableTramiteDetailComponent } from './responsable-tramite-detail.component';

describe('ResponsableTramiteDetailComponent', () => {
  let component: ResponsableTramiteDetailComponent;
  let fixture: ComponentFixture<ResponsableTramiteDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResponsableTramiteDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResponsableTramiteDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
