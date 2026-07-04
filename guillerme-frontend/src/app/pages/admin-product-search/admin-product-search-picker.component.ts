import {
  Component,
  EventEmitter,
  Output,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AdminProductsApi,
  ProductResponse,
} from '../../shared/admin/admin-products.api';

@Component({
  standalone: true,
  selector: 'app-admin-product-search-picker',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-product-search-picker.component.html',
  styleUrl: './admin-product-search-picker.component.scss',
})
export class AdminProductSearchPickerComponent {
  private readonly api = inject(AdminProductsApi);

  @Output() productSelected = new EventEmitter<ProductResponse>();

  query = signal('');
  loading = signal(false);
  results = signal<ProductResponse[]>([]);

  onSearch(value: string) {
    this.query.set(value);

    const q = value.trim();

    if (q.length < 2) {
      this.results.set([]);
      this.loading.set(false);
      return;
    }

    this.loading.set(true);

    this.api.search(q).subscribe({
      next: (res) => {
        this.loading.set(false);

        const filtered = this.rankAndFilterProducts(res ?? [], q);

        this.results.set(filtered);
      },
      error: () => {
        this.loading.set(false);
        this.results.set([]);
      },
    });
  }

  selectProduct(product: ProductResponse) {
    this.productSelected.emit(product);
    this.query.set('');
    this.results.set([]);
  }

  private rankAndFilterProducts(
    products: ProductResponse[],
    rawTerm: string
  ): ProductResponse[] {
    const term = this.normalize(rawTerm);

    if (!term) {
      return [];
    }

    return products
      .map((product) => {
        const score = this.getProductScore(product, term);

        return {
          product,
          score,
        };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }

        const nameA = this.normalize((a.product as any).nombre);
        const nameB = this.normalize((b.product as any).nombre);

        return nameA.localeCompare(nameB);
      })
      .map((item) => item.product);
  }

  private getProductScore(product: ProductResponse, term: string): number {
    const p: any = product;

    const nombre = this.normalize(p.nombre);
    const marca = this.normalize(p.marca);
    const barcode = this.normalize(p.barcode);
    const codigo = this.normalize(p.codigo);

    /**
     * Coincidencias exactas fuertes
     */
    if (barcode && barcode === term) {
      return 100;
    }

    if (codigo && codigo === term) {
      return 95;
    }

    if (marca && marca === term) {
      return 90;
    }

    /**
     * Palabra exacta dentro del nombre.
     * Ej: "Lapicera Bic Azul" matchea con "bic".
     */
    if (this.hasExactWord(nombre, term)) {
      return 80;
    }

    /**
     * Nombre que empieza con el término.
     * Ej: "Bic Cristal Azul".
     */
    if (nombre.startsWith(term)) {
      return 70;
    }

    /**
     * Para términos cortos no usamos contains libre.
     * Esto evita que "bic" traiga cosas demasiado parecidas.
     */
    if (term.length <= 3) {
      return 0;
    }

    /**
     * Búsqueda parcial solo como fallback para términos más largos.
     */
    if (nombre.includes(term)) {
      return 40;
    }

    if (marca.includes(term)) {
      return 35;
    }

    return 0;
  }

  private normalize(value: string | null | undefined): string {
    return String(value ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  private hasExactWord(text: string, term: string): boolean {
    if (!text || !term) {
      return false;
    }

    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    /**
     * Separa por espacios, guiones, barras, puntos, comas, paréntesis, etc.
     */
    const regex = new RegExp(
      `(^|[\\s\\-_/.,;:()\\[\\]])${escaped}($|[\\s\\-_/.,;:()\\[\\]])`,
      'i'
    );

    return regex.test(text);
  }
}