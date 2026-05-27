import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { TaskService } from '../../core/services/task.service';

@Component({
  selector: 'app-submission-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 min-w-[450px]">
      <h2 class="text-xl font-bold mb-4">Entregar Tarea</h2>
      <div class="mb-4">
        <label class="block text-sm font-medium mb-1">Justificación</label>
        <textarea [(ngModel)]="justificationReason" rows="3" class="w-full p-2 border rounded-lg" placeholder="Ej: Entrega en clase, Cuaderno completo, etc."></textarea>
      </div>
      <div class="flex justify-end gap-3">
        <button class="px-4 py-2 bg-gray-100 rounded-lg" (click)="cancelar()">Cancelar</button>
        <button class="px-4 py-2 bg-green-600 text-white rounded-lg" (click)="entregar()">Entregar</button>
      </div>
    </div>
  `
})
export class SubmissionDialogComponent {
  justificationReason = '';

  constructor(
    private taskService: TaskService,
    private dialogRef: MatDialogRef<SubmissionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { taskId: number; studentId: number }
  ) {}

  entregar() {
    if (!this.justificationReason.trim()) {
      Swal.fire('Advertencia', 'Ingrese una justificación', 'warning');
      return;
    }
    this.taskService.submitSubmission({
      taskId: this.data.taskId,
      studentId: this.data.studentId,
      justificationReason: this.justificationReason
    }).subscribe({
      next: () => {
        Swal.fire('Éxito', 'Tarea entregada', 'success');
        this.dialogRef.close(true);
      },
      error: () => Swal.fire('Error', 'No se pudo entregar', 'error')
    });
  }

  cancelar() {
    this.dialogRef.close(false);
  }
}
