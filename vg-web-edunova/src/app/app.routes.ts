import { Routes } from '@angular/router';
import { authGuard, loginGuard } from './core/guards/auth.guard';
import { institutionsResolver } from './core/resolvers/institutions.resolver';

export const routes: Routes = [
  {
    path: 'auth/login',
    canActivate: [loginGuard],
    loadComponent: () => import('./feature/auth/login/login').then(m => m.Login)
  },
  {
    path: 'auth/register',
    canActivate: [loginGuard],
    resolve: { institutions: institutionsResolver },
    loadComponent: () => import('./feature/auth/register/register').then(m => m.Register)
  },
  {
    path: 'auth/forgot-password',
    loadComponent: () => import('./feature/auth/forgot-password/forgot-password').then(m => m.ForgotPassword)
  },
  {
    path: 'auth/reset-password',
    loadComponent: () => import('./feature/auth/reset-password/reset-password').then(m => m.ResetPassword)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/main-layout/main-layout').then(m => m.MainLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./feature/dashboard/dashboard').then(m => m.DashboardComponent)
      },
      {
        path: 'agenda',
        loadComponent: () => import('./feature/agenda/agenda').then(m => m.AgendaComponent)
      },
      {
        path: 'clases',
        loadComponent: () => import('./feature/clases/clases').then(m => m.ClasesComponent)
      },
      {
        path: 'student-grade-history',
        loadComponent: () => import('./feature/student-grade-history/student-grade-history').then(m => m.StudentGradeHistoryComponent)
      },
      {
        path: 'tasks',
        loadChildren: () => import('./feature/task/task.routes').then(m => m.taskRoutes)
      },
      {
        path: 'asistencia',
        loadChildren: () => import('./feature/asistencia/asistencia.routes').then(m => m.asistenciaRoutes)
      },
      {
        path: 'evaluacion',
        loadComponent: () => import('./feature/evaluacion/evaluacion').then(m => m.EvaluacionComponent)
      },
      {
        path: 'directorio',
        loadComponent: () => import('./feature/directorio/directorio').then(m => m.DirectorioComponent)
      },
      {
        path: 'eventos',
        loadComponent: () => import('./feature/eventos/eventos').then(m => m.EventosComponent)
      },
      {
        path: 'instituciones',
        loadComponent: () => import('./feature/instituciones/instituciones').then(m => m.Instituciones)
      },
      {
        path: 'persons',
        loadComponent: () => import('./feature/persons/persons').then(m => m.PersonsComponent)
      },
      {
        path: 'students',
        loadComponent: () => import('./feature/students/students').then(m => m.StudentsComponent)
      },
      {
        path: 'teachers',
        loadComponent: () => import('./feature/teachers/teachers').then(m => m.TeachersComponent)
      },
      {
        path: 'guardians',
        loadComponent: () => import('./feature/guardians/guardians').then(m => m.GuardiansComponent)
      },
      {
        path: 'student-guardians',
        loadComponent: () => import('./feature/student-guardians/student-guardians').then(m => m.StudentGuardiansComponent)
      },
      {
        path: 'grading-scales',
        loadComponent: () => import('./feature/grading-scales/grading-scales').then(m => m.GradingScalesComponent)
      },
      {
        path: 'evaluation-criteria',
        loadComponent: () => import('./feature/evaluation-criteria/evaluation-criteria').then(m => m.EvaluationCriteriaComponent)
      },
      {
        path: 'usuarios',
        loadComponent: () => import('./feature/usuarios/usuarios').then(m => m.UsuariosComponent)
      },
      {
        path: 'roles',
        loadComponent: () => import('./feature/roles/roles').then(m => m.Roles)
      },
      {
        path: 'permisos',
        loadComponent: () => import('./feature/permisos/permisos').then(m => m.Permisos)
      },
      {
        path: 'configuraciones',
        loadComponent: () => import('./feature/configuraciones/configuraciones').then(m => m.Configuraciones)
      },
      {
        path: 'audit-logs',
        loadComponent: () => import('./feature/audit-logs/audit-logs').then(m => m.AuditLogs)
      },
      {
        path: 'reportes',
        loadComponent: () => import('./feature/reportes/reportes').then(m => m.ReportesComponent)
      },
      {
        path: 'configuracion',
        loadComponent: () => import('./feature/configuraciones/configuraciones').then(m => m.Configuraciones)
      }
    ]
  }
];