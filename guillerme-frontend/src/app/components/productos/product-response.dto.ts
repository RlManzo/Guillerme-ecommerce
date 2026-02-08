export interface ProductResponseDto {
  id: number;
  nombre: string;
  descripcionCorta?: string | null;
  infoModal?: string | null;
  imgUrl?: string | null;

  // vienen como string (CSV o JSON string)
  categorias?: string | null;
  servicios?: string | null;
  keywords?: string | null;

  activo: boolean;
  stock: number;
  precio: number;
}
