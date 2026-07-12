import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CompanyInfo {
  companyName: string;
  companyTaxId: string;
  companyFiscalAddress: string;
  companyPhone: string;
  taxRate: number;
  taxName: string;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  price: number;
  total: number;
}

interface InvoiceData {
  invoiceNumber: string;
  documentType: string;
  createdAt: string;
  customerName: string;
  customerTaxId: string;
  customerFiscalAddress: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  items: InvoiceItem[];
}

export function generateFiscalInvoicePdf(invoice: InvoiceData, company: CompanyInfo) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  // === Header ===
  doc.setFontSize(20);
  doc.text(company.companyName || 'Nombre de la Empresa', margin, 20);
  doc.setFontSize(9);
  let y = 28;

  if (company.companyTaxId) {
    doc.text(`RIF: ${company.companyTaxId}`, margin, y);
    y += 5;
  }
  if (company.companyFiscalAddress) {
    doc.text(`Dirección Fiscal: ${company.companyFiscalAddress}`, margin, y);
    y += 5;
  }
  if (company.companyPhone) {
    doc.text(`Teléfono: ${company.companyPhone}`, margin, y);
    y += 5;
  }

  // === Invoice Title ===
  y += 5;
  doc.setDrawColor(200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.documentType?.toUpperCase() || 'FACTURA', pageWidth / 2, y, { align: 'center' });
  doc.setFont('helvetica', 'normal');

  // === Invoice Info Box ===
  y += 10;
  const infoX = pageWidth - margin - 80;
  doc.setFontSize(9);
  doc.text(`N° Factura: ${invoice.invoiceNumber}`, infoX, y);
  y += 5;
  doc.text(`Fecha: ${new Date(invoice.createdAt).toLocaleDateString('es-VE')}`, infoX, y);
  y += 5;
  doc.text(`Documento: ${invoice.documentType || 'Factura'}`, infoX, y);

  // === Customer Info ===
  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DEL CLIENTE', margin, y);
  doc.setFont('helvetica', 'normal');
  y += 6;
  doc.setFontSize(9);
  if (invoice.customerName) {
    doc.text(`Cliente: ${invoice.customerName}`, margin, y);
    y += 5;
  }
  if (invoice.customerTaxId) {
    doc.text(`RIF/CI: ${invoice.customerTaxId}`, margin, y);
    y += 5;
  }
  if (invoice.customerFiscalAddress) {
    doc.text(`Dirección Fiscal: ${invoice.customerFiscalAddress}`, margin, y);
    y += 5;
  }

  // === Items Table ===
  y += 5;
  doc.setDrawColor(200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  autoTable(doc, {
    head: [['#', 'Producto', 'Cant.', 'Precio Unit.', 'Total']],
    body: invoice.items.map((item, idx) => [
      String(idx + 1),
      item.description,
      item.quantity,
      `$${item.price.toFixed(2)}`,
      `$${item.total.toFixed(2)}`,
    ]),
    startY: y,
    margin: { left: margin, right: margin },
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [41, 65, 125], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 35, halign: 'right' },
      4: { cellWidth: 35, halign: 'right' },
    },
    tableLineColor: 200,
    tableLineWidth: 0.5,
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;

  // === Totals ===
  const totalsX = pageWidth - margin - 70;
  doc.setFontSize(10);
  doc.text('Subtotal:', totalsX, finalY);
  doc.text(`$${invoice.subtotal.toFixed(2)}`, pageWidth - margin, finalY, { align: 'right' });

  let ty = finalY + 6;
  if (invoice.discount > 0) {
    doc.text('Descuento:', totalsX, ty);
    doc.text(`-$${invoice.discount.toFixed(2)}`, pageWidth - margin, ty, { align: 'right' });
    ty += 6;
  }

  doc.text(`${company.taxName} (${company.taxRate}%):`, totalsX, ty);
  doc.text(`$${invoice.tax.toFixed(2)}`, pageWidth - margin, ty, { align: 'right' });
  ty += 8;

  doc.setDrawColor(200);
  doc.line(totalsX, ty, pageWidth - margin, ty);
  ty += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('TOTAL:', totalsX, ty);
  doc.text(`$${invoice.total.toFixed(2)}`, pageWidth - margin, ty, { align: 'right' });
  doc.setFont('helvetica', 'normal');

  // === Footer ===
  const footerY = doc.internal.pageSize.getHeight() - 20;
  doc.setFontSize(7);
  doc.setTextColor(150);
  doc.text(
    `Documento generado electrónicamente. ${company.companyName} - RIF ${company.companyTaxId || 'N/A'}`,
    pageWidth / 2,
    footerY,
    { align: 'center' }
  );

  doc.save(`factura-${invoice.invoiceNumber || 'sin-numero'}.pdf`);
}
