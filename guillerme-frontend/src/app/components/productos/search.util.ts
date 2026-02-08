import { Product } from './product.model';

const norm = (s: string) =>
  (s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export function filterProducts(
  products: Product[],
  q: string,
  categoria?: string,
  servicio?: string
): Product[] {
  const query = norm(q);
  const tokens = query ? query.split(' ').filter(Boolean) : [];

  return products.filter((p) => {
    const hayCategoria =
      !categoria || (p.categorias ?? []).some((c) => norm(c) === norm(categoria));

    const hayServicio =
      !servicio || (p.servicios ?? []).some((s) => norm(s) === norm(servicio));

    if (!hayCategoria || !hayServicio) return false;

    if (!tokens.length) return true;

    const bag = [
      p.nombre,
      p.descripcionCorta,
      p.infoModal ?? '',
      ...(p.keywords ?? []),
      ...(p.categorias ?? []),
      ...(p.servicios ?? []),
      ...(p.variantes ?? []).map((v) => v.label),
    ]
      .map(norm)
      .join(' ');

    // ✅ cada token debe estar presente en algún lado
    return tokens.every((t) => bag.includes(t));
  });
}
