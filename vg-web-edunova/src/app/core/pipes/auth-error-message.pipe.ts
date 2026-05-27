import { Pipe, PipeTransform } from '@angular/core';
import { extractAuthError } from '../handlers/auth-error.handler';

@Pipe({ name: 'authError', standalone: true })
export class AuthErrorMessagePipe implements PipeTransform {
  transform(err: unknown): string {
    return extractAuthError(err);
  }
}
