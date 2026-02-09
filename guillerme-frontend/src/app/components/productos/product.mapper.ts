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
  const img1 = toAbsoluteImgUrl(p.imgUrl);
  const img2 = toAbsoluteImgUrl((p as any).imgUrl2); // si tu dto ya lo tiene, sacá el as any
  const img3 = toAbsoluteImgUrl((p as any).imgUrl3);

  const imagenes = [img1, img2, img3].filter(Boolean);

  return {
    id: p.id,
    nombre: p.nombre,
    descripcionCorta: p.descripcionCorta ?? '',
    infoModal: p.infoModal ?? p.descripcionCorta ?? '',

    img: img1,            // para compatibilidad
    imgUrl: img1,         // ✅
    imgUrl2: img2 || '',
    imgUrl3: img3 || '',

    imagenes,             // ✅ thumbs

    categorias: parseStringList(p.categorias),
    servicios: parseStringList(p.servicios),
    keywords: parseStringList(p.keywords),

    stock: p.stock,
    precio: Number(p.precio ?? 0),

    colores: [],
    variantes: [],
  } as Product;
}
