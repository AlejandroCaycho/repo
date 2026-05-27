import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

// Interfaces para lookup
export interface InstitucionLookup { id: number; nombre: string; }
export interface PersonaLookup     { id: number; nombre: string; apellido: string; }
export interface AulaLookup        { id: number; nombre: string; }
export interface MateriaLookup     { id: number; nombre: string; }
export interface ProfesorLookup    { id: number; nombre: string; apellido: string; }

@Injectable({ providedIn: 'root' })
export class LookupService {
  // Rutas relativas → pasan por el proxy de Angular (proxy.conf.json) → sin CORS
  // /api          → 8081 (auth)       sin pathRewrite
  // /student-api  → 8083 (student)    pathRewrite: /student-api → ""
  // /academic-api → 8082 (academic)   pathRewrite: /academic-api → ""

  constructor(private http: HttpClient) {}

  getInstitucionById(id: number): Observable<InstitucionLookup> {
    return this.http.get<any>(`/api/v1/instituciones/${id}`).pipe(
      map(r => ({ id: r.id, nombre: r.nombre ?? r.name ?? `ID ${id}` }))
    );
  }

  // Profesor → /api/teachers/{id} en 8083, devuelve { personName, ... }
  getPersona(id: number): Observable<PersonaLookup> {
    return this.http.get<any>(`/student-api/api/teachers/${id}`).pipe(
      map(r => ({
        id: r.id,
        nombre:   r.personName?.split(' ')[0] ?? r.firstName ?? `ID ${id}`,
        apellido: r.personName?.split(' ').slice(1).join(' ') ?? r.lastName ?? '',
      }))
    );
  }

  getProfesor(id: number): Observable<ProfesorLookup> {
    return this.getPersona(id);
  }

  // Aula → /api/v1/aulas/{id} en 8082
  getAula(id: number): Observable<AulaLookup> {
    return this.http.get<any>(`/academic-api/api/v1/aulas/${id}`).pipe(
      map(r => ({ id: r.id, nombre: r.nombre ?? r.name ?? `Aula ${id}` }))
    );
  }

  // Materia → /api/v1/materias/{id} en 8082
  getMateria(id: number): Observable<MateriaLookup> {
    return this.http.get<any>(`/academic-api/api/v1/materias/${id}`).pipe(
      map(r => ({ id: r.id, nombre: r.nombre ?? r.name ?? `Materia ${id}` }))
    );
  }
}