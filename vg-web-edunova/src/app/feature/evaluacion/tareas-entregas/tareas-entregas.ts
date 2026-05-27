import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Tarea {
  id: number;
  titulo: string;
  materia: string;
  estado: 'ACTIVA' | 'CERRADA' | 'PARA_CALIFICAR' | 'PROGRAMADA';
  fechaVencimiento: string;
  progreso: number;
  totalEntregas: number;
  totalEstudiantes: number;
  icono: string;
}

interface FiltroTarea {
  id: string;
  nombre: string;
  activo: boolean;
}

@Component({
  selector: 'app-tareas-entregas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tareas-entregas.html',
  styleUrl: './tareas-entregas.scss'
})
export class TareasEntregasComponent implements OnInit {
  // Señales
  loading = signal(false);
  filtroActivo = signal<string>('TODAS');
  claseExpandida = signal(false);

  // Filtros
  filtros: FiltroTarea[] = [
    { id: 'TODAS', nombre: 'TODAS LAS TAREAS', activo: true },
    { id: 'ACTIVAS', nombre: 'ACTIVAS', activo: false },
    { id: 'PARA_CALIFICAR', nombre: 'PARA CALIFICAR', activo: false },
    { id: 'CERRADAS', nombre: 'CERRADAS', activo: false }
  ];

  // Tareas mock – data que coincide con la imagen
  tareas: Tarea[] = [
    {
      id: 1,
      titulo: 'Ecuaciones de 2do Grado',
      materia: 'MATEMÁTICA AVANZADA',
      estado: 'ACTIVA',
      fechaVencimiento: 'MAÑANA, 23:59',
      progreso: 87.5,
      totalEntregas: 28,
      totalEstudiantes: 32,
      icono: '📐'
    },
    {
      id: 2,
      titulo: 'Ensayo sobre Don Quijote',
      materia: 'COMUNICACIÓN',
      estado: 'ACTIVA',
      fechaVencimiento: 'VIE, 14 MAYO',
      progreso: 53.5,
      totalEntregas: 15,
      totalEstudiantes: 28,
      icono: '📚'
    },
    {
      id: 3,
      titulo: 'Maqueta Célula Animal',
      materia: 'CIENCIAS NATURALES',
      estado: 'PROGRAMADA',
      fechaVencimiento: 'LUN, 17 MAYO',
      progreso: 0,
      totalEntregas: 0,
      totalEstudiantes: 25,
      icono: '🔬'
    },
    {
      id: 4,
      titulo: 'Cuestionario Guerra Fría',
      materia: 'HISTORIA UNIVERSAL',
      estado: 'CERRADA',
      fechaVencimiento: 'AYER',
      progreso: 100,
      totalEntregas: 30,
      totalEstudiantes: 30,
      icono: '📖'
    },
    {
      id: 5,
      titulo: 'Mapa Conceptual: Geografía',
      materia: 'CIENCIAS SOCIALES',
      estado: 'ACTIVA',
      fechaVencimiento: 'EN 3 DÍAS',
      progreso: 43.3,
      totalEntregas: 13,
      totalEstudiantes: 30,
      icono: '🗺️'
    },
    {
      id: 6,
      titulo: 'Laboratorio de Química',
      materia: 'QUÍMICA I',
      estado: 'ACTIVA',
      fechaVencimiento: 'HOY, 18:00',
      progreso: 100,
      totalEntregas: 25,
      totalEstudiantes: 25,
      icono: '🧪'
    }
  ];

  ngOnInit(): void {
    // Aquí cargarías los datos reales del backend
  }

  /**
   * Cambiar filtro activo
   */
  cambiarFiltro(filtroId: string): void {
    this.filtroActivo.set(filtroId);
  }

  /**
   * Obtener conteo por filtro
   */
  obtenerConteoFiltro(filtroId: string): number {
    if (filtroId === 'TODAS') return this.tareas.length;
    if (filtroId === 'ACTIVAS') return this.tareas.filter(t => t.estado === 'ACTIVA').length;
    if (filtroId === 'CERRADAS') return this.tareas.filter(t => t.estado === 'CERRADA').length;
    if (filtroId === 'PARA_CALIFICAR') return this.tareas.filter(t => t.estado === 'PARA_CALIFICAR').length;
    return 0;
  }

  /**
   * Toggle expansión de clases
   */
  toggleClases(): void {
    this.claseExpandida.set(!this.claseExpandida());
  }

  /**
   * Obtener tareas filtradas
   */
  get tareasFiltradas(): Tarea[] {
    const filtro = this.filtroActivo();
    if (filtro === 'TODAS') return this.tareas;
    if (filtro === 'ACTIVAS') return this.tareas.filter(t => t.estado === 'ACTIVA');
    if (filtro === 'CERRADAS') return this.tareas.filter(t => t.estado === 'CERRADA');
    if (filtro === 'PARA_CALIFICAR') return this.tareas.filter(t => t.estado === 'PARA_CALIFICAR');
    return this.tareas.filter(t => t.estado === filtro);
  }

  /**
   * Obtener clase CSS del estado
   */
  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'ACTIVA': return 'estado-activa';
      case 'PARA_CALIFICAR': return 'estado-calificar';
      case 'CERRADA': return 'estado-cerrada';
      case 'PROGRAMADA': return 'estado-programada';
      default: return '';
    }
  }

  /**
   * Obtener texto del estado
   */
  getEstadoTexto(estado: string): string {
    switch (estado) {
      case 'ACTIVA': return 'ACTIVA';
      case 'PARA_CALIFICAR': return 'PARA CALIFICAR';
      case 'CERRADA': return 'CERRADA';
      case 'PROGRAMADA': return 'PROGRAMADA';
      default: return estado;
    }
  }

  /**
   * Obtener clase CSS para la barra de progreso
   */
  getProgresoClass(progreso: number): string {
    if (progreso === 0) return 'progreso-vacio';
    if (progreso === 100) return 'progreso-completo';
    if (progreso >= 70) return 'progreso-alto';
    if (progreso >= 40) return 'progreso-medio';
    return 'progreso-bajo';
  }

  /**
   * Nueva tarea
   */
  nuevaTarea(): void {
    console.log('Nueva tarea');
  }

  /**
   * Ver detalles de tarea
   */
  verDetalles(tarea: Tarea): void {
    console.log('Ver detalles:', tarea);
  }

  /**
   * Abrir menú de tarea
   */
  abrirMenu(tarea: Tarea, event: Event): void {
    event.stopPropagation();
    console.log('Abrir menú:', tarea);
  }
}
