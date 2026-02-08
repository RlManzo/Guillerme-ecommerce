import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CarouselServicios } from './carousel-servicios';

describe('CarouselServicios', () => {
  let component: CarouselServicios;
  let fixture: ComponentFixture<CarouselServicios>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CarouselServicios]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CarouselServicios);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
