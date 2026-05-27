import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../../core/services/auth/auth.service';
import { Institucion } from '../../../core/interfaces/auth.interface';
import { extractAuthError } from '../../../core/handlers/auth-error.handler';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class Register {
  private readonly fb = inject(FormBuilder);
  private readonly authSvc = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly cargando = signal(false);
  readonly errorMsg = signal('');
  readonly instituciones = signal<Institucion[]>(this.route.snapshot.data['institutions'] ?? []);
  readonly verContrasena = signal(false);

  readonly form = this.fb.group({
    institucionId: [null as number | null, [Validators.required]],
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    contrasena: ['', [Validators.required, Validators.minLength(8)]],
    telefono: ['']
  });

  toggleContrasena(): void {
    this.verContrasena.update(v => !v);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.form.value;
    this.cargando.set(true);
    this.errorMsg.set('');

    this.authSvc.register(payload).subscribe({
      next: () => {
        this.cargando.set(false);
        Swal.fire({
          title: '¡Registro Exitoso!',
          text: 'Tu cuenta ha sido creada. Ahora puedes iniciar sesión.',
          icon: 'success',
          confirmButtonColor: '#165EF0'
        }).then(() => {
          this.router.navigate(['/auth/login']);
        });
      },
      error: (err) => {
        this.cargando.set(false);
        this.errorMsg.set(extractAuthError(err));
      }
    });
  }
}
