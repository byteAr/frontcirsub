
import { Component, OnInit } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import { BadgeModule } from 'primeng/badge';
import { AvatarModule } from 'primeng/avatar';
import { InputTextModule } from 'primeng/inputtext';
import { CommonModule } from '@angular/common';
import { Ripple } from 'primeng/ripple'

@Component({
  selector: 'app-header',
  imports: [Menubar, BadgeModule, AvatarModule, InputTextModule, Ripple, CommonModule],
  templateUrl: './header.component.html',
  styles: ``
})
export class HeaderComponent implements OnInit {

  items: MenuItem[] | undefined;

  ngOnInit(): void {
    this.items = [
      {
          label: 'Home',
          icon: 'pi pi-home',
      },
      {
          label: 'Projects',
          icon: 'pi pi-search',
          badge: '3',
          items: [
              {
                  label: 'Core',
                  icon: 'pi pi-bolt',
                  shortcut: '⌘+S',
              },
              {
                  label: 'Blocks',
                  icon: 'pi pi-server',
                  shortcut: '⌘+B',
              },
              {
                  separator: true,
              },
              {
                  label: 'UI Kit',
                  icon: 'pi pi-pencil',
                  shortcut: '⌘+U',
              },
          ],
      },
  ];
  }

}
