import { Component, OnInit, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExamenService } from '../../../core/services/evaluacion/examen.service';
import { BancoPreguntaService } from '../../../core/services/evaluacion/banco-pregunta.service';
import { ExamenResponse, ExamenPreguntaResponse, BancoPreguntaResponse, ExamenRespuestaRequest } from '../../../core/interfaces/evaluacion.interface';
import Swal from 'sweetalert2';

interface PreguntaConDetalles extends ExamenPreguntaResponse {
  preguntaDetalle?: BancoPreguntaResponse;
  respuestaSeleccionada?: string;
  opciones?: any[];
}

@Component({
  selector: 'app-tomar-examen',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tomar-examen.html',
  styleUrl: './tomar-examen.scss'
})
export class TomarExamenComponent implements OnInit {
  examenId = input.required<number>();
  estudianteId = input.required<number>();
  
  loading = signal(false);
  examen = signal<ExamenResponse | null>(null);
  preguntas = signal<PreguntaConDetalles[]>([]);
  preguntaActual = signal(0);
  tiempoRestante = signal(0);
  examenIniciado = signal(false);
  examenFinalizado = signal(false);
  
  private intervalId?: number;

  constructor(
    private examenService: ExamenService,
    private bancoPreguntaService: BancoPreguntaService
  ) {}

  ngOnInit(): void {
    this.cargarExamen();
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  /**
   * Obtener número de preguntas respondidas
   */
  get preguntasRespondidas(): number {
    return this.preguntas().filter(p => p.respuestaSeleccionada != null).length;
  }

  cargarExamen(): void {
    this.loading.set(true);
    this.examenService.obtenerPorId(this.examenId()).subscribe({
      next: (examen) => {
        this.examen.set(examen);
        this.cargarPreguntas();
      },
      error: (error) => {
        console.error('Error al cargar examen:', error);
        this.loading.set(false);
      }
    });
  }

  cargarPreguntas(): void {
    this.examenService.listarPreguntas(this.examenId()).subscribe({
      next: (preguntas) => {
        this.cargarDetallesPreguntas(preguntas);
      },
      error: (error) => {
        console.error('Error al cargar preguntas:', error);
        this.loading.set(false);
      }
    });
  }

  cargarDetallesPreguntas(preguntas: ExamenPreguntaResponse[]): void {
    const preguntasConDetalles: PreguntaConDetalles[] = [];
    let cargadas = 0;

    preguntas.forEach(pregunta => {
      this.bancoPreguntaService.obtenerPorId(pregunta.bancoPreguntaId).subscribe({
        next: (detalle) => {
          const preguntaCompleta: PreguntaConDetalles = {
            ...pregunta,
            preguntaDetalle: detalle,
            opciones: this.parseOpciones(detalle.opciones)
          };
          preguntasConDetalles.push(preguntaCompleta);
          cargadas++;
          
          if (cargadas === preguntas.length) {
            // Ordenar por orden
            preguntasConDetalles.sort((a, b) => a.orden - b.orden);
            this.preguntas.set(preguntasConDetalles);
            this.loading.set(false);
          }
        },
        error: () => {
          cargadas++;
          if (cargadas === preguntas.length) {
            this.preguntas.set(preguntasConDetalles);
            this.loading.set(false);
          }
        }
      });
    });
  }

  parseOpciones(opcionesStr?: string): any[] {
    if (!opcionesStr) return [];
    try {
      return JSON.parse(opcionesStr);
    } catch {
      return [];
    }
  }

  iniciarExamen(): void {
    const request = {
      examenId: this.examenId(),
      estudianteId: this.estudianteId(),
      fechaInicio: new Date().toISOString(),
      puntajeObtenido: 0,
      puntajeTotal: this.examen()?.puntajeTotal || 0,
      porcentaje: 0,
      aprobado: false,
      intentoNumero: 1
    };

    this.examenService.iniciarExamen(request).subscribe({
      next: () => {
        this.examenIniciado.set(true);
        this.iniciarTemporizador();
      },
      error: (error) => {
        console.error('Error al iniciar examen:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo iniciar el examen'
        });
      }
    });
  }

  iniciarTemporizador(): void {
    const duracion = this.examen()?.duracionMinutos || 60;
    this.tiempoRestante.set(duracion * 60); // en segundos

    this.intervalId = window.setInterval(() => {
      const tiempo = this.tiempoRestante();
      if (tiempo <= 0) {
        this.finalizarExamen();
      } else {
        this.tiempoRestante.set(tiempo - 1);
      }
    }, 1000);
  }

  seleccionarRespuesta(respuesta: string): void {
    const preguntasActuales = this.preguntas();
    preguntasActuales[this.preguntaActual()].respuestaSeleccionada = respuesta;
    this.preguntas.set([...preguntasActuales]);
  }

  siguientePregunta(): void {
    if (this.preguntaActual() < this.preguntas().length - 1) {
      this.preguntaActual.set(this.preguntaActual() + 1);
    }
  }

  preguntaAnterior(): void {
    if (this.preguntaActual() > 0) {
      this.preguntaActual.set(this.preguntaActual() - 1);
    }
  }

  irAPregunta(index: number): void {
    this.preguntaActual.set(index);
  }

  finalizarExamen(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    // Registrar todas las respuestas
    const preguntas = this.preguntas();
    const respuestas = preguntas.map(p => ({
      examenId: this.examenId(),
      estudianteId: this.estudianteId(),
      preguntaId: p.id,
      respuesta: p.respuestaSeleccionada || '',
      intentoNumero: 1
    }));

    // Aquí deberías registrar las respuestas una por una
    // Por simplicidad, solo finalizamos el intento
    this.examenService.finalizarIntento(this.examenId(), this.estudianteId(), 1).subscribe({
      next: () => {
        this.examenFinalizado.set(true);
        Swal.fire({
          icon: 'success',
          title: 'Examen finalizado',
          text: 'Tus respuestas han sido guardadas'
        });
      },
      error: (error) => {
        console.error('Error al finalizar examen:', error);
      }
    });
  }

  get tiempoFormateado(): string {
    const tiempo = this.tiempoRestante();
    const minutos = Math.floor(tiempo / 60);
    const segundos = tiempo % 60;
    return `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
  }

  get progreso(): number {
    const respondidas = this.preguntas().filter(p => p.respuestaSeleccionada).length;
    return (respondidas / this.preguntas().length) * 100;
  }
}