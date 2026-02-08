import { Injectable } from '@angular/core';
import Toastify from 'toastify-js';

@Injectable({ providedIn: 'root' })
export class ToastService {
  success(text: string) {
    Toastify({
      text,
      duration: 2000,
      gravity: 'bottom',
      position: 'right',
      close: false,
      stopOnFocus: true,
      // mismos colores del sitio
      style: {
        background: 'linear-gradient(247deg, rgba(37,177,86,0.67) 0%, rgba(44,205,14,1) 100%)',
        color: '#fff',
        }
    }).showToast();
  }

  error(text: string) {
    Toastify({
      text,
      duration: 2500,
      gravity: 'top',
      position: 'right',
      style: {
        background: '#EA5534',
        color: '#FFFFFF',
        borderRadius: '12px',
        fontFamily: 'Inter, sans-serif',
      },
    }).showToast();
  }
}
