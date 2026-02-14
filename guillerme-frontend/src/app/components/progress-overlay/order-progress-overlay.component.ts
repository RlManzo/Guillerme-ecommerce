import { Component, Input } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';

@Component({
  selector: 'app-order-progress-overlay',
  standalone: true,
  imports: [NgIf, NgFor],
  templateUrl: './order-progress-overlay.component.html',
  styleUrl: './order-progress-overlay.component.scss',
})
export class OrderProgressOverlayComponent {
  /** 0,1,2 */
  @Input() step = 0;

  readonly steps = [
    'Procesando pedido',
    'Confirmando stock',
    'Aceptando pedido',
  ];

  progressPercent(): number {
    // 0 -> 10%, 1 -> 55%, 2 -> 100% (se ve mejor que 0/50/100)
    return this.step === 0 ? 10 : this.step === 1 ? 55 : 100;
  }

  isDone(i: number) {
    return i < this.step;
  }

  isActive(i: number) {
    return i === this.step;
  }
}
