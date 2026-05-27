import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-tutoria-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './tutoria-form.component.html',
  styleUrl: './tutoria-form.component.scss',
})
export class TutoriaFormComponent {}
