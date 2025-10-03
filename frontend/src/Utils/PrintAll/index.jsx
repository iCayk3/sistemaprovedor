import { MenuItem } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';

export default function PrintAllButton({ rows, columns, onClose }) {
    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const tableHeaders = columns.map((col) => `<th>${col.headerName}</th>`).join('');
        const tableRows = rows
            .map((row) => {
                const rowData = columns.map((col) => `<td>${row[col.field] ?? ''}</td>`).join('');
                return `<tr>${rowData}</tr>`;
            })
            .join('');

        printWindow.document.write(`
      <html>
        <head>
          <title>Impressão de Dados</title>
          <style>
            table {
              border-collapse: collapse;
              width: 100%;
              font-family: Arial, sans-serif;
            }
            th, td {
              border: 1px solid #ccc;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f0f0f0;
            }
          </style>
        </head>
        <body>
          <h2>Relatório de Dados</h2>
          <table>
            <thead><tr>${tableHeaders}</tr></thead>
            <tbody>${tableRows}</tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          </script>
        </body>
      </html>
    `);

        printWindow.document.close();
        if (onClose) onClose();
    };

    return (
        <MenuItem onClick={handlePrint}>
            <PrintIcon fontSize="small" sx={{ marginRight: 1 }} />
            Imprimir tudo
        </MenuItem>
    );
}
