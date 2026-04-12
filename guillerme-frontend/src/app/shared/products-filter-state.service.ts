import { Injectable, computed, signal } from '@angular/core';

export type ProductsCategory = 'all' | 'libreria' | 'combos' | 'varios';

export type ProductsBrand =
  | 'all'
  | 'Filgo'
  | 'Skycolor'
  | 'Olami'
  | 'C-B-X'
  | 'FW'
  | 'Keyroad'
  | 'Ibicraft';

type ProductsFilterState = {
  category: ProductsCategory;
  brand: ProductsBrand;
  version: number;
};

@Injectable({ providedIn: 'root' })
export class ProductsFilterStateService {
  private readonly _state = signal<ProductsFilterState>({
    category: 'all',
    brand: 'all',
    version: 0,
  });

  readonly state = this._state.asReadonly();

  readonly category = computed(() => this._state().category);
  readonly brand = computed(() => this._state().brand);

  setCategory(category: ProductsCategory) {
    this._state.update((s) => ({
      ...s,
      category,
      version: s.version + 1,
    }));
  }

  setBrand(brand: ProductsBrand) {
    this._state.update((s) => ({
      ...s,
      brand,
      version: s.version + 1,
    }));
  }

  setFilters(category: ProductsCategory, brand: ProductsBrand = 'all') {
    this._state.update((s) => ({
      category,
      brand,
      version: s.version + 1,
    }));
  }

  reset() {
    this._state.update((s) => ({
      category: 'all',
      brand: 'all',
      version: s.version + 1,
    }));
  }
}