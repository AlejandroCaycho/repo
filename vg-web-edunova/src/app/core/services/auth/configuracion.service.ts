import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ConfiguracionInstitucion, ConfiguracionInstitucionRequest } from '../../interfaces/auth.interface';

@Injectable({ providedIn: 'root' })
export class ConfiguracionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.api.auth}/configuraciones`;

  listar(): Observable<ConfiguracionInstitucion[]> {
    return this.http.get<ConfiguracionInstitucion[]>(this.baseUrl);
  }

  crear(data: ConfiguracionInstitucionRequest): Observable<ConfiguracionInstitucion> {
    return this.http.post<ConfiguracionInstitucion>(this.baseUrl, data);
  }

  actualizar(institucionId: number, data: ConfiguracionInstitucionRequest): Observable<ConfiguracionInstitucion> {
    return this.http.put<ConfiguracionInstitucion>(`${this.baseUrl}/${institucionId}`, data);
  }

  eliminar(institucionId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${institucionId}`);
  }
}
