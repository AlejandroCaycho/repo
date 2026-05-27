import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-actividad-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './actividad-form.component.html',
  styleUrl: './actividad-form.component.scss',
})
export class ActividadFormComponent {}
