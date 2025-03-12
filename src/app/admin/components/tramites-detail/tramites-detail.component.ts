import { Component, inject } from '@angular/core';
import { FormBuilder, FormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-tramites-detail',
  imports: [FormsModule, RouterLink ],
  templateUrl: './tramites-detail.component.html',
  styleUrl: './tramites-detail.component.css'
})
export default class TramitesDetailComponent {

  fb = inject(FormBuilder);

  formDetailTramite = this.fb.group({
    detalle: ['', [Validators.required]],
    fechaInicio: ['', [Validators.required]],
    fechaFin: ['', [Validators.required]],
    perioricidad: ['', [Validators.required]],
    activo: [false, [Validators.required]]
  })

}
