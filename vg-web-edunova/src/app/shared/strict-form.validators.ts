import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const EMPTY_VALUES = [null, undefined, ''];

function asText(value: unknown): string {
  return String(value ?? '');
}

function optional(value: unknown): boolean {
  return EMPTY_VALUES.includes(value as any) || asText(value).trim() === '';
}

function normalizedPhone(value: string): string {
  return value.replace(/[\s().-]/g, '');
}

export function trimRequired(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = asText(control.value);
    return value.trim().length ? null : { required: true };
  };
}

export function strictText(options: {
  min?: number;
  max?: number;
  pattern?: RegExp;
  allowEmpty?: boolean;
  patternError?: string;
} = {}): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = asText(control.value);
    if (optional(value)) return options.allowEmpty ? null : { required: true };
    if (value !== value.trim()) return { espaciosBorde: true };
    if (/\s{2,}/.test(value)) return { espaciosDobles: true };
    if (options.min && value.length < options.min) return { minlength: { requiredLength: options.min, actualLength: value.length } };
    if (options.max && value.length > options.max) return { maxlength: { requiredLength: options.max, actualLength: value.length } };
    if (options.pattern && !options.pattern.test(value)) return { pattern: { requiredPattern: options.patternError || options.pattern.source } };
    return null;
  };
}

export function strictEmail(allowEmpty = true): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = asText(control.value).trim();
    if (!value) return allowEmpty ? null : { required: true };
    if (value.length > 120) return { maxlength: { requiredLength: 120, actualLength: value.length } };
    if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(value)) return { email: true };
    if (value.includes('..') || value.startsWith('.') || value.includes('@.') || value.endsWith('.')) return { email: true };
    return null;
  };
}

export function peruPhone(options: { required?: boolean; allowLandline?: boolean } = {}): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const raw = asText(control.value);
    if (optional(raw)) return options.required ? { required: true } : null;
    const value = normalizedPhone(raw);
    const mobile = /^9\d{8}$/.test(value);
    const landline = options.allowLandline
      ? /^(?:0(?:1\d{7}|[2-8]\d{6,7}))$/.test(value)
      : false;
    return mobile || landline ? null : { telefonoPeru: true };
  };
}

export function peruCodigoModular(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = asText(control.value).trim();
    if (!value) return null;
    return /^\d{7}$/.test(value) ? null : { codigoModularPeru: true };
  };
}

export function peruCodigoPostal(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = asText(control.value).trim();
    if (!value) return null;
    return /^\d{5}$/.test(value) ? null : { codigoPostalPeru: true };
  };
}

export function httpsUrl(allowEmpty = true): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = asText(control.value).trim();
    if (!value) return allowEmpty ? null : { required: true };
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && !!url.hostname.includes('.') ? null : { httpsUrl: true };
    } catch {
      return { httpsUrl: true };
    }
  };
}

export function strongPassword(required = false): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = asText(control.value);
    if (!value) return required ? { required: true } : null;
    if (value.length < 10 || value.length > 72) return { passwordFuerte: true };
    if (!/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/\d/.test(value) || !/[^A-Za-z0-9]/.test(value)) {
      return { passwordFuerte: true };
    }
    if (/\s/.test(value)) return { passwordFuerte: true };
    return null;
  };
}

export function uppercaseCode(options: { allowEmpty?: boolean; min?: number; max?: number } = {}): ValidatorFn {
  return strictText({
    allowEmpty: options.allowEmpty,
    min: options.min,
    max: options.max,
    pattern: /^[A-Z][A-Z0-9_]*$/,
    patternError: 'MAYUSCULAS_NUMEROS_GUION_BAJO',
  });
}
