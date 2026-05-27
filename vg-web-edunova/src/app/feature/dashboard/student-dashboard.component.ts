import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Calendar, CheckCircle, Clock, BookOpen, Filter } from 'lucide-angular';
import { TaskService, StudentDashboard, MateriaDashboard, TareaDashboard } from '../../core/services/task.service';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="student-dashboard">
      <div class="dashboard-header">
        <h2>Mis Estudios</h2>
        <p>Bienvenido, {{ dashboard?.studentName }}</p>
      </div>

      <div class="filters">
        <div class="filter-group">
          <label>Filtrar por materia:</label>
          <select [(ngModel)]="filtroMateriaId" (change)="filtrarTareas()">
            <option [value]="0">Todas las materias</option>
            <option *ngFor="let materia of materiasConTareas" [value]="materia.materiaId">
              {{ materia.materiaNombre }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label>Estado:</label>
          <select [(ngModel)]="filtroEstado" (change)="filtrarTareas()">
            <option value="todas">Todas</option>
            <option value="pendiente">Pendientes</option>
            <option value="calificada">Calificadas</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Período:</label>
          <select [(ngModel)]="filtroPeriodo" (change)="filtrarTareas()">
            <option value="todas">Todas</option>
            <option value="trimestre1">1er Trimestre</option>
            <option value="trimestre2">2do Trimestre</option>
            <option value="trimestre3">3er Trimestre</option>
            <option value="rango3meses">Últimos 3 meses</option>
          </select>
        </div>

        <button class="btn-clear" (click)="limpiarFiltros()">
          Limpiar filtros
        </button>
      </div>

      <div class="materias-grid">
        <div *ngFor="let materia of materiasFiltradas" class="materia-card">
          <div class="materia-header" [style.background]="getColorMateria(materia.materiaId)">
            <h3>{{ materia.materiaNombre }}</h3>
            <span class="grado">{{ materia.gradoNombre }}</span>
          </div>
          
          <div class="materia-stats">
            <span class="stat">📋 {{ materia.tareas.length }} tareas</span>
            <span class="stat" *ngIf="getCalificadas(materia).length > 0">
              ✅ {{ getCalificadas(materia).length }} calificadas
            </span>
          </div>

          <div class="tareas-lista" *ngIf="materia.tareas.length > 0; else sinTareas">
            <div *ngFor="let tarea of materia.tareas" class="tarea-item">
              <div class="tarea-info">
                <div class="tarea-titulo">{{ tarea.titulo }}</div>
                <div class="tarea-fecha">📅 Entrega: {{ tarea.fechaEntrega | date:'dd/MM/yyyy' }}</div>
                <div class="tarea-nota" *ngIf="tarea.nota !== null">
                  Nota: <strong>{{ tarea.nota }}/20</strong>
                </div>
              </div>
            </div>
          </div>
          <ng-template #sinTareas>
            <div class="sin-tareas">📖 No hay tareas</div>
          </ng-template>
        </div>
      </div>

      <div *ngIf="materiasFiltradas.length === 0" class="no-data">
        <h3>No hay tareas</h3>
        <p>No se encontraron tareas con los filtros seleccionados</p>
      </div>
    </div>
  `,
  styles: [`
    .student-dashboard { padding: 24px; max-width: 1400px; margin: 0 auto; }
    .dashboard-header { margin-bottom: 24px; }
    .dashboard-header h2 { margin: 0 0 8px; font-size: 24px; color: #1f2937; }
    .filters { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 24px; padding: 16px; background: #f9fafb; border-radius: 12px; align-items: flex-end; }
    .filter-group { display: flex; flex-direction: column; gap: 6px; }
    .filter-group label { font-size: 12px; font-weight: 500; color: #6b7280; }
    .filter-group select { padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 8px; background: white; min-width: 150px; }
    .btn-clear { padding: 8px 16px; background: white; border: 1px solid #e5e7eb; border-radius: 8px; cursor: pointer; }
    .materias-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 20px; }
    .materia-card { background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .materia-header { padding: 16px; color: white; display: flex; justify-content: space-between; align-items: center; }
    .materia-header h3 { margin: 0; font-size: 18px; }
    .materia-header .grado { background: rgba(255,255,255,0.2); padding: 4px 8px; border-radius: 8px; font-size: 12px; }
    .materia-stats { padding: 12px 16px; background: #f9fafb; display: flex; gap: 16px; border-bottom: 1px solid #e5e7eb; }
    .stat { font-size: 13px; color: #6b7280; }
    .tareas-lista { padding: 8px 0; }
    .tarea-item { padding: 12px 16px; border-bottom: 1px solid #f0f0f0; }
    .tarea-titulo { font-weight: 500; margin-bottom: 4px; }
    .tarea-fecha { font-size: 12px; color: #6b7280; margin: 4px 0; }
    .tarea-nota { font-size: 13px; margin-top: 4px; }
    .sin-tareas { padding: 32px; text-align: center; color: #9ca3af; }
    .no-data { text-align: center; padding: 48px; color: #9ca3af; }
  `]
})
export class StudentDashboardComponent implements OnInit {
  private taskService = inject(TaskService);
  
  dashboard: StudentDashboard | null = null;
  materiasOriginales: MateriaDashboard[] = [];
  materiasFiltradas: MateriaDashboard[] = [];
  
  filtroMateriaId: number = 0;
  filtroEstado: string = 'todas';
  filtroPeriodo: string = 'todas';
  
  get materiasConTareas(): MateriaDashboard[] {
    return this.materiasOriginales.filter(m => m.tareas.length > 0);
  }
  
  async ngOnInit() {
    await this.cargarDashboard(1);
  }
  
  async cargarDashboard(studentId: number) {
    try {
      this.dashboard = await this.taskService.getStudentDashboard(studentId).toPromise() ?? null;
      if (this.dashboard) {
        this.materiasOriginales = this.dashboard.materias;
        this.filtrarTareas();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }
  
  getCalificadas(materia: MateriaDashboard): TareaDashboard[] {
    return materia.tareas.filter(t => t.nota !== null);
  }
  
  filtrarTareas() {
    this.materiasFiltradas = this.materiasOriginales
      .map(materia => ({
        ...materia,
        tareas: materia.tareas.filter(tarea => {
          if (this.filtroMateriaId !== 0 && materia.materiaId !== this.filtroMateriaId) return false;
          if (this.filtroEstado === 'pendiente' && tarea.nota !== null) return false;
          if (this.filtroEstado === 'calificada' && tarea.nota === null) return false;
          if (this.filtroPeriodo !== 'todas') {
            const fecha = new Date(tarea.fechaEntrega);
            const mes = fecha.getMonth() + 1;
            if (this.filtroPeriodo === 'trimestre1' && (mes < 3 || mes > 5)) return false;
            if (this.filtroPeriodo === 'trimestre2' && (mes < 6 || mes > 8)) return false;
            if (this.filtroPeriodo === 'trimestre3' && (mes < 9 || mes > 11)) return false;
            if (this.filtroPeriodo === 'rango3meses') {
              const hace3 = new Date();
              hace3.setMonth(hace3.getMonth() - 3);
              if (fecha < hace3) return false;
            }
          }
          return true;
        })
      }))
      .filter(materia => materia.tareas.length > 0);
  }
  
  limpiarFiltros() {
    this.filtroMateriaId = 0;
    this.filtroEstado = 'todas';
    this.filtroPeriodo = 'todas';
    this.filtrarTareas();
  }
  
  getColorMateria(id: number): string {
    const colores = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899', '#06b6d4'];
    return colores[(id - 1) % colores.length];
  }
}

import { inject } from '@angular/core';
