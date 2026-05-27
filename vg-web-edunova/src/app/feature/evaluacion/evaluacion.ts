import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TareasEntregasComponent } from './tareas-entregas/tareas-entregas';
import { CalificacionesViewComponent } from './calificaciones-view/calificaciones-view';
import { BancoPreguntasComponent } from './banco-preguntas/banco-preguntas';
import { ExamenesComponent } from './examenes/examenes';

@Component({
  selector: 'app-evaluacion',
  standalone: true,
  imports: [
    CommonModule, 
    TareasEntregasComponent, 
    CalificacionesViewComponent, 
    BancoPreguntasComponent,
    ExamenesComponent
  ],
  templateUrl: './evaluacion.html',
  styleUrl: './evaluacion.scss'
})
export class EvaluacionComponent {
  // Tab activo
  tabActivo = signal<'tareas' | 'calificaciones' | 'banco' | 'examenes'>('tareas');

  /**
   * Cambiar tab activo
   */
  cambiarTab(tab: 'tareas' | 'calificaciones' | 'banco' | 'examenes'): void {
    this.tabActivo.set(tab);
  }
}
