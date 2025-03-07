import { Component } from '@angular/core';

import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-sidebar',
  imports: [DrawerModule, ButtonModule],
  templateUrl: './sidebar.component.html',
  styles: ``
})
export class SidebarComponent {

  visible: boolean = false

  visibleDrawer() {
    this.visible = !this.visible
  }

}
