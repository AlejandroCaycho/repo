import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../../core/services/auth/auth.service';
import { extractAuthError } from '../../../core/handlers/auth-error.handler';
import Swal from 'sweetalert2';

const REMEMBER_KEY = 'remembered_email';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly authSvc = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly cargando = signal(false);
  readonly verContrasena = signal(false);
  readonly recordarEmail = signal(localStorage.getItem(REMEMBER_KEY) !== null);

  readonly form = this.fb.group({
    email: [localStorage.getItem(REMEMBER_KEY) || '', [Validators.required, Validators.email]],
    contrasena: ['', [Validators.required]]
  });

  toggleContrasena(): void {
    this.verContrasena.update(v => !v);
  }

  toggleRecordar(): void {
    this.recordarEmail.update(v => !v);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, contrasena } = this.form.value;
    if (!email || !contrasena) return;

    if (this.recordarEmail()) {
      localStorage.setItem(REMEMBER_KEY, email);
    } else {
      localStorage.removeItem(REMEMBER_KEY);
    }

    this.cargando.set(true);
    this.authSvc.login(email, contrasena).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
        this.router.navigateByUrl(returnUrl);
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        Swal.fire({
          title: 'Error al Iniciar Sesión',
          text: extractAuthError(err),
          icon: 'error',
          confirmButtonColor: '#165EF0'
        });
      }
    });
  }
}
