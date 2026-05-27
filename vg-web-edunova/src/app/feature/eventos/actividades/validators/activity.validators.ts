import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// ── 1. Solo texto ─────────────────────────────────────────────
// Permite: letras, espacios, tildes y guiones.
export const soloTextoValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const v = control.value;
  if (!v || v === '') return null;
  const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-]+$/;
  return regex.test(v) ? null : { soloTexto: true };
};

// ── 2. Hora fin > hora inicio (validador de grupo) ────────────
// El grupo debe tener los controles 'horaInicio' y 'horaFin'.
export const horaFinMayorValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const inicio = group.get('horaInicio')?.value;
  const fin    = group.get('horaFin')?.value;
  if (!inicio || !fin || fin === '') return null;
  return fin > inicio ? null : { horaFinMenor: true };
};

// ── 3. Fecha fin >= fecha inicio (validador de grupo) ─────────
// El grupo debe tener los controles 'fechaInicio' y 'fechaFin'.
export const fechaFinMayorIgualValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const inicio = group.get('fechaInicio')?.value;
  const fin    = group.get('fechaFin')?.value;
  if (!inicio || !fin || fin === '') return null;
  return fin >= inicio ? null : { fechaFinAnterior: true };
};

// ── 4. Fecha >= hoy ───────────────────────────────────────────
// Usado en: fechaInscripcion, fechaEvento
export const fechaFuturaValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const v = control.value;
  if (!v || v === '') return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fecha = new Date(v + 'T00:00:00');
  return fecha >= hoy ? null : { fechaPasada: true };
};

// ── 5. Monto sin ceros a la izquierda ─────────────────────────
// Acepta: 0, enteros positivos y decimales. Rechaza: 01, 007, etc.
export const montoReferencialValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const v = control.value;
  if (v === null || v === undefined || v === '') return null;
  const str = String(v);
  const regex = /^(0|[1-9]\d*)(\.\d+)?$/;
  return regex.test(str) ? null : { cerosIzquierda: true };
};
