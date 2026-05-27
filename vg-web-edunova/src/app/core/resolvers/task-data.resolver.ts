import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { TaskService } from '../services/task.service';

export interface TaskResolvedData {
  materias: any[];
  clases: any[];
  teachers: any[];
  students: any[];
}

export const taskDataResolver: ResolveFn<TaskResolvedData> = () => {
  const taskService = inject(TaskService);

  return forkJoin({
    materias: taskService.getMaterias().pipe(catchError(() => of([]))),
    clases: taskService.getClases().pipe(catchError(() => of([]))),
    teachers: taskService.getTeachers().pipe(catchError(() => of([]))),
    students: taskService.getStudents().pipe(catchError(() => of([])))
  });
};
