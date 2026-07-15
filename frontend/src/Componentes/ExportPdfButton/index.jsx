import PictureAsPdfRoundedIcon from '@mui/icons-material/PictureAsPdfRounded';
import { Button } from '@mui/material';
import { exportToPDF } from '../../Utils/ExportUtils';

const defaultColumns = [
    { field: 'indicador', headerName: 'Indicador' },
    { field: 'valor', headerName: 'Valor' },
    { field: 'detalhe', headerName: 'Detalhe' },
];

const ExportPdfButton = ({
    columns = defaultColumns,
    rows = [],
    fileName = 'dashboard',
    label = 'Exportar PDF',
    disabled = false,
    size = 'small',
}) => {
    const handleExport = () => {
        const datedName = `${fileName}-${new Date().toISOString().slice(0, 10)}`;
        exportToPDF(columns, rows, datedName);
    };

    return (
        <Button
            variant="outlined"
            size={size}
            startIcon={<PictureAsPdfRoundedIcon />}
            onClick={handleExport}
            disabled={disabled || !rows?.length}
        >
            {label}
        </Button>
    );
};

export default ExportPdfButton;
