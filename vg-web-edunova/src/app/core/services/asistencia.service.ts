import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Attendance {
  id: number;
  classId: number;
  studentId: number;
  date: string;
  status: string;
  observation: string;
  studentName: string;
  studentCode: string;
  createdBy?: number;
}

export interface BulkAttendanceRequest {
  classId: number;
  date: string;
  attendances: { studentId: number; status: string; observation: string }[];
}

@Injectable({ providedIn: 'root' })
export class AsistenciaService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.api.task}/attendance`;

  getByClass(classId: number): Observable<Attendance[]> {
    return this.http.get<Attendance[]>(`${this.baseUrl}/class/${classId}`);
  }

  getByClassAndDate(classId: number, date: string): Observable<Attendance[]> {
    return this.http.get<Attendance[]>(`${this.baseUrl}/class/${classId}/date/${date}`);
  }

  getByStudent(studentId: number): Observable<Attendance[]> {
    return this.http.get<Attendance[]>(`${this.baseUrl}/student/${studentId}`);
  }

  save(attendance: any): Observable<Attendance> {
    return this.http.post<Attendance>(this.baseUrl, attendance);
  }

  saveBulk(request: BulkAttendanceRequest): Observable<Attendance[]> {
    return this.http.post<Attendance[]>(`${this.baseUrl}/bulk`, request);
  }

  update(id: number, attendance: any): Observable<Attendance> {
    return this.http.put<Attendance>(`${this.baseUrl}/${id}`, attendance);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  exportToExcel(classId: number, date: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/export/${classId}/${date}`, {
      responseType: 'blob'
    });
  }

  downloadTemplate(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/template`, {
      responseType: 'blob'
    });
  }
}
