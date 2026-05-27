import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, of, shareReplay, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Task {
  id: number;
  title: string;
  description: string;
  instructions: string;
  classId: number;
  pointsValue: number;
  dueDate: string;
  status: string;
  isDeleted: boolean;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface Submission {
  id: number;
  taskId: number;
  studentId: number;
  submissionDate: string;
  status: string;
  grade: number | null;
  feedback: string | null;
  justificationReason: string | null;
  presented: boolean;
  isLate: boolean;
  observations?: string;
  gradedBy?: number;
  gradedAt?: string;
}

export interface StudentDashboard {
  studentId: number;
  studentName: string;
  materias: MateriaDashboard[];
}

export interface MateriaDashboard {
  materiaId: number;
  materiaNombre: string;
  gradoId: number;
  gradoNombre: string;
  tareas: TareaDashboard[];
}

export interface TareaDashboard {
  taskId: number;
  titulo: string;
  descripcion: string;
  fechaEntrega: string;
  entregada: boolean;
  nota: number | null;
  estado: string;
  observaciones?: string;
}

export interface TeacherSubjects {
  teacherId: number;
  teacherName: string;
  subjects: TeacherSubject[];
}

export interface TeacherSubject {
  subjectId: number;
  subjectName: string;
  gradeId: number;
  gradeName: string;
  classId: number;
}

export interface GradeRequest {
  grade: number;
  feedback?: string;
  gradedBy: number;
  presented: boolean;
  isLate?: boolean;
  justification?: string;
  observations?: string;
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  private http = inject(HttpClient);
  private readonly taskApi = environment.api.task;
  private readonly academicApi = environment.api.academic;
  private readonly studentApi = environment.api.student;
  private readonly personCache = new Map<number, Observable<any>>();
  private peopleCache$?: Observable<any[]>;

  // ========== TAREAS ==========
  getTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.taskApi}/task`);
  }

  getTasksByClass(classId: number): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.taskApi}/task/class/${classId}`);
  }

  getTaskById(id: number): Observable<Task> {
    return this.http.get<Task>(`${this.taskApi}/task/${id}`);
  }

  createTask(task: any): Observable<Task> {
    return this.http.post<Task>(`${this.taskApi}/task`, task);
  }

  updateTask(task: any): Observable<Task> {
    return this.http.put<Task>(`${this.taskApi}/task`, task);
  }

  deleteTask(id: number): Observable<void> {
    return this.http.delete<void>(`${this.taskApi}/task/${id}`);
  }

  activateTask(id: number): Observable<Task> {
    return this.http.patch<Task>(`${this.taskApi}/task/${id}/activate`, {});
  }

  closeTask(id: number): Observable<Task> {
    return this.http.patch<Task>(`${this.taskApi}/task/${id}/close`, {});
  }

  restoreTask(id: number): Observable<Task> {
    return this.http.patch<Task>(`${this.taskApi}/task/${id}/restore`, {});
  }

  // ========== ENTREGAS Y CALIFICACIONES ==========
  getSubmissionsByTask(taskId: number): Observable<Submission[]> {
    return this.http.get<Submission[]>(`${this.taskApi}/submissions/task/${taskId}`);
  }

  getSubmissionsByStudent(studentId: number): Observable<Submission[]> {
    return this.http.get<Submission[]>(`${this.taskApi}/submissions/student/${studentId}`);
  }

  submitSubmission(request: { taskId: number; studentId: number; justificationReason?: string }): Observable<Submission> {
    return this.http.post<Submission>(`${this.taskApi}/submissions/submit`, request);
  }

  gradeSubmission(id: number, request: GradeRequest): Observable<Submission> {
    return this.http.put<Submission>(`${this.taskApi}/submissions/${id}/grade`, request);
  }

  // ========== DASHBOARDS ==========
  getStudentDashboard(studentId: number): Observable<StudentDashboard> {
    return forkJoin({
      student: this.http.get<any>(`${this.studentApi}/students/${studentId}`),
      clases: this.getClases(),
      materias: this.getMaterias(),
      grados: this.getGrados(),
      submissions: this.getSubmissionsByStudent(studentId)
    }).pipe(
      switchMap(({ student, clases, materias, grados, submissions }) => {
        const clasesDelGrado = clases.filter((clase: any) => Number(clase.gradoId) === Number(student.gradeId));
        if (clasesDelGrado.length === 0) {
          return of({ student, materias, grados, submissions, tasksByClass: [] as any[] });
        }

        return forkJoin(
          clasesDelGrado.map((clase: any) =>
            this.getTasksByClass(clase.id).pipe(map(tasks => ({ clase, tasks })))
          )
        ).pipe(map(tasksByClass => ({ student, materias, grados, submissions, tasksByClass })));
      }),
      map(({ student, materias, grados, submissions, tasksByClass }) => {
        const materiasMap = new Map<number, MateriaDashboard>();

        for (const item of tasksByClass) {
          const materia = materias.find((m: any) => Number(m.id) === Number(item.clase.materiaId));
          const grado = grados.find((g: any) => Number(g.id) === Number(item.clase.gradoId));
          const key = Number(item.clase.materiaId);
          const visibleTasks = item.tasks.filter((task: Task) => !task.isDeleted);
          if (visibleTasks.length === 0) continue;

          if (!materiasMap.has(key)) {
            materiasMap.set(key, {
              materiaId: key,
              materiaNombre: materia?.nombre || `Materia ${key}`,
              gradoId: Number(item.clase.gradoId),
              gradoNombre: grado?.nombre || `Grado ${item.clase.gradoId}`,
              tareas: []
            });
          }

          const dashboardMateria = materiasMap.get(key)!;
          dashboardMateria.tareas.push(
            ...visibleTasks.map((task: Task) => {
              const submission = submissions.find(s => Number(s.taskId) === Number(task.id));
              const isGraded = submission?.grade !== null && submission?.grade !== undefined;
              return {
                taskId: task.id,
                titulo: task.title,
                descripcion: task.description,
                fechaEntrega: task.dueDate,
                entregada: !!submission && (!!submission.presented || isGraded),
                nota: submission?.grade ?? null,
                estado: isGraded ? 'graded' : (submission?.status || task.status),
                observaciones: submission?.observations || submission?.feedback || undefined
              };
            })
          );
        }

        return {
          studentId,
          studentName: student.studentCode || `Estudiante ${studentId}`,
          materias: Array.from(materiasMap.values()).filter(materia => materia.tareas.length > 0)
        };
      })
    );
  }

  getTeacherSubjects(teacherId: number): Observable<TeacherSubjects> {
    return forkJoin({
      teacher: this.http.get<any>(`${this.studentApi}/teachers/${teacherId}`),
      clases: this.http.get<any[]>(`${this.academicApi}/clases/profesor/${teacherId}`),
      materias: this.getMaterias(),
      grados: this.getGrados()
    }).pipe(
      map(({ teacher, clases, materias, grados }) => ({
        teacherId,
        teacherName: teacher.teacherCode || `Profesor ${teacherId}`,
        subjects: clases.map((clase: any) => {
          const materia = materias.find((m: any) => Number(m.id) === Number(clase.materiaId));
          const grado = grados.find((g: any) => Number(g.id) === Number(clase.gradoId));
          return {
            subjectId: Number(clase.materiaId),
            subjectName: materia?.nombre || `Materia ${clase.materiaId}`,
            gradeId: Number(clase.gradoId),
            gradeName: grado?.nombre || `Grado ${clase.gradoId}`,
            classId: Number(clase.id)
          };
        })
      }))
    );
  }

  getTeacherStats(teacherId: number): Observable<any> {
    return this.http.get<any>(`${this.taskApi}/statistics/teacher/${teacherId}`);
  }

  // ========== DATOS MAESTROS ==========
  getMaterias(): Observable<any[]> {
    return this.http.get<any[]>(`${this.academicApi}/materias`);
  }

  getClases(): Observable<any[]> {
    return this.http.get<any[]>(`${this.academicApi}/clases`);
  }

  getGrados(): Observable<any[]> {
    return this.http.get<any[]>(`${this.academicApi}/grados`);
  }

  getNiveles(): Observable<any[]> {
    return this.http.get<any[]>(`${this.academicApi}/niveles`);
  }

  getAulas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.academicApi}/aulas`);
  }

  getTeachers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.studentApi}/teachers`);
  }

  getStudents(): Observable<any[]> {
    return this.http.get<any[]>(`${this.studentApi}/students`);
  }

  getPeopleCached(): Observable<any[]> {
    if (!this.peopleCache$) {
      this.peopleCache$ = this.http.get<any[]>(`${this.studentApi}/people`).pipe(shareReplay(1));
    }
    return this.peopleCache$;
  }

  getPerson(id: number): Observable<any> {
    return this.http.get<any>(`${this.studentApi}/people/${id}`);
  }

  getPersonCached(id: number): Observable<any> {
    if (!this.personCache.has(id)) {
      this.personCache.set(id, this.getPerson(id).pipe(shareReplay(1)));
    }
    return this.personCache.get(id)!;
  }
}
