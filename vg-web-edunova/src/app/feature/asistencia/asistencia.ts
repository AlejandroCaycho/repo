import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { LucideAngularModule, Check, X, FileSpreadsheet, Download, Save, RefreshCw, Clock } from 'lucide-angular';
import { AsistenciaService, Attendance, BulkAttendanceRequest } from '../../core/services/asistencia.service';
import { TaskService } from '../../core/services/task.service';
import Swal from 'sweetalert2';
import { AttendanceStatusLabelPipe } from '../../core/pipes/attendance-status-label.pipe';
import { AsistenciaResolvedData } from '../../core/resolvers/asistencia-data.resolver';

interface StudentAttendance {
  studentId: number;
  studentName: string;
  studentCode: string;
  gradeId: number;
  status: string;
  observation: string;
  originalStatus: string;
  originalObservation: string;
  savingTimeout?: any;
}

@Component({
  selector: 'app-asistencia',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, AttendanceStatusLabelPipe],
  templateUrl: './asistencia.html',
  styleUrls: ['./asistencia.scss']
})
export class AsistenciaComponent implements OnInit, OnDestroy {
  readonly Check = Check;
  readonly X = X;
  readonly FileSpreadsheet = FileSpreadsheet;
  readonly Download = Download;
  readonly Save = Save;
  readonly RefreshCw = RefreshCw;
  readonly Clock = Clock;

  private taskService = inject(TaskService);
  private asistenciaService = inject(AsistenciaService);
  private route = inject(ActivatedRoute);

  gradosDisponibles: any[] = [];
  selectedGradoId: number = 0;
  
  clasesDisponibles: any[] = [];
  selectedClase: any = null;
  
  // Fecha actual correcta (YYYY-MM-DD)
  hoy: string = new Date().toLocaleDateString('en-CA');
  selectedDate: string = new Date().toLocaleDateString('en-CA');
  
  estudiantes: StudentAttendance[] = [];
  estudiantesFiltrados: StudentAttendance[] = [];
  private resolvedStudents: any[] = [];
  private resolvedClases: any[] = [];
  private resolvedMaterias: any[] = [];
  filtroEstado: string = 'todos';
  loading: boolean = false;
  saving: boolean = false;
  
  showObservationModal: boolean = false;
  modalStudent: StudentAttendance | null = null;
  modalObservation: string = '';
  modalLateTime: string = '';
  modalNewStatus: string = '';
  
  statusOptions = [
    { value: 'A', label: 'Presente', icon: Check, color: '#10b981' },
    { value: 'F', label: 'Falta', icon: X, color: '#ef4444' },
    { value: 'T', label: 'Tardanza', icon: Clock, color: '#3b82f6' },
    { value: 'J', label: 'Justificado', icon: FileSpreadsheet, color: '#f59e0b' }
  ];

  private autoSaveTimers: Map<number, any> = new Map();

  async ngOnInit() {
    const resolved = this.route.snapshot.data['asistenciaData'] as AsistenciaResolvedData | undefined;
    if (resolved) {
      this.hidratarDatosIniciales(resolved);
      if (this.gradosDisponibles.length > 0) {
        this.selectedGradoId = Number(this.gradosDisponibles[0].id);
        await this.cargarClases();
      }
      return;
    }

    await this.cargarGrados();
  }

  ngOnDestroy() {
    this.autoSaveTimers.forEach(timer => clearTimeout(timer));
  }

  async cargarGrados() {
    this.loading = true;
    try {
      const grados = await this.taskService.getGrados().toPromise();
      if (grados && grados.length > 0) {
        this.gradosDisponibles = grados;
        if (this.gradosDisponibles.length > 0) {
          this.selectedGradoId = this.gradosDisponibles[0].id;
          await this.cargarClases();
        }
      }
    } catch (error) {
      console.error('Error cargando grados:', error);
    } finally {
      this.loading = false;
    }
  }

  private hidratarDatosIniciales(data: AsistenciaResolvedData) {
    this.gradosDisponibles = data.grados || [];
    this.resolvedClases = data.clases || [];
    this.resolvedMaterias = data.materias || [];
    this.resolvedStudents = data.students || [];
  }

  getNombreGrado(): string {
    const grado = this.gradosDisponibles.find(g => g.id === this.selectedGradoId);
    return grado ? grado.nombre : `Grado ${this.selectedGradoId}`;
  }

  async cargarClases() {
    if (!this.selectedGradoId) return;
    
    this.loading = true;
    this.clasesDisponibles = [];
    this.selectedClase = null;
    this.estudiantes = [];
    this.estudiantesFiltrados = [];
    
    try {
      const [clases, materias] = this.resolvedClases.length && this.resolvedMaterias.length
        ? [this.resolvedClases, this.resolvedMaterias]
        : await Promise.all([
            this.taskService.getClases().toPromise(),
            this.taskService.getMaterias().toPromise()
          ]);
      
      if (clases && materias && clases.length > 0) {
        const gradoId = Number(this.selectedGradoId);
        const clasesDelGrado = clases.filter((c: any) => Number(c.gradoId) === gradoId);
        
        this.clasesDisponibles = clasesDelGrado.map((clase: any) => {
          const materia = materias.find((m: any) => m.id === clase.materiaId);
          return {
            id: clase.id,
            classId: clase.id,
            materiaId: clase.materiaId,
            nombre: materia?.nombre || `Materia ${clase.materiaId}`,
            gradoId: clase.gradoId
          };
        });
        
        if (this.clasesDisponibles.length > 0) {
          this.selectedClase = this.clasesDisponibles[0];
          await this.cargarEstudiantes();
        }
      }
    } catch (error) {
      console.error('Error cargando clases:', error);
    } finally {
      this.loading = false;
    }
  }

  async cargarEstudiantes() {
    if (!this.selectedClase) return;
    
    this.loading = true;
    try {
      const [allStudents, asistencias] = await Promise.all([
        this.resolvedStudents.length ? Promise.resolve(this.resolvedStudents) : this.taskService.getStudents().toPromise(),
        this.asistenciaService.getByClassAndDate(this.selectedClase.classId, this.selectedDate).toPromise()
      ]);
      
      const gradoId = Number(this.selectedGradoId);
      const estudiantesDelGrado = (allStudents || []).filter((s: any) => Number(s.gradeId) === gradoId);
      const asistenciasMap = new Map((asistencias || []).map((a: Attendance) => [Number(a.studentId), a]));
      const people = await this.taskService.getPeopleCached().toPromise();
      const peopleById = new Map((people || []).map((p: any) => [Number(p.id), p]));
      
      this.estudiantes = estudiantesDelGrado.map((s: any, index: number) => {
        const person = peopleById.get(Number(s.personId));
        const nombre = person ? this.getPersonName(person) : `Estudiante ${s.id}`;
        const asistencia = asistenciasMap.get(Number(s.id));
        return {
          studentId: s.id,
          studentName: nombre,
          studentCode: s.studentCode || '',
          gradeId: s.gradeId,
          status: asistencia?.status || '',
          observation: asistencia?.observation || '',
          originalStatus: asistencia?.status || '',
          originalObservation: asistencia?.observation || ''
        };
      });
      this.aplicarFiltro();
    } catch (error) {
      console.error('Error cargando estudiantes:', error);
    } finally {
      this.loading = false;
    }
  }

  private async getPersonOrNull(personId: number) {
    try {
      return await this.taskService.getPersonCached(personId).toPromise();
    } catch {
      return null;
    }
  }

  private getPersonName(person: any): string {
    return [person.firstName, person.lastName, person.secondLastName].filter(Boolean).join(' ');
  }

  aplicarFiltro() {
    if (this.filtroEstado === 'todos') {
      this.estudiantesFiltrados = [...this.estudiantes];
    } else {
      this.estudiantesFiltrados = this.estudiantes.filter(s => s.status === this.filtroEstado);
    }
  }

  filtrarTodos() { this.filtroEstado = 'todos'; this.aplicarFiltro(); }
  filtrarPresentes() { this.filtroEstado = 'A'; this.aplicarFiltro(); }
  filtrarFaltas() { this.filtroEstado = 'F'; this.aplicarFiltro(); }
  filtrarTardanzas() { this.filtroEstado = 'T'; this.aplicarFiltro(); }
  filtrarJustificados() { this.filtroEstado = 'J'; this.aplicarFiltro(); }

  onGradoChange() {
    this.selectedGradoId = Number(this.selectedGradoId);
    this.cargarClases();
  }

  onClaseChange() {
    this.cargarEstudiantes();
  }

  onDateChange() {
    if (this.selectedDate > this.hoy) {
      Swal.fire('Fecha no válida', 'No puede seleccionar una fecha futura', 'warning');
      this.selectedDate = this.hoy;
      return;
    }
    if (this.selectedClase) {
      this.cargarEstudiantes();
    }
  }

  hasChanges(student: StudentAttendance): boolean {
    return student.status !== student.originalStatus || student.observation !== student.originalObservation;
  }

  cambiarEstado(student: StudentAttendance, newStatus: string) {
    if (student.status === newStatus && student.status !== '') return;
    
    if (newStatus === 'J' || newStatus === 'T') {
      this.modalStudent = student;
      this.modalNewStatus = newStatus;
      this.modalObservation = newStatus === 'J' ? student.observation || '' : '';
      this.modalLateTime = this.extractLateTime(student.observation);
      this.showObservationModal = true;
      return;
    }
    
    student.status = newStatus;
    if (newStatus === 'A' || newStatus === 'F') student.observation = '';
    this.programarAutoGuardado(student);
    this.aplicarFiltro();
  }

  cerrarModal() {
    this.showObservationModal = false;
    this.modalStudent = null;
    this.modalObservation = '';
    this.modalLateTime = '';
    this.modalNewStatus = '';
  }

  confirmarCambioConObservacion() {
    if (this.modalNewStatus === 'J' && (!this.modalObservation || this.modalObservation.trim() === '')) {
      Swal.fire('Observación requerida', 'Debe ingresar una observación para justificar la asistencia', 'warning');
      return;
    }
    if (this.modalNewStatus === 'T' && (!this.modalLateTime || this.modalLateTime.trim() === '')) {
      Swal.fire('Hora requerida', 'Debe ingresar la hora de llegada para registrar la tardanza', 'warning');
      return;
    }
    if (this.modalStudent) {
      this.modalStudent.status = this.modalNewStatus;
      this.modalStudent.observation = this.modalNewStatus === 'T'
        ? `Tardanza: ${this.modalLateTime}`
        : this.modalObservation.trim();
      this.programarAutoGuardado(this.modalStudent);
      this.aplicarFiltro();
    }
    this.cerrarModal();
  }

  private extractLateTime(observation: string): string {
    const match = (observation || '').match(/(\d{2}:\d{2})/);
    return match ? match[1] : '';
  }

  programarAutoGuardado(student: StudentAttendance) {
    if (student.savingTimeout) clearTimeout(student.savingTimeout);
    student.savingTimeout = setTimeout(() => this.guardarAsistencia(student), 5000);
  }

  async guardarAsistencia(student: StudentAttendance) {
    if (!this.hasChanges(student) || !this.selectedClase) return;
    
    const request: BulkAttendanceRequest = {
      classId: this.selectedClase.classId,
      date: this.selectedDate,
      attendances: [{ studentId: student.studentId, status: student.status, observation: student.observation || '' }]
    };
    
    try {
      await this.asistenciaService.saveBulk(request).toPromise();
      student.originalStatus = student.status;
      student.originalObservation = student.observation;
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Asistencia actualizada',
        showConfirmButton: false,
        timer: 1800
      });
    } catch (error) {
      console.error('Error guardando:', error);
      Swal.fire('Error', 'No se pudo guardar la asistencia', 'error');
    }
  }

  async guardarTodas() {
    if (!this.selectedClase) return;
    
    const toSave = this.estudiantes.filter(s => this.hasChanges(s));
    if (toSave.length === 0) {
      Swal.fire('Sin cambios', 'No hay asistencias pendientes por guardar', 'info');
      return;
    }
    
    const request: BulkAttendanceRequest = {
      classId: this.selectedClase.classId,
      date: this.selectedDate,
      attendances: toSave.map(s => ({ studentId: s.studentId, status: s.status, observation: s.observation || '' }))
    };
    
    this.saving = true;
    try {
      await this.asistenciaService.saveBulk(request).toPromise();
      this.estudiantes.forEach(s => {
        s.originalStatus = s.status;
        s.originalObservation = s.observation;
        if (s.savingTimeout) clearTimeout(s.savingTimeout);
      });
      this.aplicarFiltro();
      Swal.fire('Guardado', 'Asistencias guardadas correctamente', 'success');
    } catch (error) {
      console.error('Error:', error);
      Swal.fire('Error', 'Error al guardar las asistencias', 'error');
    } finally {
      this.saving = false;
    }
  }

  getPresentesCount(): number { return this.estudiantes.filter(s => s.status === 'A').length; }
  getFaltasCount(): number { return this.estudiantes.filter(s => s.status === 'F').length; }
  getTardanzasCount(): number { return this.estudiantes.filter(s => s.status === 'T').length; }
  getJustificadosCount(): number { return this.estudiantes.filter(s => s.status === 'J').length; }
  getTotalCount(): number { return this.estudiantes.length; }

  async exportarExcel() {
    if (!this.selectedClase) {
      Swal.fire('Seleccione una clase', 'Debe seleccionar una clase para exportar asistencias', 'warning');
      return;
    }
    const result = await Swal.fire({
      title: 'Exportar asistencias',
      text: `¿Desea descargar el Excel de ${this.selectedClase.nombre} para el ${this.selectedDate}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, exportar',
      cancelButtonText: 'Cancelar'
    });
    if (!result.isConfirmed) return;

    try {
      const blob = await this.asistenciaService.exportToExcel(this.selectedClase.classId, this.selectedDate).toPromise();
      if (blob) {
        this.downloadBlob(blob, `asistencias_${this.selectedDate}.xlsx`);
        Swal.fire('Exportado', 'El archivo Excel se descargó correctamente', 'success');
      }
    } catch (error) {
      console.error('Error:', error);
      Swal.fire('Error', 'Error al exportar', 'error');
    }
  }

  async descargarPlantilla() {
    const result = await Swal.fire({
      title: 'Descargar plantilla',
      text: '¿Desea descargar la plantilla de asistencias?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, descargar',
      cancelButtonText: 'Cancelar'
    });
    if (!result.isConfirmed) return;

    try {
      const blob = await this.asistenciaService.downloadTemplate().toPromise();
      if (blob) {
        this.downloadBlob(blob, 'plantilla_asistencias.xlsx');
        Swal.fire('Descargado', 'La plantilla se descargó correctamente', 'success');
      }
    } catch (error) {
      console.error('Error:', error);
      Swal.fire('Error', 'Error al descargar plantilla', 'error');
    }
  }

  private downloadBlob(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }
}
