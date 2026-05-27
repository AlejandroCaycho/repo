import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { LucideAngularModule, Plus, Search, Eye, Edit, Send, Trash2, Bell, Lock, X, Filter, ChevronDown, RefreshCw, LayoutGrid, FileText, CheckCircle, BookOpen } from 'lucide-angular';
import Swal from 'sweetalert2';
import { TaskService, Task, TeacherSubjects, StudentDashboard } from '../../core/services/task.service';
import { TaskDialogComponent } from './task-dialog.component';
import { TaskDetailDialogComponent } from './task-detail-dialog.component';
import { TaskDetailTeacherDialogComponent } from './task-detail-teacher-dialog.component';
import { GradeDialogComponent } from './grade-dialog.component';
import { TaskStatusLabelPipe } from '../../core/pipes/task-status-label.pipe';
import { TaskResolvedData } from '../../core/resolvers/task-data.resolver';

@Component({
  selector: 'app-task',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, TaskStatusLabelPipe],
  templateUrl: './task.component.html',
  styleUrl: './task.component.scss'
})
export class TaskComponent implements OnInit {
  private taskService = inject(TaskService);
  private dialog = inject(MatDialog);
  private route = inject(ActivatedRoute);

  isLoading = false;
  role: 'teacher' | 'student' = 'teacher';
  currentUserId = 1;
  currentUserName = '';
  currentUserRole = '';
  
  tareas: Task[] = [];
  tareasFiltradas: Task[] = [];
  materias: any[] = [];
  clases: any[] = [];
  materiasDelProfesor: any[] = [];
  searchQuery = '';
  filtroMateriaId = 0;
  filtroEstado: string = 'todos';
  
  teacherSubjects: TeacherSubjects | null = null;
  studentDashboard: StudentDashboard | null = null;
  
  teachers: any[] = [];
  students: any[] = [];
  showUserSelector = false;

  filtroMateriaEstudianteId: number = 0;
  filtroEstadoEstudiante: 'todos' | 'pendientes' | 'entregadas' | 'calificadas' = 'todos';
  materiasEstudianteFiltradas: any[] = [];

  icons = { Plus, Search, Eye, Edit, Send, Trash2, Bell, Lock, X, Filter, ChevronDown, RefreshCw, LayoutGrid, FileText, CheckCircle, BookOpen };

  async ngOnInit() {
    this.isLoading = true;
    const resolved = this.route.snapshot.data['taskData'] as TaskResolvedData | undefined;
    if (resolved) {
      await this.hidratarDatosIniciales(resolved);
    } else {
      await Promise.all([
        this.cargarMaterias(),
        this.cargarProfesores()
      ]);
    }
    await this.cargarDatos();
  }

  private async hidratarDatosIniciales(data: TaskResolvedData) {
    this.materias = data.materias || [];
    this.clases = data.clases || [];

    const teacherPersons = await Promise.all(
      (data.teachers || []).map((t: any) => this.getPersonOrNull(t.personId))
    );
    this.teachers = (data.teachers || []).map((t: any, index: number) => {
      const person = teacherPersons[index];
      return {
        id: t.id,
        nombre: person ? `${person.firstName} ${person.lastName}` : t.teacherCode,
        specialty: t.specialty,
        role: 'teacher',
        roleName: 'Profesor'
      };
    });

    const studentPersons = await Promise.all(
      (data.students || []).map((s: any) => this.getPersonOrNull(s.personId))
    );
    this.students = (data.students || []).map((s: any, index: number) => {
      const person = studentPersons[index];
      return {
        id: s.id,
        nombre: person ? `${person.firstName} ${person.lastName}` : s.studentCode,
        studentCode: s.studentCode,
        gradeId: s.gradeId,
        role: 'student',
        roleName: 'Estudiante'
      };
    });

    if (this.teachers.length > 0 && !this.currentUserName) {
      this.currentUserId = this.teachers[0].id;
      this.currentUserName = this.teachers[0].nombre;
      this.currentUserRole = 'Profesor';
    }
  }

  private async getPersonOrNull(personId: number) {
    try {
      return await this.taskService.getPersonCached(personId).toPromise();
    } catch {
      return null;
    }
  }

  async cargarMaterias() {
    this.materias = await this.taskService.getMaterias().toPromise() || [];
  }

  async cargarClases() {
    this.clases = await this.taskService.getClases().toPromise() || [];
  }

  async cargarProfesores() {
    const [teachers, people] = await Promise.all([
      this.taskService.getTeachers().toPromise(),
      this.taskService.getPeopleCached().toPromise()
    ]);
    const peopleById = new Map((people || []).map((p: any) => [Number(p.id), p]));
    this.teachers = (teachers || []).map((t: any) => {
      const person = peopleById.get(Number(t.personId));
      const nombre = person ? this.getPersonName(person) : t.teacherCode;
      return {
        id: t.id,
        nombre: nombre,
        specialty: t.specialty,
        role: 'teacher',
        roleName: 'Profesor'
      };
    });
    if (this.teachers.length > 0 && !this.currentUserName) {
      this.currentUserId = this.teachers[0].id;
      this.currentUserName = this.teachers[0].nombre;
      this.currentUserRole = 'Profesor';
    }
  }

  async cargarEstudiantes() {
    const [students, people] = await Promise.all([
      this.taskService.getStudents().toPromise(),
      this.taskService.getPeopleCached().toPromise()
    ]);
    const peopleById = new Map((people || []).map((p: any) => [Number(p.id), p]));
    this.students = (students || []).map((s: any) => {
      const person = peopleById.get(Number(s.personId));
      const nombre = person ? this.getPersonName(person) : s.studentCode;
      return {
        id: s.id,
        nombre: nombre,
        studentCode: s.studentCode,
        gradeId: s.gradeId,
        role: 'student',
        roleName: 'Estudiante'
      };
    });
  }

  private getPersonName(person: any): string {
    return [person.firstName, person.lastName, person.secondLastName].filter(Boolean).join(' ');
  }

  getNombreMateria(materiaId: number): string {
    const materia = this.materias.find(m => m.id === materiaId);
    return materia?.nombre || `Materia ${materiaId}`;
  }

  async cargarDatos() {
    this.isLoading = true;
    try {
      if (this.role === 'teacher') {
        const subjects = await this.taskService.getTeacherSubjects(this.currentUserId).toPromise();
        this.teacherSubjects = subjects || null;
        
        if (this.teacherSubjects && this.teacherSubjects.subjects.length > 0) {
          const uniqueMap = new Map<number, any>();
          for (const s of this.teacherSubjects.subjects) {
            const key = Number(s.subjectId);
            if (!uniqueMap.has(key)) {
              uniqueMap.set(key, { ...s, classIds: [Number(s.classId)] });
            } else {
              uniqueMap.get(key).classIds.push(Number(s.classId));
            }
          }
          
          this.materiasDelProfesor = Array.from(uniqueMap.values()).map(s => ({
            id: Number(s.subjectId),
            nombre: s.subjectName,
            gradoId: s.gradeId,
            gradoNombre: s.gradeName,
            classId: Number(s.classId),
            classIds: s.classIds
          }));
          
          const tasksByClass = await Promise.all(
            this.teacherSubjects.subjects.map(s => this.taskService.getTasksByClass(s.classId).toPromise())
          );
          this.tareas = tasksByClass.flatMap(tasks => tasks || []);
        } else {
          this.tareas = [];
          this.materiasDelProfesor = [];
        }
      } else {
        const dashboard = await this.taskService.getStudentDashboard(this.currentUserId).toPromise();
        if (dashboard) {
          dashboard.materias = dashboard.materias.map(materia => ({
            ...materia,
            materiaNombre: this.getNombreMateria(materia.materiaId)
          }));
          this.studentDashboard = dashboard;
          this.aplicarFiltrosEstudiante();
        }
        this.tareas = [];
      }
      this.filtrarTareas();
    } catch (e) {
      console.error(e);
    }
    this.isLoading = false;
  }

  setFiltroEstado(estado: string) {
    this.filtroEstado = estado;
    this.filtrarTareas();
  }

  getTotalTareas(): number {
    return this.tareas.filter(t => !t.isDeleted).length;
  }

  getBorradorCount(): number {
    return this.tareas.filter(t => t.status === 'draft' && !t.isDeleted).length;
  }

  getPublicadaCount(): number {
    return this.tareas.filter(t => t.status === 'published' && !t.isDeleted).length;
  }

  getCerradaCount(): number {
    return this.tareas.filter(t => t.status === 'closed' && !t.isDeleted).length;
  }

  getEliminadaCount(): number {
    return this.tareas.filter(t => t.isDeleted === true).length;
  }

  onFiltroMateriaEstudianteChange(event: any) {
    this.filtroMateriaEstudianteId = Number(event.target.value);
    this.aplicarFiltrosEstudiante();
  }

  setFiltroEstadoEstudiante(estado: 'todos' | 'pendientes' | 'entregadas' | 'calificadas') {
    this.filtroEstadoEstudiante = estado;
    this.aplicarFiltrosEstudiante();
  }

  aplicarFiltrosEstudiante() {
    if (!this.studentDashboard) return;

    let materias = [...this.studentDashboard.materias];
    if (this.filtroMateriaEstudianteId !== 0) {
      materias = materias.filter(m => Number(m.materiaId) === Number(this.filtroMateriaEstudianteId));
    }

    this.materiasEstudianteFiltradas = materias
      .map(materia => ({
        ...materia,
        tareas: this.filtrarTareasEstudiante(materia.tareas)
      }))
      .filter(materia => materia.tareas.length > 0);
  }

  limpiarFiltrosEstudiante() {
    this.filtroMateriaEstudianteId = 0;
    this.filtroEstadoEstudiante = 'todos';
    this.aplicarFiltrosEstudiante();
  }

  filtrarTareasEstudiante(tareas: any[]) {
    if (this.filtroEstadoEstudiante === 'pendientes') {
      return tareas.filter(t => !t.entregada);
    }
    if (this.filtroEstadoEstudiante === 'entregadas') {
      return tareas.filter(t => t.entregada && t.nota === null);
    }
    if (this.filtroEstadoEstudiante === 'calificadas') {
      return tareas.filter(t => t.entregada && t.nota !== null);
    }
    return tareas;
  }

  getTotalTareasEstudiante(): number {
    return this.studentDashboard?.materias.reduce((total, materia) => total + materia.tareas.length, 0) || 0;
  }

  getPendientesEstudiante(): number {
    return this.studentDashboard?.materias.reduce((total, materia) => total + materia.tareas.filter(t => !t.entregada).length, 0) || 0;
  }

  getEntregadasEstudiante(): number {
    return this.studentDashboard?.materias.reduce((total, materia) => total + materia.tareas.filter(t => t.entregada && t.nota === null).length, 0) || 0;
  }

  getCalificadasEstudiante(): number {
    return this.studentDashboard?.materias.reduce((total, materia) => total + materia.tareas.filter(t => t.entregada && t.nota !== null).length, 0) || 0;
  }

  getMateriaNombre(classId: number): string {
    const materiaProf = this.materiasDelProfesor.find(m => m.classId === classId);
    if (materiaProf) {
      return materiaProf.nombre;
    }
    const clase = this.clases.find(c => c.id === classId);
    if (clase) {
      const materia = this.materias.find(m => m.id === clase.materiaId);
      if (materia) {
        return materia.nombre;
      }
    }
    return 'Sin materia';
  }

  filtrarTareas() {
    if (this.role !== 'teacher') return;
    let filtradas = [...this.tareas];
    
    if (this.filtroMateriaId !== 0) {
      filtradas = filtradas.filter(t => {
        const materiaProf = this.materiasDelProfesor.find(m => Number(m.id) === Number(this.filtroMateriaId));
        return materiaProf?.classIds?.includes(Number(t.classId));
      });
    }
    
    if (this.searchQuery) {
      filtradas = filtradas.filter(t => t.title.toLowerCase().includes(this.searchQuery.toLowerCase()));
    }
    
    if (this.filtroEstado === 'borrador') {
      filtradas = filtradas.filter(t => t.status === 'draft' && !t.isDeleted);
    } else if (this.filtroEstado === 'publicada') {
      filtradas = filtradas.filter(t => t.status === 'published' && !t.isDeleted);
    } else if (this.filtroEstado === 'cerrada') {
      filtradas = filtradas.filter(t => t.status === 'closed' && !t.isDeleted);
    } else if (this.filtroEstado === 'eliminada') {
      filtradas = filtradas.filter(t => t.isDeleted === true);
    } else {
      filtradas = filtradas.filter(t => !t.isDeleted);
    }
    
    this.tareasFiltradas = filtradas;
  }

  getMateriaColor(classId: number): string {
    const colores = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899', '#06b6d4'];
    const materiaProf = this.materiasDelProfesor.find(m => m.classId === classId);
    return colores[(materiaProf?.id || 0) % colores.length];
  }

  getMateriaColorById(materiaId: number): string {
    const colores = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899', '#06b6d4'];
    return colores[(materiaId - 1) % colores.length];
  }

  getStatusText(status: string): string {
    const map: any = { draft: 'Borrador', published: 'Publicada', closed: 'Cerrada', graded: 'Calificada' };
    return map[status] || status;
  }

  selectUser(user: any) {
    this.currentUserId = user.id;
    this.role = user.role;
    this.currentUserName = user.nombre;
    this.currentUserRole = user.roleName;
    this.showUserSelector = false;
    this.cargarDatos();
  }

  crearTarea() {
    this.dialog.open(TaskDialogComponent, {
      width: '550px',
      data: { task: null, teacherId: this.currentUserId }
    }).afterClosed().subscribe(r => {
      if (r) this.cargarDatos();
    });
  }

  editarTarea(t: Task) {
    if (t.isDeleted) {
      Swal.fire('Error', 'No se puede editar una tarea eliminada', 'error');
      return;
    }
    this.dialog.open(TaskDialogComponent, {
      width: '550px',
      data: { task: t, teacherId: this.currentUserId }
    }).afterClosed().subscribe(r => {
      if (r) this.cargarDatos();
    });
  }

  eliminarTarea(t: Task) {
    if (t.isDeleted) return;
    Swal.fire({ 
      title: 'Mover a papelera', 
      text: `¿Deseas eliminar "${t.title}"?`, 
      icon: 'warning', 
      showCancelButton: true, 
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(r => {
      if (r.isConfirmed) {
        this.taskService.deleteTask(t.id).subscribe(() => {
          this.cargarDatos();
          Swal.fire('Eliminada', 'La tarea ha sido movida a la papelera', 'success');
        });
      }
    });
  }

  restaurarTarea(t: Task) {
    Swal.fire({ 
      title: 'Restaurar', 
      text: `¿Restaurar "${t.title}"?`, 
      icon: 'question', 
      showCancelButton: true, 
      confirmButtonText: 'Sí, restaurar',
      cancelButtonText: 'Cancelar'
    }).then(r => {
      if (r.isConfirmed) {
        this.taskService.restoreTask(t.id).subscribe(() => {
          this.cargarDatos();
          Swal.fire('Restaurada', 'La tarea ha sido restaurada', 'success');
        });
      }
    });
  }

  publicarTarea(t: Task) {
    if (t.isDeleted) return;
    Swal.fire({ title: 'Publicar', text: `¿Publicar "${t.title}"?`, icon: 'question', showCancelButton: true }).then(r => {
      if (r.isConfirmed) this.taskService.activateTask(t.id).subscribe(() => this.cargarDatos());
    });
  }

  cerrarTarea(t: Task) {
    if (t.isDeleted) return;
    Swal.fire({ title: 'Cerrar', text: `¿Cerrar "${t.title}"?`, icon: 'warning', showCancelButton: true }).then(r => {
      if (r.isConfirmed) this.taskService.closeTask(t.id).subscribe(() => this.cargarDatos());
    });
  }

  calificarTarea(t: Task) {
    if (t.isDeleted) {
      Swal.fire('Error', 'No se puede calificar una tarea eliminada', 'error');
      return;
    }
    this.dialog.open(GradeDialogComponent, {
      width: '90%',
      maxWidth: '1200px',
      data: { taskId: t.id, taskTitle: t.title }
    }).afterClosed().subscribe(r => {
      if (r) this.cargarDatos();
    });
  }

  verDetalle(t: Task) {
    if (this.role === 'teacher') {
      this.dialog.open(TaskDetailTeacherDialogComponent, { 
        width: '90%', 
        maxWidth: '900px',
        data: { taskId: t.id, materiaNombre: this.getMateriaNombre(t.classId) } 
      });
    } else {
      this.dialog.open(TaskDetailDialogComponent, { 
        width: '500px', 
        data: { taskId: t.id, materiaNombre: this.getMateriaNombre(t.classId) } 
      });
    }
  }

  verDetalleTarea(tarea: any, materiaNombre: string) {
    const taskId = tarea.taskId;
    if (this.role === 'teacher') {
      this.dialog.open(TaskDetailTeacherDialogComponent, { 
        width: '90%', 
        maxWidth: '900px',
        data: { taskId: taskId, materiaNombre: materiaNombre } 
      });
    } else {
      this.dialog.open(TaskDetailDialogComponent, { 
        width: '500px', 
        data: {
          taskId: taskId,
          materiaNombre: materiaNombre,
          studentId: this.currentUserId,
          nota: tarea.nota,
          estado: tarea.estado,
          entregada: tarea.entregada,
          observaciones: tarea.observaciones
        } 
      });
    }
  }

  limpiarFiltros() {
    this.searchQuery = '';
    this.filtroMateriaId = 0;
    this.filtroEstado = 'todos';
    this.filtrarTareas();
  }

  onSearchChange() {
    this.filtrarTareas();
  }

  onMateriaChange() {
    this.filtroMateriaId = Number(this.filtroMateriaId);
    this.filtrarTareas();
  }

  toggleUserSelector() {
    this.showUserSelector = !this.showUserSelector;
    if (this.showUserSelector && this.students.length === 0) {
      this.cargarEstudiantes();
    }
  }

  getUsersList() {
    return [...this.teachers, ...this.students];
  }
}
