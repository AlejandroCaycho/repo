import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { TaskService } from '../../core/services/task.service';

@Component({
  selector: 'app-task-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dialog-container">
      <h2 class="dialog-title">{{ isEdit ? 'Editar Tarea' : 'Nueva Tarea' }}</h2>
      
      <div class="form-group" *ngIf="materiasProfesor.length > 0">
        <label>Materia</label>
        <select [(ngModel)]="selectedClassId" class="form-control">
          <option [value]="0">Seleccionar...</option>
          <option *ngFor="let m of materiasProfesor" [value]="m.classId">
            {{ m.nombre }} - {{ m.gradoNombre }}
          </option>
        </select>
      </div>
      <div class="form-group" *ngIf="materiasProfesor.length === 0">
        <label>Materia</label>
        <select class="form-control" disabled>
          <option>Cargando materias...</option>
        </select>
      </div>
      
      <div class="form-group">
        <label>Titulo</label>
        <input type="text" [(ngModel)]="taskData.title" class="form-control">
      </div>
      
      <div class="form-group">
        <label>Descripcion</label>
        <textarea [(ngModel)]="taskData.description" rows="3" class="form-control"></textarea>
      </div>
      
      <div class="form-group">
        <label>Instrucciones</label>
        <textarea [(ngModel)]="taskData.instructions" rows="3" class="form-control"></textarea>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label>Puntaje</label>
          <input type="number" [(ngModel)]="taskData.pointsValue" class="form-control">
        </div>
        <div class="form-group">
          <label>Fecha limite</label>
          <input type="datetime-local" [(ngModel)]="taskData.dueDate" class="form-control">
        </div>
      </div>
      
      <div class="dialog-actions">
        <button class="btn-cancel" (click)="cancelar()">Cancelar</button>
        <button class="btn-save" (click)="guardar()" [disabled]="isSaving">Guardar</button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container {
      padding: 24px;
      min-width: 500px;
    }
    .dialog-title {
      margin: 0 0 20px 0;
      font-size: 20px;
      font-weight: 600;
    }
    .form-group {
      margin-bottom: 16px;
    }
    .form-group label {
      display: block;
      margin-bottom: 6px;
      font-weight: 500;
      font-size: 14px;
    }
    .form-control {
      width: 100%;
      padding: 10px;
      border: 1px solid #ccc;
      border-radius: 6px;
      font-size: 14px;
      box-sizing: border-box;
    }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
    }
    .btn-cancel {
      padding: 10px 20px;
      background: #e2e8f0;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }
    .btn-save {
      padding: 10px 20px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }
    .btn-save:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }
  `]
})
export class TaskDialogComponent {
  taskData: any = {
    title: '',
    description: '',
    instructions: '',
    pointsValue: 20,
    dueDate: '',
    createdBy: 1
  };
  isEdit = false;
  selectedClassId: number = 0;
  materiasProfesor: any[] = [];
  isSaving = false;

  constructor(
    private taskService: TaskService,
    private dialogRef: MatDialogRef<TaskDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public input: any
  ) {
    const teacherId = input?.teacherId || 1;
    this.taskService.getTeacherSubjects(teacherId).subscribe(response => {
      if (response && response.subjects) {
        this.materiasProfesor = response.subjects.map(s => ({
          classId: Number(s.classId),
          nombre: s.subjectName,
          gradoNombre: s.gradeName,
          subjectId: Number(s.subjectId)
        })).sort((a, b) => `${a.nombre} ${a.gradoNombre}`.localeCompare(`${b.nombre} ${b.gradoNombre}`));
      }
    });
    
    if (input?.task) {
      this.isEdit = true;
      this.taskData = { ...input.task };
      this.selectedClassId = input.task.classId;
      if (this.taskData.dueDate) {
        this.taskData.dueDate = this.taskData.dueDate.slice(0, 16);
      }
    } else {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() + 7);
      this.taskData.dueDate = fecha.toISOString().slice(0, 16);
    }
  }

  guardar() {
    if (this.isSaving) return;
    
    if (!this.selectedClassId || this.selectedClassId === 0) {
      Swal.fire('Error', 'Seleccione una materia', 'error');
      return;
    }
    if (!this.taskData.title || this.taskData.title.trim() === '') {
      Swal.fire('Error', 'Ingrese un titulo', 'error');
      return;
    }
    if (!this.taskData.dueDate) {
      Swal.fire('Error', 'Ingrese una fecha limite', 'error');
      return;
    }
    
    this.isSaving = true;
    
    const dataToSend = {
      title: this.taskData.title,
      description: this.taskData.description || '',
      instructions: this.taskData.instructions || '',
      classId: Number(this.selectedClassId),
      pointsValue: Number(this.taskData.pointsValue) || 0,
      dueDate: this.taskData.dueDate + ':00Z',
      createdBy: this.taskData.createdBy || 1
    };
    
    const req = this.isEdit
      ? this.taskService.updateTask({ id: this.input.task.id, ...dataToSend })
      : this.taskService.createTask(dataToSend);
      
    req.subscribe({
      next: () => {
        Swal.fire('Exito', `Tarea ${this.isEdit ? 'actualizada' : 'creada'} correctamente`, 'success');
        this.dialogRef.close(true);
      },
      error: (err) => {
        console.error('Error:', err);
        Swal.fire('Error', err.error?.message || 'No se pudo guardar la tarea', 'error');
        this.isSaving = false;
      }
    });
  }

  cancelar() {
    this.dialogRef.close(false);
  }
}
