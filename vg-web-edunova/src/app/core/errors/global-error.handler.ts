import { ErrorHandler, inject, Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: unknown): void {
    if (error instanceof HttpErrorResponse) {
      console.error(`[HTTP ${error.status}] ${error.message}`, error.url);
    } else if (error instanceof Error) {
      console.error(`[ERROR] ${error.message}`, error.stack);
    } else {
      console.error('[UNKNOWN ERROR]', error);
    }
  }
}
