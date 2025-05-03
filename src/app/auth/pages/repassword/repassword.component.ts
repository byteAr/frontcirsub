import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-repassword',
  imports: [ReactiveFormsModule],
  templateUrl: './repassword.component.html',
  styleUrl: './repassword.component.css'
})
export class RepasswordComponent {

  fb = inject(FormBuilder);

  hasError = signal(false);

  repasswordForm = this.fb.group({
    password:(['',[Validators.required]]),
    repassword:(['',[Validators.required]]),
  })

  onSubmit(){
    if(this.repasswordForm.invalid) {
      this.hasError.set(true);
      setTimeout(() => {
        this.hasError.set(false)
      }, 3000);
      return;
    }

    const { password='', repassword='' } = this.repasswordForm.value

    console.log({password, repassword});

  }

}
