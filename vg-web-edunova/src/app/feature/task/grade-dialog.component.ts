import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { TaskService } from '../../core/services/task.service';
import { LucideAngularModule, Eye, Save, X, Users, CheckSquare, Star, Pencil } from 'lucide-angular';

@Component({
  selector: 'app-grade-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="grade-overlay" (click)="cerrar()">
      <div class="grade-container" (click)="$event.stopPropagation()">
        <div class="grade-header">
          <h2>Calificar: {{taskTitle}}</h2>
          <button class="close-btn" (click)="cerrar()">
            <lucide-icon [img]="icons.X" [size]="20"></lucide-icon>
          </button>
        </div>
        
        <div class="grade-body">
          <div class="stats">
            <div class="stat">
              <lucide-icon [img]="icons.Users" [size]="20" class="stat-icon"></lucide-icon>
              <div>
                <div class="stat-value">{{submissions.length}}</div>
                <div class="stat-label">Total estudiantes</div>
              </div>
            </div>
            <div class="stat">
              <lucide-icon [img]="icons.CheckSquare" [size]="20" class="stat-icon"></lucide-icon>
              <div>
                <div class="stat-value">{{getEntregaronCount()}}</div>
                <div class="stat-label">Entregaron</div>
              </div>
            </div>
            <div class="stat">
              <lucide-icon [img]="icons.Star" [size]="20" class="stat-icon"></lucide-icon>
              <div>
                <div class="stat-value">{{getCalificadosCount()}}</div>
                <div class="stat-label">Calificados</div>
              </div>
            </div>
          </div>
          
          <div class="table-wrapper">
            <table class="grade-table">
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Codigo</th>
                  <th>Entrego</th>
                  <th>Nota (0-20)</th>
                  <th>Observaciones</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let sub of submissions">
                  <td>{{sub.studentName}}</td>
                  <td>{{sub.studentCode}}</td>
                  <td class="text-center">
                    <input type="checkbox" [(ngModel)]="sub.presented" (change)="onPresentedChange(sub)" class="checkbox">
                  </td>
                  <td>
                    <input type="number" [(ngModel)]="sub.grade" min="0" max="20" step="0.5" class="grade-input" [disabled]="!sub.presented">
                  </td>
                  <td>
                    <input type="text" [(ngModel)]="sub.observations" class="obs-input" placeholder="Observaciones...">
                  </td>
                  <td>
                    <button class="btn-save" (click)="guardarNota(sub)" [disabled]="saving[sub.id]">
                      <lucide-icon [img]="sub.id !== 0 && sub.grade !== null && sub.grade !== '' ? icons.Pencil : icons.Save" [size]="14"></lucide-icon>
                      {{saving[sub.id] ? 'Guardando...' : (sub.id !== 0 && sub.grade !== null && sub.grade !== '' ? 'Cambiar' : 'Guardar')}}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <div class="grade-footer">
          <button class="btn-cancel" (click)="cerrar()">Cerrar</button>
          <button class="btn-save-all" (click)="guardarTodas()" [disabled]="savingAll">
            <lucide-icon [img]="icons.Save" [size]="14"></lucide-icon>
            {{savingAll ? 'Guardando...' : 'Guardar todas'}}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .grade-overlay {
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
    .grade-container {
      background: white;
      border-radius: 12px;
      width: 90%;
      max-width: 1100px;
      max-height: 85vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
    }
    .grade-header {
      padding: 16px 24px;
      background: #1e293b;
      color: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .grade-header h2 { margin: 0; font-size: 1.25rem; font-weight: 600; }
    .close-btn {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      padding: 4px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .close-btn:hover { background: rgba(255,255,255,0.1); }
    .grade-body { padding: 20px; overflow-y: auto; flex: 1; background: #f8fafc; }
    .stats {
      display: flex;
      gap: 24px;
      margin-bottom: 20px;
      padding: 16px 20px;
      background: white;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
    }
    .stat { display: flex; gap: 12px; align-items: center; }
    .stat-icon { color: #3b82f6; }
    .stat-value { font-size: 1.5rem; font-weight: 700; color: #0f172a; line-height: 1.2; }
    .stat-label { font-size: 0.75rem; color: #64748b; }
    .table-wrapper { overflow-x: auto; border-radius: 10px; border: 1px solid #e2e8f0; background: white; }
    .grade-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    .grade-table th, .grade-table td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    .grade-table th { background: #f1f5f9; font-weight: 600; color: #475569; }
    .grade-table tr:hover { background: #f8fafc; }
    .text-center { text-align: center; }
    .checkbox { width: 18px; height: 18px; cursor: pointer; accent-color: #10b981; }
    .grade-input { width: 80px; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.875rem; }
    .grade-input:disabled { background: #f1f5f9; cursor: not-allowed; }
    .obs-input { width: 180px; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.875rem; }
    .btn-save {
      padding: 6px 12px;
      background: #10b981;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.75rem;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn-save:hover:not(:disabled) { background: #059669; }
    .btn-save:disabled { background: #94a3b8; cursor: not-allowed; }
    .grade-footer {
      padding: 16px 24px;
      background: white;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }
    .btn-cancel {
      padding: 8px 20px;
      background: #f1f5f9;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
    }
    .btn-cancel:hover { background: #e2e8f0; }
    .btn-save-all {
      padding: 8px 20px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .btn-save-all:hover:not(:disabled) { background: #2563eb; }
    .btn-save-all:disabled { opacity: 0.6; cursor: not-allowed; }
  `]
})
export class GradeDialogComponent implements OnInit {
  taskId: number;
  taskTitle: string = '';
  submissions: any[] = [];
  saving: { [key: number]: boolean } = {};
  savingAll: boolean = false;
  icons = { X: X, Users: Users, CheckSquare: CheckSquare, Star: Star, Save: Save, Eye: Eye, Pencil: Pencil };
  gradoDeLaTarea: number | null = null;

  constructor(
    private taskService: TaskService,
    private dialogRef: MatDialogRef<GradeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { taskId: number; taskTitle: string }
  ) {
    this.taskId = data.taskId;
    this.taskTitle = data.taskTitle;
  }

  async ngOnInit() {
    await this.cargarGradoDeLaTarea();
    await this.cargarDatos();
  }

  async cargarGradoDeLaTarea() {
    try {
      const task = await this.taskService.getTaskById(this.taskId).toPromise();
      if (task && task.classId) {
        const clase = await this.taskService.getClases().toPromise();
        const claseEncontrada = clase?.find(c => c.id === task.classId);
        if (claseEncontrada) {
          this.gradoDeLaTarea = claseEncontrada.gradoId;
          console.log('Grado de la tarea:', this.gradoDeLaTarea);
        }
      }
    } catch (e) {
      console.error('Error al obtener grado de la tarea:', e);
    }
  }

  getEntregaronCount(): number {
    return this.submissions.filter(s => s.presented === true).length;
  }

  getCalificadosCount(): number {
    return this.submissions.filter(s => s.grade !== null && s.grade !== undefined && s.grade !== '').length;
  }

  async cargarDatos() {
    const students = await this.taskService.getStudents().toPromise() || [];
    const studentsMap = new Map();
    const persons = await Promise.all(
      students.map((s: any) => this.taskService.getPersonCached(s.personId).toPromise())
    );
    
    students.forEach((s: any, index: number) => {
      let nombre = `Estudiante ${s.id}`;
      let codigo = s.studentCode || '';
      const person = persons[index];
      if (person) {
        nombre = `${person.firstName} ${person.lastName}`;
      }
      studentsMap.set(s.id, { name: nombre, code: codigo, gradeId: s.gradeId });
    });
    
    const existingSubs = await this.taskService.getSubmissionsByTask(this.taskId).toPromise() || [];
    
    this.submissions = [];
    for (const [studentId, info] of studentsMap) {
      // Filtrar SOLO estudiantes que pertenecen al grado de la tarea
      if (this.gradoDeLaTarea !== null && info.gradeId !== this.gradoDeLaTarea) {
        continue; // Saltar estudiantes que no son del grado correcto
      }
      
      const existing = existingSubs.find(s => s.studentId === studentId);
      if (existing) {
        this.submissions.push({
          ...existing,
          studentName: info.name,
          studentCode: info.code,
          observations: (existing as any).observations || '',
          originalGrade: existing.grade
        });
      } else {
        this.submissions.push({
          id: 0,
          taskId: this.taskId,
          studentId: studentId,
          studentName: info.name,
          studentCode: info.code,
          submissionDate: new Date().toISOString(),
          status: 'pending',
          grade: null,
          justificationReason: null,
          presented: false,
          isLate: false,
          observations: '',
          feedback: '',
          originalGrade: null
        });
      }
    }
  }

  onPresentedChange(sub: any) {
    if (!sub.presented) {
      sub.grade = null;
    }
  }

  async crearSubmission(studentId: number): Promise<any | null> {
    try {
      const newSub = await this.taskService.submitSubmission({
        taskId: this.taskId,
        studentId: studentId,
        justificationReason: 'Entrega registrada por profesor'
      }).toPromise();
      return newSub;
    } catch (error) {
      console.error('Error creando submission:', error);
      return null;
    }
  }

  async guardarNota(sub: any) {
    if (this.saving[sub.id]) return;
    
    const notaIngresada = sub.grade;
    const notaOriginal = sub.originalGrade;
    
    if (sub.presented && (notaIngresada === null || notaIngresada === undefined || notaIngresada === '')) {
      Swal.fire('Error', 'Ingrese una nota antes de guardar', 'warning');
      return;
    }
    
    const notaNumero = Number(notaIngresada);
    if (sub.presented && (isNaN(notaNumero) || notaNumero < 0 || notaNumero > 20)) {
      Swal.fire('Error', 'La nota debe estar entre 0 y 20', 'warning');
      return;
    }
    
    const notaOriginalNumero = notaOriginal !== null && notaOriginal !== undefined && notaOriginal !== '' ? Number(notaOriginal) : null;
    
    if (notaOriginalNumero !== null && notaOriginalNumero === notaNumero) {
      Swal.fire('Aviso', 'La nota ingresada es la misma que ya tiene asignada', 'info');
      return;
    }
    
    if (notaOriginalNumero !== null && notaOriginalNumero !== notaNumero) {
      const result = await Swal.fire({
        title: '¿Cambiar calificación?',
        html: `
          <div style="text-align: left">
            <p><strong>Estudiante:</strong> ${sub.studentName}</p>
            <p><strong>Nota actual:</strong> <span style="color:#ef4444; font-weight:bold">${notaOriginalNumero}</span></p>
            <p><strong>Nueva nota:</strong> <span style="color:#10b981; font-weight:bold">${notaNumero}</span></p>
            <div style="margin-top: 16px">
              <label style="display: block; margin-bottom: 8px; font-weight: 500;">Motivo del cambio:</label>
              <textarea id="motivoCambio" rows="3" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px;" placeholder="Ej: Revisión de trabajo, error en calificación anterior..."></textarea>
            </div>
          </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, cambiar nota',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#ef4444',
        preConfirm: () => {
          const motivo = (document.getElementById('motivoCambio') as HTMLTextAreaElement)?.value;
          if (!motivo || motivo.trim() === '') {
            Swal.showValidationMessage('Debe ingresar un motivo para el cambio');
          }
          return { motivo: motivo };
        }
      });
      
      if (!result.isConfirmed) {
        sub.grade = notaOriginalNumero;
        return;
      }
      
      sub.observations = result.value?.motivo || '';
    }
    
    this.saving[sub.id] = true;
    
    let submissionToGrade = sub;
    
    if (sub.id === 0) {
      const newSub = await this.crearSubmission(sub.studentId);
      if (newSub) {
        submissionToGrade = newSub;
        submissionToGrade.presented = sub.presented;
        submissionToGrade.grade = notaNumero;
        submissionToGrade.observations = sub.observations;
        const index = this.submissions.findIndex(s => s.studentId === sub.studentId);
        if (index !== -1) {
          this.submissions[index] = { ...submissionToGrade, studentName: sub.studentName, studentCode: sub.studentCode, originalGrade: notaNumero };
        }
      } else {
        this.saving[sub.id] = false;
        Swal.fire('Error', 'No se pudo crear la entrega', 'error');
        return;
      }
    }
    
    const request = {
      grade: notaNumero,
      presented: submissionToGrade.presented,
      observations: submissionToGrade.observations,
      gradedBy: 1,
      feedback: ''
    };
    
    this.taskService.gradeSubmission(submissionToGrade.id, request).subscribe({
      next: () => {
        this.saving[submissionToGrade.id] = false;
        sub.originalGrade = notaNumero;
        Swal.fire('Éxito', 'Nota guardada correctamente', 'success');
      },
      error: (err: any) => {
        console.error(err);
        this.saving[submissionToGrade.id] = false;
        Swal.fire('Error', 'No se pudo guardar la nota', 'error');
      }
    });
  }

  guardarTodas() {
    Swal.fire({
      title: 'Guardar todas las notas',
      text: '¿Está seguro de guardar todas las notas?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, guardar',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        this.savingAll = true;
        const promises = this.submissions.map(sub => {
          if (sub.presented && sub.grade !== null && sub.grade !== undefined && sub.grade !== '') {
            if (sub.id === 0) {
              return this.crearSubmission(sub.studentId).then(newSub => {
                if (newSub) {
                  const request = {
                    grade: Number(sub.grade) || 0,
                    presented: sub.presented,
                    observations: sub.observations,
                    gradedBy: 1,
                    feedback: ''
                  };
                  return this.taskService.gradeSubmission(newSub.id, request).toPromise();
                }
                return Promise.reject('No se pudo crear la entrega');
              });
            } else {
              const request = {
                grade: Number(sub.grade),
                presented: sub.presented,
                observations: sub.observations,
                gradedBy: 1,
                feedback: ''
              };
              return this.taskService.gradeSubmission(sub.id, request).toPromise();
            }
          }
          return Promise.resolve();
        });
        
        Promise.all(promises).then(() => {
          this.savingAll = false;
          Swal.fire('Éxito', 'Todas las notas fueron guardadas', 'success');
          this.dialogRef.close(true);
        }).catch(() => {
          this.savingAll = false;
          Swal.fire('Error', 'Hubo errores al guardar algunas notas', 'error');
        });
      }
    });
  }

  cerrar() {
    this.dialogRef.close(false);
  }
}
