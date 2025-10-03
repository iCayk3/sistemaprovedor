import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportToPDF(columns, data, fileName = 'relatorio') {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

  autoTable(doc, {
    head: [columns.map(col => col.headerName)],
    body: data.map(row => columns.map(col => row[col.field])),
    margin: { top: 40 },
    styles: { fontSize: 8 }
  });

  doc.save(`${fileName}.pdf`);
}
