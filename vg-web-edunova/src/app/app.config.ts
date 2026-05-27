import { ApplicationConfig, ErrorHandler, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { LUCIDE_ICONS, LucideIconProvider } from 'lucide-angular';
import { Award } from 'lucide-angular';


import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { academicContextInterceptor } from './core/interceptors/academic-context.interceptor';
import { GlobalErrorHandler } from './core/errors/global-error.handler';
import {
  GraduationCap, Mail, Lock, Eye, EyeOff, LockKeyhole, ShieldCheck, ChevronLeft,
  Shield, KeyRound, CheckCircle, Check, Building, User, Phone, LogIn,
  Search, LayoutGrid, List, Edit, Pause, Play, Trash, MapPin, RotateCcw,
  ChevronDown, ChevronRight, ChevronUp, X, Users, UserCheck, UserX, Globe,
  Filter, Plus, ChevronFirst, ChevronLast, CheckSquare, Square, Key, Layers,
  AlertTriangle, Power, XCircle, Settings, FileText, Calendar, CalendarDays,
  BookOpen, Bell, BellDot, ShieldAlert, RotateCcwKey, UserPlus, LoaderCircle,
  CheckCheck, IdCard, AlertCircle, Briefcase, Clock
} from 'lucide-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor, academicContextInterceptor])),
    provideAnimations(),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    {
      provide: LUCIDE_ICONS,
      useValue: new LucideIconProvider({
        GraduationCap, Mail, Lock, Eye, EyeOff, LockKeyhole, ShieldCheck,
        ChevronLeft, Shield, KeyRound, CheckCircle, Check, Building, User,
        Phone, LogIn, Search, LayoutGrid, List, Edit, Pause, Play, Trash,
        MapPin, RotateCcw, ChevronDown, ChevronRight, ChevronUp, X, Users,
        UserCheck, UserX, Globe, Filter, Plus, ChevronFirst, ChevronLast,
        CheckSquare, Square, Key, Layers, AlertTriangle, Power, XCircle,
        Settings, FileText, Calendar, CalendarDays, BookOpen, Bell, BellDot,
        ShieldAlert, RotateCcwKey, UserPlus, LoaderCircle, CheckCheck, IdCard, 
        AlertCircle, Award, Briefcase, Clock
      })
    }
  ]
};
