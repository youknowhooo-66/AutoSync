import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PDFExportOptions {
  title: string;
  subtitle?: string;
  headers: string[];
  data: any[][];
  filename: string;
}

export function generatePDF({ title, subtitle, headers, data, filename }: PDFExportOptions) {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.setTextColor(79, 70, 229); // indigo-600
  doc.text('AutoSync ERP', 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(new Date().toLocaleString('pt-BR'), 150, 22);

  // Title
  doc.setFontSize(16);
  doc.setTextColor(33);
  doc.text(title, 14, 40);

  if (subtitle) {
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(subtitle, 14, 48);
  }

  // Table
  autoTable(doc, {
    startY: subtitle ? 55 : 45,
    head: [headers],
    body: data,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { top: 30 },
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.text(`Página ${i} de ${pageCount}`, 14, 285);
  }

  doc.save(`${filename}.pdf`);
}
