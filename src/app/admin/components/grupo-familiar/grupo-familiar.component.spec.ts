import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GrupoFamiliarComponent } from './grupo-familiar.component';

describe('GrupoFamiliarComponent', () => {
  let component: GrupoFamiliarComponent;
  let fixture: ComponentFixture<GrupoFamiliarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GrupoFamiliarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GrupoFamiliarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
