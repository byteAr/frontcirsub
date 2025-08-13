import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdherirseComponent } from './adherirse.component';

describe('AdherirseComponent', () => {
  let component: AdherirseComponent;
  let fixture: ComponentFixture<AdherirseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdherirseComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdherirseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
