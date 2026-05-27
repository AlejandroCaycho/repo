import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface EstudianteLookup    { id: number; nombre: string; apellido: string; }
export interface TallerLookup        { id: number; nombre: string; }
export interface ProgramaRecupLookup { id: number; nombre: string; }
export interface ProfesorLookup      { id: number; nombre: string; apellido: string; }
export interface AulaLookup          { id: number; nombre: string; }
export interface MateriaLookup       { id: number; nombre: string; }

@Injectable({ providedIn: 'root' })
export class LookupService {
  // Rutas relativas → pasan por el proxy de Angular (proxy.conf.json) → sin CORS
  // /student-api  → 8083  pathRewrite: /student-api → ""  → /api/students/{id}
  // /activity-api → 8087  pathRewrite: /activity-api → /api/v1

  constructor(private http: HttpClient) {}

  // Estudiante → /api/students/{id} en 8083, devuelve { personName, ... }
  getEstudiante(id: number): Observable<EstudianteLookup> {
    return this.http.get<any>(`/student-api/api/students/${id}`).pipe(
      map(r => ({
        id: r.id,
        nombre:   r.personName?.split(' ')[0] ?? r.firstName ?? `ID ${id}`,
        apellido: r.personName?.split(' ').slice(1).join(' ') ?? r.lastName ?? '',
      }))
    );
  }

  getTaller(id: number): Observable<TallerLookup> {
    return this.http.get<TallerLookup>(`${environment.activityUrl}/talleres/${id}`);
  }

  getProgramaRecuperacion(id: number): Observable<ProgramaRecupLookup> {
    return this.http.get<ProgramaRecupLookup>(`${environment.activityUrl}/programas-recuperacion/${id}`);
  }

  getProfesor(id: number): Observable<ProfesorLookup> {
    return this.http.get<any>(`/student-api/api/teachers/${id}`).pipe(
      map(r => ({
        id: r.id,
        nombre:   r.personName?.split(' ')[0] ?? r.firstName ?? `ID ${id}`,
        apellido: r.personName?.split(' ').slice(1).join(' ') ?? r.lastName ?? '',
      }))
    );
  }

  getAula(id: number): Observable<AulaLookup> {
    return this.http.get<any>(`/academic-api/api/v1/aulas/${id}`).pipe(
      map(r => ({ id: r.id, nombre: r.nombre ?? r.name ?? `Aula ${id}` }))
    );
  }

  getMateria(id: number): Observable<MateriaLookup> {
    return this.http.get<any>(`/academic-api/api/v1/materias/${id}`).pipe(
      map(r => ({ id: r.id, nombre: r.nombre ?? r.name ?? `Materia ${id}` }))
    );
  }
}
