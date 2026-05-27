import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Calendar, BookOpen } from 'lucide-angular';

import { TutoriasComponent } from './tutorias/pages/tutorias.component';
import { ActividadesComponent } from './actividades/pages/actividades.component';

type Tab = 'tutorias' | 'actividades';

@Component({
  selector: 'app-eventos',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, TutoriasComponent, ActividadesComponent],
  templateUrl: './eventos.html',
  styleUrl: './eventos.scss',
})
export class EventosComponent {
  readonly Calendar = Calendar;
  readonly BookOpen = BookOpen;

  activeTab = signal<Tab>('tutorias');

  setTab(tab: Tab): void {
    this.activeTab.set(tab);
  }
}
