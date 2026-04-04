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

export async function downloadLocalSalePdf(sale: any) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const saleId = sale?.id ?? '';
  const status = (sale?.status ?? 'FINALIZADA').toString().toUpperCase();

  const BRAND_NAME = 'Librería Guillerme Guillerme';
  const BRAND_LOGO = 'assets/sinfondo-guillerme.png';

  try {
    const dataUrl = await loadImageAsDataURL(BRAND_LOGO);

    const pageW = doc.internal.pageSize.getWidth();
    const rightMargin = 14;

    const logoW = 18;
    const logoH = 16;

    const logoX = pageW - rightMargin - logoW;
    const logoY = 2;

    doc.addImage(dataUrl, 'PNG', logoX, logoY, logoW, logoH);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    const textY = logoY + logoH + 2;
    doc.text(BRAND_NAME, logoX + logoW / 2, textY, { align: 'center' });
  } catch {
    // no romper PDF si falla logo
  }

  // título
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(`Venta nro#${saleId}  estado: ${status}`, 14, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const createdAt = sale?.createdAt ? new Date(sale.createdAt) : null;
  if (createdAt) {
    doc.text(`Fecha: ${createdAt.toLocaleString('es-AR')}`, 14, 20);
  }

  // canal de emisión
  doc.setFont('helvetica', 'bold');
  doc.text('Canal de emisión: VENTAS LOCAL ADMIN', 14, 26);

  // items
  const items: any[] = Array.isArray(sale?.items) ? sale.items : [];

  const rows = items.map((it) => {
    const qty = toNumber(it?.qty);
    const nombre = (it?.productNombre ?? it?.nombre ?? '-').toString();
    const unit = toNumber(it?.unitPrice);
    return {
      qty,
      nombre,
      unit,
      lineTotal: qty * unit,
    };
  });

  const totalItems = rows.reduce((acc, r) => acc + r.qty, 0);
  const totalPrice = rows.reduce((acc, r) => acc + r.lineTotal, 0);

  const body = rows.map((r) => [
    String(r.qty),
    r.nombre,
    moneyARS(r.unit),
    moneyARS(r.lineTotal),
  ]);

  body.push([
    `TOTAL: ${totalItems}`,
    '',
    '',
    `TOTAL: ${moneyARS(totalPrice)}`,
  ]);

  autoTable(doc, {
    startY: 32,
    head: [[
      'Cantidad productos',
      'Detalle del producto',
      'Valor individual',
      'Subtotal',
    ]],
    body,
    styles: {
      font: 'helvetica',
      fontSize: 10,
      cellPadding: 3,
      lineColor: [180, 180, 180],
      lineWidth: 0.3,
    },
    headStyles: {
      fillColor: [230, 230, 230],
      textColor: 20,
      fontStyle: 'bold',
      lineColor: [160, 160, 160],
      lineWidth: 0.4,
    },
    bodyStyles: {
      lineColor: [200, 200, 200],
      lineWidth: 0.3,
    },
    footStyles: {
      lineColor: [160, 160, 160],
      lineWidth: 0.4,
    },
    theme: 'grid',
    columnStyles: {
      0: { cellWidth: 38 },
      1: { cellWidth: 150 },
      2: { cellWidth: 42, halign: 'right' },
      3: { cellWidth: 42, halign: 'right' },
    },
    didParseCell: (data) => {
      const isLast = data.row.index === body.length - 1;
      if (isLast) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [245, 245, 245];
      }
    },
  });

  const finalY = (doc as any).lastAutoTable?.finalY ?? 32;
  let y = finalY + 10;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Datos de la venta', 14, y);

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const customerName = (sale?.customerName ?? '').toString();
  const createdByEmail = (sale?.createdByEmail ?? '').toString();

  const lines = [
    `Cliente / referencia: ${customerName || '-'}`,
    `Usuario administrador: ${createdByEmail || '-'}`,
  ];

  lines.forEach((line) => {
    doc.text(line, 14, y);
    y += 5;
  });

  if (sale?.comment) {
    y += 2;
    doc.setFont('helvetica', 'bold');
    doc.text('Comentario:', 14, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.text(String(sale.comment), 14, y);
  }

  doc.save(`venta_local_${saleId}_${status}.pdf`);
}