import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../auth/services/auth.service';
import { CredencialService } from '../../services/credencial.service';


@Component({
  selector: 'app-cbu',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './cbu.component.html',
  styleUrl: './cbu.component.css'
})
export default class CBUComponent implements OnInit {

  autService = inject(AuthService);
  credencialService = inject(CredencialService);

  visible=true;

  submitted = false;

  form: FormGroup;

  cbu='';

  user= this.autService.user;



  constructor(private fb: FormBuilder,

  ) {
    this.form = this.fb.group({
      cbu: [
         { value: '', disabled: true },
        [
          Validators.required,
          Validators.minLength(20)
          ,
          Validators.pattern(/^\d{22}$/) // solo 20 dígitos exactos
        ]
      ]
    });
  }
  ngOnInit(): void {
    const id= this.user()?.Persona[0].Id.toString();
    if(!id) return
    this.credencialService.getCbu(id)
      .subscribe(resp => {
        console.log(resp);

        if(resp.cbu) {
          console.log('este es el cbu sherara', resp.cbu);
          this.form.patchValue({
               cbu: `${resp.cbu}`
          });
        } else {
          this.form.patchValue({
               cbu: '0000000000000000000000'
          });
        }
      })

  }



  activatedEdit() {

    this.form.get('cbu')?.enable();
    this.visible=false;
  }

  guardar() {

    const id= this.user()?.Persona[0].Id;
    if(!id) return;
    this.credencialService.updateCbu(id, this.form.get('cbu')?.value)
      .subscribe(resp => {
        console.log(resp);

      })
    this.submitted = true;

    if (this.form.invalid) {
      return;
    }

    this.form.get('cbu')?.disable();
    this.visible=true
  }

}
