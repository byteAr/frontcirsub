import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '../../../auth/services/auth.service';
import { CredencialService } from '../../services/credencial.service';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';

function cbuValidator(control: AbstractControl): ValidationErrors | null {
  const str = String(control.value ?? '');
  if (!/^\d{22}$/.test(str)) return { formato: true };
  if (/^0{22}$/.test(str)) return { todoCeros: true };
  return null;
}

@Component({
  selector: 'app-cbu',
  imports: [ReactiveFormsModule, CommonModule, ToastModule, DialogModule],
  templateUrl: './cbu.component.html',
  styleUrl: './cbu.component.css',
  providers: [MessageService]
})
export default class CBUComponent implements OnInit {

  autService = inject(AuthService);
  credencialService = inject(CredencialService);
  messageService = inject(MessageService);

  visible = true;
  submitted = false;
  showConfirmModal = signal(false);

  form: FormGroup;
  user = this.autService.user;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      cbu: this.fb.control({ value: '', disabled: true }, [cbuValidator])
    });
  }

  ngOnInit(): void {
    const id = this.user()?.Persona[0].Id.toString();
    if (!id) return;
    this.credencialService.getCbu(id).subscribe(resp => {
      this.form.patchValue({ cbu: resp.cbu ? `${resp.cbu}` : '0000000000000000000000' });
    });
  }

  get cbuIngresado(): string {
    return this.form.get('cbu')?.value ?? '';
  }

  activatedEdit() {
    this.form.get('cbu')?.setValue('');
    this.form.get('cbu')?.enable();
    this.visible = false;
  }

  solicitarConfirmacion() {
    this.submitted = true;
    if (this.form.invalid) return;
    this.showConfirmModal.set(true);
  }

  confirmarGuardar() {
    this.showConfirmModal.set(false);
    const id = this.user()?.Persona[0].Id;
    if (!id) return;
    const cbuValue = this.cbuIngresado;

    this.credencialService.updateCbu(id, cbuValue).subscribe();
    this.credencialService.updateCbuPhp(id, cbuValue).subscribe();

    this.messageService.add({
      severity: 'success',
      summary: 'CBU actualizado con éxito',
      life: 4000
    });

    this.form.get('cbu')?.disable();
    this.visible = true;
    this.submitted = false;
  }

  cancelarGuardar() {
    this.showConfirmModal.set(false);
  }
}
