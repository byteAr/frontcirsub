import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExtractomovimientosComponent } from './extractomovimientos.component';

describe('ExtractomovimientosComponent', () => {
  let component: ExtractomovimientosComponent;
  let fixture: ComponentFixture<ExtractomovimientosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExtractomovimientosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExtractomovimientosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
