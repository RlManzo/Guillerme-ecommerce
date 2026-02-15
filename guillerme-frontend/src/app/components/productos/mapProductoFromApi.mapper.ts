import { Product } from './product.model';

function splitToList(raw: any): string[] {
  const s = String(raw ?? '').trim();
  if (!s) return [];
  return s.split(/[,;|\n]/g).map(x => x.trim()).filter(Boolean);
}

function toAbsoluteImgUrl(path?: string | null): string {
  if (!path) return '';
  const s = String(path).trim();
  if (!s) return '';
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  if (s.startsWith('/')) return `${window.location.origin}${s}`;
  return s;
}

export function mapProductFromApi(p: any): Product {
  const img1 = toAbsoluteImgUrl(p.imgUrl);
  const img2 = toAbsoluteImgUrl(p.imgUrl2);
  const img3 = toAbsoluteImgUrl(p.imgUrl3);

  const imagenes = [img1, img2, img3].filter(Boolean);

  return {
    id: p.id,
    nombre: p.nombre,
    descripcionCorta: p.descripcionCorta ?? '',
    infoModal: p.infoModal ?? p.descripcionCorta ?? '',

    img: img1 || imagenes[0] || '',
    imagenes,

    imgUrl: img1,
    imgUrl2: img2 || undefined,
    imgUrl3: img3 || undefined,

    categorias: splitToList(p.categorias),
    servicios: splitToList(p.servicios),
    keywords: splitToList(p.keywords),
    stock: p.stock,
    precio: Number(p.precio ?? 0),

    // ✅ CLAVE
    estado: p.estado ?? true,

    colores: [],
    variantes: [],
  } as Product;
}


