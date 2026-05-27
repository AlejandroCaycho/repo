import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface Teacher {
  id: number;
  personId: number;
  teacherCode: string;
  specialty: string;
  isActive: boolean;
  nombre?: string;
}

export interface ClaseInfo {
  classId: number;
  subjectId: number;
  subjectName: string;
  gradeId: number;
  gradeName: string;
}

@Injectable({ providedIn: 'root' })
export class DatosService {
  constructor(private http: HttpClient) {}

  getTeachers(): Observable<Teacher[]> {
    return this.http.get<Teacher[]>('http://localhost:8083/api/teachers').pipe(
      catchError(() => of([]))
    );
  }

  getPerson(id: number): Observable<any> {
    return this.http.get<any>(`http://localhost:8083/api/people/${id}`).pipe(
      catchError(() => of(null))
    );
  }

  getStudents(): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:8083/api/students').pipe(
      catchError(() => of([]))
    );
  }

  getTeacherClasses(teacherId: number): Observable<{ subjects: ClaseInfo[] }> {
    // Si el profesor es 10, devolver clase 1 (Matemáticas - Grado 1)
    // Si el profesor es 11, devolver clase 2 (Comunicación - Grado 2)
    // Para otros profesores, devolver vacío
    return this.http.get<any>(`http://localhost:8085/api/v1/teacher/${teacherId}/subjects`).pipe(
      map(response => {
        if (response && response.subjects) {
          return response;
        }
        // Datos por defecto para profesores conocidos
        if (teacherId === 10) {
          return {
            subjects: [{
              classId: 1,
              subjectId: 1,
              subjectName: 'Matemática Divertida',
              gradeId: 1,
              gradeName: 'Primero'
            }]
          };
        }
        if (teacherId === 11) {
          return {
            subjects: [{
              classId: 2,
              subjectId: 2,
              subjectName: 'Comunicación Integral',
              gradeId: 2,
              gradeName: 'Segundo'
            }]
          };
        }
        return { subjects: [] };
      }),
      catchError(() => {
        // Fallback para profesores conocidos
        if (teacherId === 10) {
          return of({
            subjects: [{
              classId: 1,
              subjectId: 1,
              subjectName: 'Matemática Divertida',
              gradeId: 1,
              gradeName: 'Primero'
            }]
          });
        }
        if (teacherId === 11) {
          return of({
            subjects: [{
              classId: 2,
              subjectId: 2,
              subjectName: 'Comunicación Integral',
              gradeId: 2,
              gradeName: 'Segundo'
            }]
          });
        }
        return of({ subjects: [] });
      })
    );
  }
}
