export type ProductColor = 'ladrillo' | 'azul' | 'celeste';
export type ProductServiceType = 'SUBLIMABLE' | 'DTF' | 'SERIGRAFIA' | 'VINILO';

export interface ProductVariant {
  key: string;        // ej: "300ml", "Adultos", "Niños"
  label: string;      // texto que ves en el modal
}

export interface Product {
  id: number;
  nombre: string;
  descripcionCorta: string;      // para cards o subtítulo del modal
  infoModal?: string;            // texto adicional
  img: string;                   // principal
  imagenes?: string[];           // thumbs
  colores?: ProductColor[];       // los 3 puntitos
  servicios?: ProductServiceType[]; // tags para filtro y modal
  variantes?: ProductVariant[];   // chips (talles/ml/etc)
  categorias?: string[];          // "Tazas", "Remeras", etc
  keywords?: string[];            // para buscador (sinónimos)
  stock?: number;
  precio?: number;
}


