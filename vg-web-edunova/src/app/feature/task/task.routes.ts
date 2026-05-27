import { Routes } from '@angular/router';
import { academicFeatureGuard } from '../../core/guards/academic-feature.guard';

export const taskRoutes: Routes = [
  {
    path: '',
    canActivate: [academicFeatureGuard],
    loadComponent: () => import('./task.component').then(m => m.TaskComponent)
  }
];
