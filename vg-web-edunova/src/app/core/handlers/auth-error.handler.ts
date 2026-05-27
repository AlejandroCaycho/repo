import { HttpErrorResponse } from '@angular/common/http';
import { AuthError } from '../errors/auth-error';

export function extractAuthError(err: unknown): string {
  if (err instanceof AuthError) return err.message;
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) return 'No se pudo conectar con el servidor. Verifica tu conexión.';
    if (err.status === 401) return err.error?.message || 'Credenciales inválidas. Verifica tu correo y contraseña.';
    return err.error?.message || err.error?.error || err.message || 'Ocurrió un error inesperado.';
  }
  if (err instanceof Error) return err.message;
  return 'Ocurrió un error inesperado.';
}
