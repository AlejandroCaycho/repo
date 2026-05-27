import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'attendanceStatusLabel', standalone: true })
export class AttendanceStatusLabelPipe implements PipeTransform {
  transform(status: string | null | undefined): string {
    const labels: Record<string, string> = {
      A: 'Presente',
      F: 'Falta',
      T: 'Tardanza',
      J: 'Justificado'
    };

    return labels[status || ''] || 'Sin marcar';
  }
}
