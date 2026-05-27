import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { TaskService } from '../services/task.service';

export interface AsistenciaResolvedData {
  grados: any[];
  clases: any[];
  materias: any[];
  students: any[];
}

export const asistenciaDataResolver: ResolveFn<AsistenciaResolvedData> = () => {
  const taskService = inject(TaskService);

  return forkJoin({
    grados: taskService.getGrados().pipe(catchError(() => of([]))),
    clases: taskService.getClases().pipe(catchError(() => of([]))),
    materias: taskService.getMaterias().pipe(catchError(() => of([]))),
    students: taskService.getStudents().pipe(catchError(() => of([])))
  });
};
