import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SearchStateService {
  readonly query = signal<string>('');

  setQuery(value: string) {
    this.query.set(value ?? '');
  }

  clear() {
    this.query.set('');
  }
}
