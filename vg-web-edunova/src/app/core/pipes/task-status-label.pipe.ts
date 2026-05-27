import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'taskStatusLabel', standalone: true })
export class TaskStatusLabelPipe implements PipeTransform {
  transform(status: string | null | undefined, grade?: number | null): string {
    if (grade !== null && grade !== undefined) return 'Calificada';

    const labels: Record<string, string> = {
      draft: 'Borrador',
      published: 'Publicada',
      closed: 'Cerrada',
      submitted: 'Entregada',
      graded: 'Calificada',
      pending: 'Pendiente'
    };

    return labels[String(status || '').toLowerCase()] || status || 'Pendiente';
  }
}
