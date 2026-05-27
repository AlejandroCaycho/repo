import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export const academicContextInterceptor: HttpInterceptorFn = (req, next) => {
  const urls = [environment.api.academic, environment.api.student, environment.api.task];
  const shouldTag = urls.some(url => req.url.startsWith(url));

  if (!shouldTag) return next(req);

  return next(req.clone({
    setHeaders: {
      Accept: 'application/json'
    }
  }));
};
