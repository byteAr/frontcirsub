import { Component } from '@angular/core';
import { TableComponent } from "../../../shared/components/table/table.component";
import { HeaderComponent } from "../../../shared/components/header/header.component";

@Component({
  selector: 'app-dashboard',
  imports: [TableComponent, HeaderComponent],
  templateUrl: './dashboard.component.html',
  styles: ``
})
export default class DashboardComponent {

}
