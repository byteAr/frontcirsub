import { Component, inject, OnInit, ViewChild } from '@angular/core';

//PrimeNg
import { Table } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ProcedureService } from '../../services/procedures.service';
import { RouterLink } from '@angular/router';


@Component({
  selector: 'app-table',
  imports: [RouterLink ,TagModule, IconFieldModule, InputIconModule, InputTextModule, MultiSelectModule,SelectModule,CommonModule,TableModule, ],
  templateUrl: './table.component.html',
  styleUrl: './table.component.css',
})
export class TableComponent implements OnInit {



  @ViewChild('dt') dt!: Table;
  datos : any
  loading: boolean = true;
  statuses!: any[];
  activityValues: number[] = [0, 100];

  tramitesServices = inject(ProcedureService);



  ngOnInit(): void {
    const response = this.tramitesServices.getAllPorcedures()
      .subscribe( data => {
        console.log(data);

        this.datos = data

      })


    this.loading = false;
    this.statuses = [
      { label: 'Unqualified', value: 'unqualified' },
      { label: 'Qualified', value: 'qualified' },
      { label: 'New', value: 'new' },
      { label: 'Negotiation', value: 'negotiation' },
      { label: 'Renewal', value: 'renewal' },
      { label: 'Proposal', value: 'proposal' }
  ];

  }

  filtrarGlobal(event: Event) {
    const input = event.target as HTMLInputElement;
    if (this.dt) {
      this.dt.filterGlobal(input.value, 'contains');
    }
  }

    clear(table: Table) {
      table.clear();
  }

}
