import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SelectOption {
  id: number;
  name: string;
  description?: string;
}

@Injectable({ providedIn: 'root' })
export class CommonService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8083/api/common';

  listarGrados(): Observable<SelectOption[]> {
    return this.http.get<SelectOption[]>(`${this.baseUrl}/grades`);
  }

  listarAnosAcademicos(): Observable<SelectOption[]> {
    return this.http.get<SelectOption[]>(`${this.baseUrl}/academic-years`);
  }
}