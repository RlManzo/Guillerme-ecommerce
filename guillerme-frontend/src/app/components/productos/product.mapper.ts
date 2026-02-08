import { Product } from './product.model';
import { ProductResponseDto } from './product-response.dto';

function parseStringList(input?: string | null): string[] {
  if (!input) return [];

  const raw = input.trim();
  if (!raw) return [];

  // Si viene como JSON string: '["Tazas","Remeras"]'
  if (raw.startsWith('[')) {
    try {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr))
        return arr.map(String).map((s) => s.trim()).filter(Boolean);
    } catch {
      // cae al CSV
    }
  }

  // CSV: "Tazas, Remeras" o "Tazas;Remeras"
  return raw
    .split(/[,;|]/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

//hace absoluta la url si viene como "/uploads/..."
function toAbsoluteImgUrl(path?: string | null): string {
  if (!path) return '';
  const s = String(path).trim();
  if (!s) return '';

  if (s.startsWith('http://') || s.startsWith('https://')) return s;

  // Si viene "/uploads/..." lo resolvemos contra el host actual
  if (s.startsWith('/')) return `${window.location.origin}${s}`;

  return s;
}

export function mapProductFromApi(p: ProductResponseDto): Product {
  const img = toAbsoluteImgUrl(p.imgUrl);

  return {
    id: p.id,
    nombre: p.nombre,
    descripcionCorta: p.descripcionCorta ?? '',
    infoModal: p.infoModal ?? p.descripcionCorta ?? '',
    img,

    categorias: parseStringList(p.categorias),
    servicios: parseStringList(p.servicios),
    keywords: parseStringList(p.keywords),

    stock: p.stock,

    imagenes: img ? [img] : [],
    colores: [],
    variantes: [],
    precio: Number(p.precio ?? 0),
  } as Product;
}
