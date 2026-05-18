export type ProductColor = 'ladrillo' | 'azul' | 'celeste';
export type ProductServiceType = 'SUBLIMABLE' | 'DTF' | 'SERIGRAFIA' | 'VINILO';

export interface ProductVariant {
  key: string;        // ej: "300ml", "Adultos", "Niños"
  label: string;      // texto que ves en el modal
}

export interface Product {
  id: number;
  nombre: string;
  descripcionCorta?: string;
  infoModal?: string;

  img: string;
  imgUrl?: string;
  imgUrl2?: string;
  imgUrl3?: string;
  imagenes?: string[];

  barcode?: string | null;
  categorias?: string[];
  servicios?: string[];
  keywords?: string[];

  stock?: number;
  precio?: number;

  activo?: boolean;
  estado?: boolean;

  colores?: any[];
  variantes?: any[];
}

