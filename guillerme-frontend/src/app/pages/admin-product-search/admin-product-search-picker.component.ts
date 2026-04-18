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
        this.results.set(res ?? []);
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
}