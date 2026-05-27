import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TaskService, Task, Submission } from '../../core/services/task.service';

@Component({
  selector: 'app-task-detail-teacher-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dialog-overlay" (click)="cerrar()">
      <div class="dialog-container" (click)="$event.stopPropagation()">
        <div class="dialog-header">
          <h2>{{task?.title}}</h2>
          <button class="close-btn" (click)="cerrar()">✕</button>
        </div>
        
        <div class="dialog-body">
          <!-- Información de la tarea -->
          <div class="info-card">
            <div class="info-row">
              <div class="info-label">Materia</div>
              <div class="info-value">{{materiaNombre}}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Descripción</div>
              <div class="info-value">{{task?.description || 'Sin descripción'}}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Instrucciones</div>
              <div class="info-value">{{task?.instructions || 'Sin instrucciones'}}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Puntaje</div>
              <div class="info-value">{{task?.pointsValue}} puntos</div>
            </div>
            <div class="info-row">
              <div class="info-label">Fecha límite</div>
              <div class="info-value">{{task?.dueDate | date:'dd/MM/yyyy HH:mm'}}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Estado</div>
              <div class="info-value">
                <span class="status-badge" [class.draft]="task?.status === 'draft'" [class.published]="task?.status === 'published'" [class.closed]="task?.status === 'closed'">
                  {{getStatusText(task?.status)}}
                </span>
              </div>
            </div>
          </div>

          <!-- Estadísticas -->
          <div class="stats-section">
            <h3>Estadísticas de entregas</h3>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-number">{{totalEstudiantes}}</div>
                <div class="stat-label">Total estudiantes</div>
              </div>
              <div class="stat-card success">
                <div class="stat-number">{{entregaronCount}}</div>
                <div class="stat-label">Entregaron</div>
              </div>
              <div class="stat-card warning">
                <div class="stat-number">{{noEntregaronCount}}</div>
                <div class="stat-label">No entregaron</div>
              </div>
              <div class="stat-card info">
                <div class="stat-number">{{promedioNotas}}</div>
                <div class="stat-label">Promedio</div>
              </div>
            </div>
          </div>

          <!-- Lista de entregas -->
          <div class="submissions-section" *ngIf="submissions.length > 0">
            <h3>Detalle de entregas</h3>
            <div class="table-wrapper">
              <table class="submissions-table">
                <thead>
                  <tr>
                    <th>Estudiante</th>
                    <th>Código</th>
                    <th>Entregó</th>
                    <th>Fecha</th>
                    <th>Nota</th>
                    <th>Observaciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let sub of submissions">
                    <td class="student-name">{{getStudentName(sub.studentId)}}</td>
                    <td class="student-code">{{getStudentCode(sub.studentId)}}</td>
                    <td class="text-center">
                      <span class="delivery-badge" [class.yes]="sub.presented" [class.no]="!sub.presented">
                        {{sub.presented ? 'Sí' : 'No'}}
                      </span>
                    </td>
                    <td class="date-cell">{{sub.submissionDate | date:'dd/MM/yyyy'}}</td>
                    <td class="grade-cell">
                      <span *ngIf="sub.grade !== null" class="grade-value" [class.high]="sub.grade >= 16" [class.mid]="sub.grade >= 11 && sub.grade < 16" [class.low]="sub.grade < 11">
                        {{sub.grade}}/20
                      </span>
                      <span *ngIf="sub.grade === null" class="grade-pending">—</span>
                    </td>
                    <td class="obs-cell">{{sub.observations || '—'}}</td>
                  </tr>
                </tbody>
              </table>
            </div>
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
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .dialog-container {
      background: white;
      border-radius: 16px;
      width: 90%;
      max-width: 1000px;
      max-height: 85vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }
    .dialog-header {
      padding: 20px 24px;
      background: #0f172a;
      color: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .dialog-header h2 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
    }
    .close-btn {
      background: rgba(255,255,255,0.1);
      border: none;
      color: white;
      cursor: pointer;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      font-size: 1.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }
    .close-btn:hover {
      background: rgba(255,255,255,0.2);
    }
    .dialog-body {
      padding: 24px;
      overflow-y: auto;
      flex: 1;
      background: #f8fafc;
    }
    .info-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
      border: 1px solid #e2e8f0;
    }
    .info-row {
      display: flex;
      margin-bottom: 12px;
    }
    .info-row:last-child {
      margin-bottom: 0;
    }
    .info-label {
      width: 110px;
      font-weight: 600;
      color: #475569;
      flex-shrink: 0;
    }
    .info-value {
      flex: 1;
      color: #0f172a;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 500;
    }
    .status-badge.draft {
      background: #fef3c7;
      color: #d97706;
    }
    .status-badge.published {
      background: #d1fae5;
      color: #059669;
    }
    .status-badge.closed {
      background: #e2e8f0;
      color: #475569;
    }
    .stats-section {
      margin-bottom: 24px;
    }
    .stats-section h3 {
      font-size: 1rem;
      font-weight: 600;
      margin: 0 0 16px 0;
      color: #1e293b;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }
    .stat-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
      text-align: center;
    }
    .stat-card.success {
      border-top: 3px solid #10b981;
    }
    .stat-card.warning {
      border-top: 3px solid #f59e0b;
    }
    .stat-card.info {
      border-top: 3px solid #3b82f6;
    }
    .stat-number {
      font-size: 1.75rem;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 4px;
    }
    .stat-label {
      font-size: 0.75rem;
      color: #64748b;
    }
    .submissions-section h3 {
      font-size: 1rem;
      font-weight: 600;
      margin: 0 0 16px 0;
      color: #1e293b;
    }
    .table-wrapper {
      overflow-x: auto;
      background: white;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    }
    .submissions-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8rem;
    }
    .submissions-table th {
      text-align: left;
      padding: 12px 12px;
      background: #f8fafc;
      font-weight: 600;
      color: #475569;
      border-bottom: 1px solid #e2e8f0;
    }
    .submissions-table td {
      padding: 12px 12px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }
    .submissions-table tr:last-child td {
      border-bottom: none;
    }
    .student-name {
      font-weight: 500;
      color: #0f172a;
    }
    .student-code {
      color: #64748b;
      font-size: 0.7rem;
    }
    .text-center {
      text-align: center;
    }
    .delivery-badge {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 20px;
      font-size: 0.7rem;
      font-weight: 500;
    }
    .delivery-badge.yes {
      background: #d1fae5;
      color: #059669;
    }
    .delivery-badge.no {
      background: #fef2f2;
      color: #dc2626;
    }
    .date-cell {
      color: #64748b;
      font-size: 0.75rem;
    }
    .grade-cell {
      text-align: center;
    }
    .grade-value {
      font-weight: 600;
      font-size: 0.85rem;
    }
    .grade-value.high {
      color: #10b981;
    }
    .grade-value.mid {
      color: #f59e0b;
    }
    .grade-value.low {
      color: #ef4444;
    }
    .grade-pending {
      color: #94a3b8;
    }
    .obs-cell {
      color: #64748b;
      font-size: 0.75rem;
      max-width: 200px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .dialog-footer {
      padding: 16px 24px;
      background: white;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: flex-end;
    }
    .btn-cerrar {
      padding: 8px 20px;
      background: #f1f5f9;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 500;
      transition: background 0.2s;
    }
    .btn-cerrar:hover {
      background: #e2e8f0;
    }
  `]
})
export class TaskDetailTeacherDialogComponent implements OnInit {
  task: Task | null = null;
  materiaNombre: string = '';
  submissions: Submission[] = [];
  totalEstudiantes: number = 0;
  entregaronCount: number = 0;
  noEntregaronCount: number = 0;
  promedioNotas: string = '0.0';
  
  studentsMap: Map<number, { name: string; code: string }> = new Map();

  constructor(
    private taskService: TaskService,
    private dialogRef: MatDialogRef<TaskDetailTeacherDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  async ngOnInit() {
    await this.cargarEstudiantes();
    await this.cargarTask();
    await this.cargarSubmissions();
    this.calcularEstadisticas();
  }

  async cargarEstudiantes() {
    const students = await this.taskService.getStudents().toPromise() || [];
    const persons = await Promise.all(
      students.map((s: any) => this.taskService.getPersonCached(s.personId).toPromise())
    );
    students.forEach((s: any, index: number) => {
      const person = persons[index];
      const nombre = person ? `${person.firstName} ${person.lastName}` : s.studentCode || `Estudiante ${s.id}`;
      this.studentsMap.set(s.id, { name: nombre, code: s.studentCode });
    });
    this.totalEstudiantes = this.studentsMap.size;
  }

  async cargarTask() {
    const task = await this.taskService.getTaskById(this.data.taskId).toPromise();
    this.task = task || null;
    this.materiaNombre = this.data.materiaNombre || '';
  }

  async cargarSubmissions() {
    this.submissions = await this.taskService.getSubmissionsByTask(this.data.taskId).toPromise() || [];
  }

  calcularEstadisticas() {
    this.entregaronCount = this.submissions.filter(s => s.presented === true).length;
    this.noEntregaronCount = this.totalEstudiantes - this.entregaronCount;
    const notas = this.submissions.filter(s => s.grade !== null).map(s => s.grade as number);
    if (notas.length > 0) {
      const avg = notas.reduce((a, b) => a + b, 0) / notas.length;
      this.promedioNotas = avg.toFixed(1);
    }
  }

  getStudentName(studentId: number): string {
    return this.studentsMap.get(studentId)?.name || `Estudiante ${studentId}`;
  }

  getStudentCode(studentId: number): string {
    return this.studentsMap.get(studentId)?.code || '';
  }

  getStatusText(status?: string): string {
    const textos: any = { draft: 'Borrador', published: 'Publicada', closed: 'Cerrada' };
    return textos[status || ''] || status;
  }

  cerrar() {
    this.dialogRef.close();
  }
}
