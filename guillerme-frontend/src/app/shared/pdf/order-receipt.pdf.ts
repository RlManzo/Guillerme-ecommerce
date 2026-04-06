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

// helper afuera
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

  const BRAND_NAME = 'Librería Guillerme Guillerme';
  const BRAND_LOGO = 'assets/sinfondo-guillerme.png';

  // cabecera derecha: logo + nombre ecommerce
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
    // si no carga el logo, no rompemos el PDF
  }

  // título
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(`Pedido nro#${orderId}  estado: ${status}`, 14, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const createdAt = order?.createdAt ? new Date(order.createdAt) : null;
  if (createdAt) {
    doc.text(`Fecha: ${createdAt.toLocaleString('es-AR')}`, 14, 20);
  }

  // items
  const items: any[] = Array.isArray(order?.items) ? order.items : [];

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

  // fila final
  body.push([
    `TOTAL: ${totalItems}`,
    '',
    '',
    `TOTAL: ${moneyARS(totalPrice)}`,
  ]);

  autoTable(doc, {
    startY: 26,
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
  lineColor: [180, 180, 180], // color de líneas
  lineWidth: 0.3,             // grosor de borde
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

  // datos cliente
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
  const documento = (order?.customerDocumento ?? '').toString();
  const tel = (order?.customerTelefono ?? '').toString();
  const dir = (order?.customerDireccion ?? '').toString();

  const lines = [
    `Nombre: ${nombre || '-'}`,
    `Email: ${email || '-'}`,
    `Documento: ${documento || '-'}`,
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

  doc.save(`pedido_${orderId}_${status}.pdf`);
}