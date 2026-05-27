import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TaskService, Task } from '../../core/services/task.service';

@Component({
  selector: 'app-task-detail-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dialog-overlay" (click)="cerrar()">
      <div class="dialog-container" [class.border-red]="notaColor === 'red'" [class.border-yellow]="notaColor === 'yellow'" [class.border-green]="notaColor === 'green'" (click)="$event.stopPropagation()">
        <div class="dialog-header" [class.bg-red]="notaColor === 'red'" [class.bg-yellow]="notaColor === 'yellow'" [class.bg-green]="notaColor === 'green'" [class.bg-blue]="!notaColor">
          <h2>{{task?.title}}</h2>
          <button class="close-btn" (click)="cerrar()">✕</button>
        </div>
        
        <div class="dialog-body">
          <div class="info-section">
            <div class="info-row">
              <span class="info-label">Descripción:</span>
              <span class="info-value">{{task?.description || 'Sin descripción'}}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Instrucciones:</span>
              <span class="info-value">{{task?.instructions || 'Sin instrucciones'}}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Materia:</span>
              <span class="info-value">{{materiaNombre}}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Fecha límite:</span>
              <span class="info-value">{{task?.dueDate | date:'dd/MM/yyyy HH:mm'}}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Estado:</span>
              <span class="info-value">{{getStudentStatusText()}}</span>
            </div>
          </div>
          
          <div class="nota-section">
            <div class="nota-circle" *ngIf="miNota !== null" [class.nota-red]="miNota < 11" [class.nota-yellow]="miNota >= 11 && miNota <= 16" [class.nota-green]="miNota > 16">
              <span class="nota-value">{{miNota}}</span>
              <span class="nota-max">/20</span>
            </div>
            <div class="nota-circle pending" *ngIf="miNota === null">
              <span class="nota-value">?</span>
            </div>
            <div class="nota-message" *ngIf="miNota !== null" [class.text-red]="miNota < 11" [class.text-yellow]="miNota >= 11 && miNota <= 16" [class.text-green]="miNota > 16">
              {{miNota < 11 ? 'Necesitas mejorar' : (miNota <= 16 ? 'Buen trabajo' : 'Excelente!')}}
            </div>
            <div class="nota-message" *ngIf="miNota === null">Sin calificar aún</div>
          </div>
          
          <div *ngIf="observaciones" class="observaciones">
            <div class="observaciones-label">Observaciones del profesor:</div>
            <div class="observaciones-value">{{observaciones}}</div>
          </div>
        </div>
        
        <div class="dialog-footer">
          <button class="btn-cerrar" (click)="cerrar()">Cerrar</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dialog-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .dialog-container {
      background: white;
      border-radius: 12px;
      width: 90%;
      max-width: 500px;
      max-height: 85vh;
      overflow: hidden;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
      animation: fadeIn 0.2s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    .border-red { border-top: 4px solid #dc2626; }
    .border-yellow { border-top: 4px solid #ca8a04; }
    .border-green { border-top: 4px solid #16a34a; }
    .dialog-header {
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: white;
    }
    .dialog-header h2 { margin: 0; font-size: 1.1rem; font-weight: 600; }
    .close-btn {
      background: none;
      border: none;
      color: white;
      font-size: 1.3rem;
      cursor: pointer;
      opacity: 0.8;
    }
    .close-btn:hover { opacity: 1; }
    .bg-red { background: #dc2626; }
    .bg-yellow { background: #ca8a04; }
    .bg-green { background: #16a34a; }
    .bg-blue { background: #2563eb; }
    .dialog-body { padding: 20px; max-height: calc(85vh - 120px); overflow-y: auto; }
    .info-section { margin-bottom: 20px; }
    .info-row { margin-bottom: 10px; display: flex; flex-wrap: wrap; }
    .info-label { font-weight: 600; color: #374151; width: 100px; flex-shrink: 0; }
    .info-value { color: #4b5563; flex: 1; }
    .nota-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px;
      background: #f9fafb;
      border-radius: 10px;
      margin-bottom: 20px;
    }
    .nota-circle {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      margin-bottom: 10px;
    }
    .nota-red { background: #dc2626; color: white; }
    .nota-yellow { background: #ca8a04; color: white; }
    .nota-green { background: #16a34a; color: white; }
    .pending { background: #9ca3af; color: white; }
    .nota-value { font-size: 2rem; font-weight: bold; line-height: 1; }
    .nota-max { font-size: 0.7rem; opacity: 0.8; }
    .nota-message { font-size: 0.9rem; font-weight: 500; margin-top: 5px; }
    .text-red { color: #dc2626; }
    .text-yellow { color: #ca8a04; }
    .text-green { color: #16a34a; }
    .observaciones {
      background: #f3f4f6;
      padding: 12px;
      border-radius: 8px;
      margin-top: 16px;
    }
    .observaciones-label { font-weight: 600; color: #374151; margin-bottom: 5px; font-size: 0.8rem; }
    .observaciones-value { color: #4b5563; font-size: 0.85rem; white-space: pre-wrap; }
    .dialog-footer {
      padding: 12px 20px;
      background: #f9fafb;
      display: flex;
      justify-content: flex-end;
      border-top: 1px solid #e5e7eb;
    }
    .btn-cerrar {
      padding: 8px 20px;
      background: #e5e7eb;
      border: none;
      border-radius: 6px;
      font-size: 0.8rem;
      cursor: pointer;
    }
    .btn-cerrar:hover { background: #d1d5db; }
  `]
})
export class TaskDetailDialogComponent implements OnInit {
  task: Task | null = null;
  materiaNombre = '';
  miNota: number | null = null;
  observaciones: string | null = null;
  notaColor: string | null = null;

  constructor(
    private taskService: TaskService,
    private dialogRef: MatDialogRef<TaskDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit() {
    this.taskService.getTaskById(this.data.taskId).subscribe(t => {
      this.task = t;
      this.cargarMiNota();
    });
    this.materiaNombre = this.data.materiaNombre || '';
  }

  cargarMiNota() {
    const studentId = Number(this.data.studentId);

    if (this.data.nota !== undefined) {
      this.miNota = this.data.nota;
      this.observaciones = this.data.observaciones || null;
      this.actualizarColorNota();
    }

    if (!studentId) return;
    
    this.taskService.getSubmissionsByStudent(studentId).subscribe(submissions => {
      const submission = submissions.find(s => Number(s.taskId) === Number(this.data.taskId));
      if (submission) {
        this.miNota = submission.grade;
        this.observaciones = submission.observations || submission.feedback || this.observaciones;
        this.actualizarColorNota();
      }
    });
  }

  actualizarColorNota() {
    this.notaColor = null;
    if (this.miNota === null || this.miNota === undefined) return;
    if (this.miNota < 11) {
      this.notaColor = 'red';
    } else if (this.miNota <= 16) {
      this.notaColor = 'yellow';
    } else {
      this.notaColor = 'green';
    }
  }

  getStudentStatusText(): string {
    if (this.miNota !== null && this.miNota !== undefined) return 'Calificado';
    if (this.data.entregada) return 'Entregado';
    return this.getStatusText(this.task?.status);
  }

  getStatusText(status?: string): string {
    const textos: any = {
      draft: 'Borrador',
      published: 'Publicada',
      closed: 'Cerrada',
      submitted: 'Entregado',
      graded: 'Calificado'
    };
    return textos[status || ''] || status;
  }

  cerrar() {
    this.dialogRef.close();
  }
}
