import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { FloatLabel } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

interface Email {
  email: string;
}

@Component({
  selector: 'app-responsable-tramite-detail',
  imports: [FloatLabel, InputTextModule, SelectModule, FormsModule, CommonModule, ReactiveFormsModule],
  templateUrl: './responsable-tramite-detail.component.html',
  styleUrl: './responsable-tramite-detail.component.css'
})
export default class ResponsableTramiteDetailComponent implements OnInit {

  emails: Email[] | undefined;
  selectPerioricidad: Email | undefined;

  ngOnInit(): void {
    this.emails = [
      { email: 'marcos@gmail.com'},
      { email: 'marcos2@gmail.com'},
      { email: 'marcos3@gmail.com'},
      { email: 'marcos4@gmail.com'}
  ];
  }

}
