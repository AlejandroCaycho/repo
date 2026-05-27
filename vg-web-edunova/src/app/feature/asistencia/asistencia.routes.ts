import { Routes } from '@angular/router';
import { academicFeatureGuard } from '../../core/guards/academic-feature.guard';

export const asistenciaRoutes: Routes = [
  {
    path: '',
    canActivate: [academicFeatureGuard],
    loadComponent: () => import('./asistencia').then(m => m.AsistenciaComponent)
  }
];
