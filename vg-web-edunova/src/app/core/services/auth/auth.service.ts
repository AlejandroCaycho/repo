import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface CurrentUser {
  id?: number;
  uuid?: string;
  institucionId?: number;
  nombre: string;
  email: string;
  rol: string;
  telefono?: string;
  fotoUrl?: string;
  institucion?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.api.auth}/auth`;
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';

  readonly isAuthenticated = signal(this.hasToken());
  readonly currentUser = signal<CurrentUser | null>(this.storedUser());

  private hasToken(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  private storedUser(): CurrentUser | null {
    const raw = localStorage.getItem(this.USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  login(email: string, contrasena: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/login`, { email, contrasena }).pipe(
      tap(res => {
        const token = res.token || res.accessToken || res.access_token;
        if (token) {
          localStorage.setItem(this.TOKEN_KEY, token);
          this.isAuthenticated.set(true);
        }
        const usuario = res.usuario || res;
        const user: CurrentUser = {
          id: usuario.id,
          uuid: usuario.uuid,
          institucionId: usuario.institucionId ?? usuario.institutionId,
          nombre: usuario.nombre ?? usuario.name ?? email.split('@')[0],
          email: usuario.email ?? email,
          rol: usuario.rol ?? usuario.role ?? (usuario.roles && usuario.roles[0]) ?? '',
          telefono: usuario.telefono,
          fotoUrl: usuario.fotoUrl,
          institucion: usuario.institucion ?? usuario.institution,
        };
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        this.currentUser.set(user);
      })
    );
  }

  register(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, payload);
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/reset-password`, { token, newPassword });
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.isAuthenticated.set(false);
    this.currentUser.set(null);
  }
}
