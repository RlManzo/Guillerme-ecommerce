import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLogged()) {
    router.navigateByUrl('/login');
    return false;
  }

  if (!auth.isAdmin()) {
    router.navigateByUrl('/');
    return false;
  }

  return true;
};
