import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import {
  LucideAngularModule,
  Home,
  Calendar,
  BookOpen,
  CheckSquare,
  ClipboardList,
  X,
  Menu,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Users,
  FileText,
  Settings,
  Shield,
  Key,
  Building,
  Activity,
  LogOut,
  User as UserIcon,
  GraduationCap,
  History,
  Layers,
  MessageSquare,
  PenTool,
  CalendarDays,
  Building2
} from 'lucide-angular';
import { AuthService } from '../../core/services/auth/auth.service';
import { UsuarioAuthService } from '../../core/services/auth/usuario-auth.service';
import Swal from 'sweetalert2';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
  open: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ height: 0, opacity: 0, overflow: 'hidden' }),
        animate('200ms ease-out', style({ height: '*', opacity: 1 }))
      ]),
      transition(':leave', [
        style({ height: '*', opacity: 1, overflow: 'hidden' }),
        animate('150ms ease-in', style({ height: 0, opacity: 0 }))
      ])
    ])
  ]
})
export class SidebarComponent {
  private readonly authSvc = inject(AuthService);
  private readonly usuarioAuthSvc = inject(UsuarioAuthService);
  private readonly router = inject(Router);

  readonly fotoBlobUrl = signal<string | null>(null);

  private cargarFoto(uuid: string): void {
    this.usuarioAuthSvc.obtenerFoto(uuid).subscribe({
      next: blob => this.fotoBlobUrl.set(URL.createObjectURL(blob)),
      error: () => this.fotoBlobUrl.set(null)
    });
  }

  constructor() {
    effect(() => {
      const u = this.user();
      if (u?.uuid && u.fotoUrl) {
        this.cargarFoto(u.uuid);
      } else {
        this.fotoBlobUrl.set(null);
      }
    });
  }

  readonly Home = Home;
  readonly Calendar = Calendar;
  readonly BookOpen = BookOpen;
  readonly CheckSquare = CheckSquare;
  readonly ClipboardList = ClipboardList;
  readonly X = X;
  readonly Menu = Menu;
  readonly ChevronDown = ChevronDown;
  readonly ChevronRight = ChevronRight;
  readonly ChevronUp = ChevronUp;
  readonly Users = Users;
  readonly FileText = FileText;
  readonly Settings = Settings;
  readonly Shield = Shield;
  readonly Key = Key;
  readonly Building = Building;
  readonly Activity = Activity;
  readonly LogOut = LogOut;
  readonly UserIcon = UserIcon;
  readonly GraduationCap = GraduationCap;
  readonly History = History;
  readonly Layers = Layers;
  readonly MessageSquare = MessageSquare;
  readonly PenTool = PenTool;
  readonly CalendarDays = CalendarDays;
  readonly Building2 = Building2;

  readonly user = this.authSvc.currentUser;
  readonly isCollapsed = signal(false);
  readonly userMenuOpen = signal(false);

  readonly userInitials = computed(() => {
    const u = this.user();
    if (!u) return '??';
    return u.nombre.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  });

  menuGroups = signal<MenuGroup[]>([
    {
      title: 'Inicio', open: true,
      items: [
        { label: 'Tareas', icon: 'CheckSquare', route: '/tasks' },
        { label: 'Dashboard', icon: 'Home', route: '/dashboard' },
        
        { label: 'Agenda', icon: 'Calendar', route: '/agenda' },
      ]
    },
    {
      title: 'Gestión', open: true,
      items: [
        { label: 'Tareas', icon: 'CheckSquare', route: '/tasks' },
      ]
    },
    {
      title: 'Académico', open: true,
      items: [
        { label: 'Clases y Grados', icon: 'BookOpen', route: '/clases' },
        { label: 'Historial de Grados', icon: 'History', route: '/student-grade-history' },
        { label: 'Asistencia', icon: 'CheckSquare', route: '/asistencia' },
        { label: 'Evaluación', icon: 'ClipboardList', route: '/evaluacion' },
        { label: 'Criterios de Evaluación', icon: 'Layers', route: '/evaluation-criteria' },
      ]
    },
    {
      title: 'Comunidad', open: false,
      items: [
        { label: 'Directorio', icon: 'Users', route: '/directorio' },
        { label: 'Eventos', icon: 'Calendar', route: '/eventos' },
      ]
    },
    {
      title: 'Administración', open: false,
      items: [
        { label: 'Personas', icon: 'Users', route: '/persons' }, 
        { label: 'Estudiantes', icon: 'GraduationCap', route: '/students' },
        { label: 'Profesores', icon: 'GraduationCap', route: '/teachers' },
        { label: 'Apoderados', icon: 'Shield', route: '/guardians' },
        { label: 'Asignar Apoderados', icon: 'Users', route: '/student-guardians' },
        { label: 'Escalas de Calificación', icon: 'Settings', route: '/grading-scales' },
        { label: 'Instituciones', icon: 'Building', route: '/instituciones' },
        { label: 'Usuarios', icon: 'Users', route: '/usuarios' },
        { label: 'Roles', icon: 'Shield', route: '/roles' },
        { label: 'Permisos', icon: 'Key', route: '/permisos' },
        { label: 'Auditoría', icon: 'Activity', route: '/audit-logs' },
        { label: 'Reportes', icon: 'FileText', route: '/reportes' },
        { label: 'Configuración', icon: 'Settings', route: '/configuracion' },
      ]
    }
  ]);

  toggleCollapse(): void {
    this.isCollapsed.update(v => !v);
  }

  toggleGroup(index: number): void {
    this.menuGroups.update(groups =>
      groups.map((g, i) => i === index ? { ...g, open: !g.open } : { ...g, open: false })
    );
  }

  toggleUserMenu(): void {
    this.userMenuOpen.update(v => !v);
  }

  closeUserMenu(): void {
    this.userMenuOpen.set(false);
  }

  onProfileClick(): void {
    this.closeUserMenu();
    console.log('Perfil');
  }

  onSettingsClick(): void {
    this.closeUserMenu();
    console.log('Configuración');
  }

  onLogout(): void {
    this.closeUserMenu();
    Swal.fire({
      title: '¿Cerrar sesión?',
      text: 'Estás a punto de salir de la plataforma.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, cerrar sesión',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#64748B'
    }).then(result => {
      if (result.isConfirmed) {
        this.authSvc.logout();
        this.router.navigate(['/auth/login']);
      }
    });
  }

  getIcon(iconName: string) {
    return (this as any)[iconName];
  }
}
