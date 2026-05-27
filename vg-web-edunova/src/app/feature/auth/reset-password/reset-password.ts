import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../../core/services/auth/auth.service';
import { extractAuthError } from '../../../core/handlers/auth-error.handler';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss'
})
export class ResetPassword implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authSvc = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly cargando = signal(false);
  readonly errorMsg = signal('');
  readonly token = signal('');
  readonly verContrasena = signal(false);

  readonly form = this.fb.group({
    nuevaContrasena: ['', [Validators.required, Validators.minLength(8)]]
  });

  ngOnInit(): void {
    const t = this.route.snapshot.queryParams['token'] || this.route.snapshot.params['token'];
    if (!t) {
      Swal.fire({
        title: 'Token Inválido',
        text: 'No se ha encontrado un token válido de recuperación. Por favor, solicita uno nuevo.',
        icon: 'error',
        confirmButtonColor: '#165EF0'
      }).then(() => {
        this.router.navigate(['/auth/forgot-password']);
      });
    } else {
      this.token.set(t);
    }
  }

  toggleContrasena(): void {
    this.verContrasena.update(v => !v);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { nuevaContrasena } = this.form.value;
    const tokenStr = this.token();
    if (!nuevaContrasena || !tokenStr) return;

    this.cargando.set(true);
    this.errorMsg.set('');
    this.authSvc.resetPassword(tokenStr, nuevaContrasena).subscribe({
      next: () => {
        this.cargando.set(false);
        Swal.fire({
          title: 'Contraseña Restablecida',
          text: 'Tu contraseña ha sido restablecida correctamente. Ya puedes iniciar sesión.',
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
