import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../../core/services/auth/auth.service';
import { extractAuthError } from '../../../core/handlers/auth-error.handler';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss'
})
export class ForgotPassword {
  private readonly fb = inject(FormBuilder);
  private readonly authSvc = inject(AuthService);

  readonly cargando = signal(false);
  readonly enviado = signal(false);
  readonly errorMsg = signal('');

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email } = this.form.value;
    if (!email) return;

    this.cargando.set(true);
    this.errorMsg.set('');
    this.authSvc.forgotPassword(email).subscribe({
      next: () => {
        this.cargando.set(false);
        this.enviado.set(true);
      },
      error: (err) => {
        this.cargando.set(false);
        this.errorMsg.set(extractAuthError(err));
      }
    });
  }
}
