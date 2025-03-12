import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TramitesDetailComponent } from './tramites-detail.component';

describe('TramitesDetailComponent', () => {
  let component: TramitesDetailComponent;
  let fixture: ComponentFixture<TramitesDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TramitesDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TramitesDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
