import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificationsOficialesComponent } from './notifications-oficiales.component';

describe('NotificationsOficialesComponent', () => {
  let component: NotificationsOficialesComponent;
  let fixture: ComponentFixture<NotificationsOficialesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationsOficialesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotificationsOficialesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
