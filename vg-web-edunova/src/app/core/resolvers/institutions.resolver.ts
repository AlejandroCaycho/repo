import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { InstitucionService } from '../services/auth/institucion.service';
import { Institucion } from '../interfaces/auth.interface';

export const institutionsResolver: ResolveFn<Institucion[]> = () => {
  return inject(InstitucionService).listar();
};
