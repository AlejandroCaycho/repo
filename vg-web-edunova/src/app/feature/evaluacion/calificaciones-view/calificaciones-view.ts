import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalificacionService } from '../../../core/services/evaluacion/calificacion.service';
import { CalificacionResponse } from '../../../core/interfaces/evaluacion.interface';
import Swal from 'sweetalert2';

interface Estudiante {
  id: number;
  iniciales: string;
  nombre: string;
  matricula: string;
  tareas: number;
  proyectos: number;
  examenes: number;
  participacion: number;
  promedioFinal: number;
  aprobado: boolean;
}

interface Criterio {
  id: string;
  nombre: string;
  porcentaje: number;
  activo: boolean;
}

@Component({
  selector: 'app-calificaciones-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calificaciones-view.html',
  styleUrl: './calificaciones-view.scss'
})
export class CalificacionesViewComponent implements OnInit {
  // Señales
  loading = signal(false);
  criterioActivo = signal<string>('RESUMEN');
  claseSeleccionada = signal<string>('MATEMÁTICA AVANZADA - 5TO A');
  semestreSeleccionado = signal<string>('I SEMESTRE');
  
  // Paginación
  paginaActual = signal(1);
  itemsPorPagina = 6;
  
  // Math para usar en template
  Math = Math;

  // Criterios de evaluación
  criterios: Criterio[] = [
    { id: 'RESUMEN', nombre: 'RESUMEN', porcentaje: 0, activo: true },
    { id: 'TAREAS', nombre: 'TAREAS (30%)', porcentaje: 30, activo: false },
    { id: 'PROYECTOS', nombre: 'PROYECTOS (25%)', porcentaje: 25, activo: false },
    { id: 'EXAMENES', nombre: 'EXÁMENES (35%)', porcentaje: 35, activo: false }
  ];

  // Estudiantes
  estudiantes = signal<Estudiante[]>([]);

  constructor(private calificacionService: CalificacionService) {}

  ngOnInit(): void {
    this.cargarCalificaciones();
  }

  /**
   * Cargar calificaciones del backend
   */
  cargarCalificaciones(): void {
    this.loading.set(true);
    this.calificacionService.listarTodas().subscribe({
      next: (calificaciones) => {
        // Aquí procesarías las calificaciones reales
        // Por ahora cargo datos mock
        this.cargarDatosMock();
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error al cargar calificaciones:', error);
        this.cargarDatosMock();
        this.loading.set(false);
      }
    });
  }

  /**
   * Cargar datos mock
   */
  cargarDatosMock(): void {
    this.estudiantes.set([
      {
        id: 1,
        iniciales: 'CR',
        nombre: 'Carlos Ruiz',
        matricula: 'MATRÍCULA: 2024-001',
        tareas: 17.0,
        proyectos: 16.7,
        examenes: 18.5,
        participacion: 20,
        promedioFinal: 18.2,
        aprobado: true
      },
      {
        id: 2,
        iniciales: 'AS',
        nombre: 'Ana Soto',
        matricula: 'MATRÍCULA: 2024-002',
        tareas: 13.8,
        proyectos: 14.0,
        examenes: 14.5,
        participacion: 16,
        promedioFinal: 14.1,
        aprobado: true
      },
      {
        id: 3,
        iniciales: 'LM',
        nombre: 'Luis Medina',
        matricula: 'MATRÍCULA: 2024-003',
        tareas: 19.0,
        proyectos: 19.0,
        examenes: 19.5,
        participacion: 18,
        promedioFinal: 19.0,
        aprobado: true
      },
      {
        id: 4,
        iniciales: 'SC',
        nombre: 'Sofía Castro',
        matricula: 'MATRÍCULA: 2024-004',
        tareas: 10.9,
        proyectos: 11.0,
        examenes: 11.0,
        participacion: 14,
        promedioFinal: 11.0,
        aprobado: false
      },
      {
        id: 5,
        iniciales: 'DT',
        nombre: 'Diego Torres',
        matricula: 'MATRÍCULA: 2024-005',
        tareas: 15.3,
        proyectos: 15.7,
        examenes: 16.0,
        participacion: 17,
        promedioFinal: 15.8,
        aprobado: true
      },
      {
        id: 6,
        iniciales: 'MG',
        nombre: 'María García',
        matricula: 'MATRÍCULA: 2024-006',
        tareas: 17.3,
        proyectos: 17.0,
        examenes: 17.5,
        participacion: 19,
        promedioFinal: 17.5,
        aprobado: true
      },
      {
        id: 7,
        iniciales: 'JP',
        nombre: 'Juan Pérez',
        matricula: 'MATRÍCULA: 2024-007',
        tareas: 12.9,
        proyectos: 13.0,
        examenes: 13.5,
        participacion: 15,
        promedioFinal: 13.2,
        aprobado: true
      },
      {
        id: 8,
        iniciales: 'EB',
        nombre: 'Elena Beltrán',
        matricula: 'MATRÍCULA: 2024-008',
        tareas: 19.5,
        proyectos: 19.7,
        examenes: 19.5,
        participacion: 20,
        promedioFinal: 19.6,
        aprobado: true
      }
    ]);
  }

  /**
   * Cambiar criterio activo
   */
  cambiarCriterio(criterioId: string): void {
    this.criterioActivo.set(criterioId);
  }

  /**
   * Obtener estudiantes paginados
   */
  get estudiantesPaginados(): Estudiante[] {
    const inicio = (this.paginaActual() - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    return this.estudiantes().slice(inicio, fin);
  }

  /**
   * Obtener total de páginas
   */
  get totalPaginas(): number {
    return Math.ceil(this.estudiantes().length / this.itemsPorPagina);
  }

  /**
   * Cambiar página
   */
  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual.set(pagina);
    }
  }

  /**
   * Ir a página anterior
   */
  paginaAnterior(): void {
    if (this.paginaActual() > 1) {
      this.paginaActual.set(this.paginaActual() - 1);
    }
  }

  /**
   * Ir a página siguiente
   */
  paginaSiguiente(): void {
    if (this.paginaActual() < this.totalPaginas) {
      this.paginaActual.set(this.paginaActual() + 1);
    }
  }

  /**
   * Obtener array de números de página
   */
  get paginasArray(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
  }

  /**
   * Obtener clase CSS del promedio
   */
  getPromedioClass(promedio: number): string {
    if (promedio >= 18) return 'promedio-excelente';
    if (promedio >= 14) return 'promedio-bueno';
    if (promedio >= 11) return 'promedio-regular';
    return 'promedio-bajo';
  }

  /**
   * Calcular estadísticas
   */
  get estadisticas() {
    const estudiantesArray = this.estudiantes();
    const aprobados = estudiantesArray.filter(e => e.aprobado).length;
    const total = estudiantesArray.length;
    const porcentajeAprobados = total > 0 ? Math.round((aprobados / total) * 100) : 0;
    
    const promedios = estudiantesArray.map(e => e.promedioFinal);
    const promedioGeneral = promedios.length > 0 
      ? promedios.reduce((a, b) => a + b, 0) / promedios.length 
      : 0;
    
    const ultimaEdicion = new Date().toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'short' 
    }).toUpperCase();

    return {
      estado: 'SINCRONIZADO',
      ultimaEdicion: `ÚLTIMA EDICIÓN: HACE 2 MIN`,
      aprobados: porcentajeAprobados,
      promedioGeneral: promedioGeneral.toFixed(1)
    };
  }

  /**
   * Exportar datos
   */
  exportar(): void {
    console.log('Exportar calificaciones');
  }

  /**
   * Ver historial
   */
  verHistorial(): void {
    console.log('Ver historial');
  }

  /**
   * Configurar pesos
   */
  configurarPesos(): void {
    console.log('Configurar pesos');
  }
}
