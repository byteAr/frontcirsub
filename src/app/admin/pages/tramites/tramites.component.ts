import { Component } from '@angular/core';
import { TableComponent } from "../../../shared/components/table/table.component";
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-tramites',
  imports: [TableComponent, RouterOutlet],
  templateUrl: './tramites.component.html',
  styleUrl: './tramites.component.css'
})
export default class TramitesComponent {

}
