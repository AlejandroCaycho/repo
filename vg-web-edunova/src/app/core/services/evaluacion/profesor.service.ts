import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { ProfesorDto } from '../../interfaces/evaluacion.interface';

interface TeacherResponse {
  id: number;
  personId: number;
  userId: number;
  teacherCode: string;
  specialty: string;
  professionalTitle: string;
  hireDate: string;
  contractType: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PersonResponse {
  id: number;
  institutionId: number;
  documentType: string;
  documentNumber: string;
  firstName: string;
  lastName: string;
  secondLastName: string;
  birthDate: string;
  gender: string;
  address: string;
  ubigeo: string;
  phone: string;
  email: string;
  photoUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProfesorService {
  private readonly teacherUrl = `${environment.studentUrl}/api/teachers`;
  private readonly personUrl = `${environment.studentUrl}/api/people`;

  constructor(private http: HttpClient) {}

  /**
   * Listar todos los profesores con sus datos de persona
   */
  listarTodos(): Observable<ProfesorDto[]> {
    return this.http.get<TeacherResponse[]>(this.teacherUrl).pipe(
      switchMap(teachers => {
        // Filtrar solo profesores activos
        const activeTeachers = teachers.filter(t => t.isActive);
        
        if (activeTeachers.length === 0) {
          return of([]);
        }

        // Crear array de observables para obtener datos de cada persona
        const personRequests = activeTeachers.map(teacher =>
          this.http.get<PersonResponse>(`${this.personUrl}/${teacher.personId}`).pipe(
            map(person => {
              const nombreCompleto = person.secondLastName 
                ? `${person.firstName} ${person.lastName} ${person.secondLastName}`
                : `${person.firstName} ${person.lastName}`;
              
              return {
                id: teacher.id,
                nombre: person.firstName,
                apellido: `${person.lastName}${person.secondLastName ? ' ' + person.secondLastName : ''}`,
                nombreCompleto: nombreCompleto,
                personId: teacher.personId
              };
            }),
            // Si falla, usar el código del profesor como fallback
            catchError(() => of({
              id: teacher.id,
              nombre: teacher.teacherCode,
              apellido: '',
              nombreCompleto: `Profesor ${teacher.teacherCode}`,
              personId: teacher.personId
            }))
          )
        );

        // Ejecutar todas las peticiones en paralelo
        return forkJoin(personRequests);
      }),
      catchError(error => {
        console.error('Error al cargar profesores:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtener profesor por ID con datos de persona
   */
  obtenerPorId(id: number): Observable<ProfesorDto> {
    return this.http.get<TeacherResponse>(`${this.teacherUrl}/${id}`).pipe(
      switchMap(teacher => 
        this.http.get<PersonResponse>(`${this.personUrl}/${teacher.personId}`).pipe(
          map(person => {
            const nombreCompleto = person.secondLastName 
              ? `${person.firstName} ${person.lastName} ${person.secondLastName}`
              : `${person.firstName} ${person.lastName}`;
            
            return {
              id: teacher.id,
              nombre: person.firstName,
              apellido: `${person.lastName}${person.secondLastName ? ' ' + person.secondLastName : ''}`,
              nombreCompleto: nombreCompleto,
              personId: teacher.personId
            };
          })
        )
      ),
      catchError(error => {
        console.error('Error al obtener profesor:', error);
        return of({
          id: id,
          nombre: 'Profesor',
          apellido: `#${id}`,
          nombreCompleto: `Profesor #${id}`,
          personId: 0
        });
      })
    );
  }
}
