import { Component, OnInit } from '@angular/core';

import { StepsModule } from 'primeng/steps';
import { MenuItem } from 'primeng/api';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-nuevo-tramite',
  templateUrl: './nuevo-tramite.component.html',
  imports:[StepsModule, RouterOutlet],
  styleUrl: './nuevo-tramite.component.css'
})
export default class NuevoTramiteComponent implements OnInit {

  items: MenuItem[] | undefined;

  ngOnInit() {
    this.items = [
        {
            label: 'Detalle',
            routerLink: ''
        },
        {
            label: 'Asignar responsable',
            routerLink: 'responsable'
        },
        {
            label: 'Confirmar',
            routerLink: 'seat'
        }
    ];
}

}
