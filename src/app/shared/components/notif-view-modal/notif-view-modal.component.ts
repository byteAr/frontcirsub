import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-notif-view-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notif-view-modal.component.html',
})
export class NotifViewModalComponent {
  visible = input<boolean>(false);
  titulo = input<string>('');
  cuerpo = input<string>('');

  closed = output<void>();

  close() {
    this.closed.emit();
  }
}
