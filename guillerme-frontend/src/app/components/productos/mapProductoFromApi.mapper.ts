import { Product } from './product.model';

function splitToList(raw: any): string[] {
  const s = String(raw ?? '').trim();
  if (!s) return [];
  return s.split(/[,;|\n]/g).map(x => x.trim()).filter(Boolean);
}

// dto = fila de /api/products
export function mapProductFromApi(dto: any): Product {
  return {
    id: dto.id,
    nombre: dto.nombre,
    img: dto.img_url ?? dto.img ?? '',
    descripcionCorta: dto.descripcion_corta ?? dto.descripcionCorta ?? '',
    infoModal: dto.info_modal ?? dto.infoModal ?? '',

    categorias: splitToList(dto.categorias),
    keywords: splitToList(dto.keywords),
    stock: Number(dto.stock ?? 0),
    precio: Number(dto.precio ?? 0),

    // si tu Product tiene más campos, dejalos opcionales o mapealos acá
    servicios: splitToList(dto.servicios) as any,  // si lo tenés como array real, mejor adaptarlo
    variantes: [], // si no viene de BD
  } as Product;
}
