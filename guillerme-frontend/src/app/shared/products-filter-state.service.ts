import { Injectable, signal } from '@angular/core';

export type ProductsCategory = 'all' | 'libreria' | 'combos' | 'varios';

@Injectable({ providedIn: 'root' })
export class ProductsFilterStateService {
  readonly category = signal<ProductsCategory>('all');

  setCategory(cat: ProductsCategory) {
    this.category.set(cat);
  }

  reset() {
    this.category.set('all');
  }
}
