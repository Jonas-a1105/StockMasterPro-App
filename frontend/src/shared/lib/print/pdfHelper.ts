import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ColumnMapping, exportToExcel } from '@shared/lib/excelHelper';

export function exportToPdf(
  data: any[],
  columns: ColumnMapping[],
  title: string,
  filename: string
) {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(16);
  doc.text(title, pageWidth / 2, 15, { align: 'center' });

  doc.setFontSize(10);
  doc.text(`Generado: ${new Date().toLocaleDateString()}`, pageWidth / 2, 22, { align: 'center' });

  const headers = columns.map((c) => c.header);
  const rows = data.map((item) =>
    columns.map((col) => {
      const val = item[col.key];
      return val !== undefined && val !== null ? String(val) : '';
    })
  );

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 28,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  doc.save(`${filename}.pdf`);
}
