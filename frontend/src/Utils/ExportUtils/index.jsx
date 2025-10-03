import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Exporta os dados para Excel usando ExcelJS
 * @param {Array} data - Lista de objetos a serem exportados
 * @param {string} fileName - Nome do arquivo (sem extensão)
 */
export async function exportToExcel(data, fileName = 'dados') {
  if (!Array.isArray(data) || data.length === 0) {
    console.error('Dados inválidos para exportação.');
    return;
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sheet1');

  // Cabeçalhos automáticos com base nas chaves do primeiro objeto
  const headers = Object.keys(data[0]);
  worksheet.columns = headers.map(header => ({
    header,
    key: header,
    width: 20,
  }));

  // Adiciona dados à planilha
  data.forEach(row => {
    const sanitizedRow = {};
    headers.forEach(key => {
      const value = row[key];
      sanitizedRow[key] = value != null ? String(value) : '';
    });
    worksheet.addRow(sanitizedRow);
  });

  // Gera buffer e inicia download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${fileName}.xlsx`);
}

/**
 * Exporta os dados para PDF usando jsPDF e autotable
 * @param {Array} columns - Definição das colunas (array de strings ou objetos com field/headerName)
 * @param {Array} data - Dados em formato de array de objetos
 * @param {string} fileName - Nome do arquivo
 */
export function exportToPDF(columns, data, fileName = 'relatorio') {
  if (!Array.isArray(columns) || !Array.isArray(data)) {
    console.error('Colunas ou dados inválidos para exportação em PDF.');
    return;
  }

  const resolvedColumns = columns.map(col => {
    if (typeof col === 'string') {
      return { field: col, headerName: col };
    }
    return {
      field: col.field ?? col,
      headerName: col.headerName ?? col.field ?? col,
    };
  });

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

  autoTable(doc, {
    head: [resolvedColumns.map(col => col.headerName)],
    body: data.map(row =>
      resolvedColumns.map(col => row[col.field] ?? '')
    ),
    margin: { top: 40 },
    styles: { fontSize: 8 }
  });

  doc.save(`${fileName}.pdf`);
}
