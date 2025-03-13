import { CommonModule } from '@angular/common';
import {  Component,  inject, OnInit } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

import { DatePickerModule } from 'primeng/datepicker';
import { FloatLabel } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { TramitesService } from '../../services/tramites.service';

interface Periodo {
  tipoPerioricidad: string;
}

@Component({
  selector: 'app-tramites-detail',
  imports: [ReactiveFormsModule, DatePickerModule, FloatLabel, InputTextModule, SelectModule, CheckboxModule, CommonModule, FormsModule ],
  templateUrl: './tramites-detail.component.html',
  styleUrl: './tramites-detail.component.css',
})
export default class TramitesDetailComponent implements OnInit  {

  checked: boolean = false

    perioricidad: Periodo[] | undefined;

    selectPerioricidad: Periodo | undefined;

    tramitesService = inject(TramitesService);

    ngOnInit() {
        this.perioricidad = [
            { tipoPerioricidad: 'Semanal'},
            { tipoPerioricidad: 'Mensual'},
            { tipoPerioricidad: 'Trimestral'},
            { tipoPerioricidad: 'Semestral'},
            { tipoPerioricidad: 'Anual' }
        ];
    }

  constructor() {}

  fb = inject(FormBuilder);

  formDetailTramite = this.fb.group({
    detalle: ['', [Validators.required, Validators.minLength(4)]],
    fechaInicio: [ Date ,[Validators.required]],
    fechaFin: ['', [Validators.required]],
    tipoPerioricidad: ['', [Validators.required]],
    activo: [false, [Validators.required]]
  })

  onSubmit() {
    this.tramitesService.createTramite(this.formDetailTramite.value)
      .subscribe(data => {
        console.log(data);
      })
  }

}
