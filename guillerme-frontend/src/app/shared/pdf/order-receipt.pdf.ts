import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type MoneyLike = number | string | null | undefined;

function toNumber(v: MoneyLike): number {
  const n = typeof v === 'string' ? Number(v) : (v ?? 0);
  return Number.isFinite(n as number) ? (n as number) : 0;
}

function moneyARS(n: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(n);
}

// ✅ helper afuera (no adentro de la función)
function loadImageAsDataURL(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext('2d');
      if (!ctx) return reject('no ctx');
      ctx.drawImage(img, 0, 0);
      resolve(c.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = url;
  });
}

export async function downloadPaidOrderPdf(order: any) {
  // A4 horizontal
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const orderId = order?.id ?? '';
  const status = (order?.status ?? 'PAGADO').toString().toUpperCase();

  // ✅ Branding (ajustá estos 2)
  const BRAND_NAME = 'Librería Guillerme Guillerme';
  const BRAND_LOGO = 'assets/sinfondo-guillerme.png'; // <-- poné tu logo blanco/negro acá

  // ✅ Cabecera derecha: logo + nombre ecommerce (chiquito)
    try {
    const dataUrl = await loadImageAsDataURL(BRAND_LOGO);

    const pageW = doc.internal.pageSize.getWidth();
    const rightMargin = 14;

    const logoW = 18; // mm
    const logoH = 16; // mm

    const logoX = pageW - rightMargin - logoW;
    const logoY = 2;

    // logo
    doc.addImage(dataUrl, 'PNG', logoX, logoY, logoW, logoH);

    // texto debajo del logo
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    const textY = logoY + logoH + 2; // 4mm abajo del logo
    // centrado respecto al logo:
    doc.text(BRAND_NAME, logoX + logoW / 2, textY, { align: 'center' });
  } catch {
    // si no carga el logo, no rompemos el PDF
  }

  // ======= TÍTULO =======
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(`Pedido nro#${orderId}  estado: ${status}`, 14, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const createdAt = order?.createdAt ? new Date(order.createdAt) : null;
  if (createdAt) {
    doc.text(`Fecha: ${createdAt.toLocaleString('es-AR')}`, 14, 20);
  }

  // ======= ITEMS =======
  const items: any[] = Array.isArray(order?.items) ? order.items : [];

  // IMPORTANTE: para que esto funcione perfecto,
  // cada item debe traer unitPrice (o lo que definas) desde el backend.
  const rows = items.map((it) => {
    const qty = toNumber(it?.qty);
    const nombre = (it?.productNombre ?? it?.nombre ?? '-').toString();
    const unit = toNumber(it?.unitPrice); // <-- asegurate que exista
    return {
      qty,
      nombre,
      unit,
      lineTotal: qty * unit,
    };
  });

  const totalItems = rows.reduce((acc, r) => acc + r.qty, 0);
  const totalPrice = rows.reduce((acc, r) => acc + r.lineTotal, 0);

  const body = rows.map((r) => [String(r.qty), r.nombre, moneyARS(r.unit)]);

  // fila final (totales)
  body.push([`TOTAL: ${totalItems}`, '', `TOTAL: ${moneyARS(totalPrice)}`]);

  autoTable(doc, {
    startY: 26,
    head: [['Cantidad productos', 'Detalle del producto', 'Valor individual']],
    body,
    styles: { font: 'helvetica', fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [230, 230, 230], textColor: 20 },
    columnStyles: {
      0: { cellWidth: 45 },
      1: { cellWidth: 180 },
      2: { cellWidth: 55, halign: 'right' },
    },
    didParseCell: (data) => {
      const isLast = data.row.index === body.length - 1;
      if (isLast) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [245, 245, 245];
      }
    },
  });

  // ======= DATOS CLIENTE (debajo de tabla) =======
  const finalY = (doc as any).lastAutoTable?.finalY ?? 26;
  let y = finalY + 10;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Datos del cliente', 14, y);

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const nombre = `${order?.customerNombre ?? ''} ${order?.customerApellido ?? ''}`.trim();
  const email = (order?.customerEmail ?? order?.userEmail ?? '').toString();
  const tel = (order?.customerTelefono ?? '').toString();
  const dir = (order?.customerDireccion ?? '').toString();

  const lines = [
    `Nombre: ${nombre || '-'}`,
    `Email: ${email || '-'}`,
    `Teléfono: ${tel || '-'}`,
    `Dirección: ${dir || '-'}`,
  ];

  lines.forEach((line) => {
    doc.text(line, 14, y);
    y += 5;
  });

  if (order?.comment) {
    y += 2;
    doc.setFont('helvetica', 'bold');
    doc.text('Comentario:', 14, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.text(String(order.comment), 14, y);
  }

  // Descargar
  doc.save(`pedido_${orderId}_${status}.pdf`);
}
