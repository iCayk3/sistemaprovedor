import { Menu, MenuItem, Tooltip } from '@mui/material';
import Box from '@mui/material/Box';
import { DataGrid, ToolbarButton, GridToolbarContainer, GridToolbarQuickFilter } from '@mui/x-data-grid';
import Fuse from 'fuse.js';
import { useEffect, useRef, useState } from 'react';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PrintIcon from '@mui/icons-material/Print';
import DownloadForOfflineIcon from '@mui/icons-material/DownloadForOffline';
import { exportToExcel, exportToPDF } from '../../Utils/ExportUtils';

function ExportExcel({ onMenuItemClick, rows }) {
    return (
        <MenuItem
            onClick={() => {
                exportToExcel(rows, 'dados');
                onMenuItemClick();
            }}
        >
            <DownloadForOfflineIcon fontSize="small" sx={{ marginRight: 1 }} />
            Download Excel
        </MenuItem>
    );
}

function PrintTable({ onMenuItemClick, columns, rows }) {
    const handleClick = () => {
        if (!Array.isArray(rows) || rows.length === 0) {
            console.warn('Nenhuma linha disponível para imprimir.');
            return;
        }

        exportToPDF(columns, rows, 'dados');
        onMenuItemClick?.();
    };

    return (
        <MenuItem onClick={handleClick}>
            <PrintIcon fontSize="small" sx={{ marginRight: 1 }} />
            Download PDF
        </MenuItem>
    );
}

function ExportMenu({ columns, rows }) {
    const [open, setOpen] = useState(false);
    const triggerRef = useRef(null);

    return (
        <>
            <Tooltip title="Exportar">
                <ToolbarButton
                    ref={triggerRef}
                    id="export-menu-trigger"
                    aria-controls="export-menu"
                    aria-haspopup="true"
                    aria-expanded={open ? 'true' : undefined}
                    onClick={() => setOpen(true)}
                >
                    <FileDownloadIcon fontSize="small" />
                </ToolbarButton>
            </Tooltip>
            <Menu
                id="export-menu"
                anchorEl={triggerRef.current}
                open={open}
                onClose={() => setOpen(false)}
            >
                <ExportExcel rows={rows} onMenuItemClick={() => setOpen(false)} />
                <PrintTable columns={columns} rows={rows} onMenuItemClick={() => setOpen(false)} />
            </Menu>
        </>
    );
}

function CustomToolbar({ columns, rows }) {
    return (
        <GridToolbarContainer>
            <GridToolbarQuickFilter />
            <ExportMenu columns={columns} rows={rows} />
        </GridToolbarContainer>
    );
}

export default function TabelaExibicao({ rows, columns, sx, filtroExterno = {} }) {
    const [search, setSearch] = useState('');
    const [filteredRows, setFilteredRows] = useState(rows);

    const fuse = new Fuse(rows, {
        keys: [
            { name: 'label', weight: 0.8 },
            ...columns
                .filter((col) => col.field !== 'label')
                .map((col) => ({ name: col.field, weight: 0.2 })),
        ],
        threshold: 0.4,
    });

    useEffect(() => {
        const { tecnicoLabel = '', dataFiltro = '' } = filtroExterno;
        const possuiFiltroExterno = tecnicoLabel || dataFiltro;

        if (possuiFiltroExterno) {
            const tecnicoLabelLower = tecnicoLabel.toString().toLowerCase();

            const filtrados = rows.filter(row => {
                const rawTecnico = row.equipe ?? '';
                const tecnicoMatch = tecnicoLabel
                    ? rawTecnico.toString().toLowerCase().includes(tecnicoLabelLower)
                    : true;

                const dataMatch = dataFiltro
                    ? (row.data ?? '') === dataFiltro
                    : true;

                return tecnicoMatch && dataMatch;
            });

            setFilteredRows(filtrados);
        } else {
            if (!search) {
                setFilteredRows(rows);
            } else {
                const result = fuse.search(search).map((r) => r.item);
                setFilteredRows(result);
            }
        }
    }, [search, filtroExterno, rows]);

    return (
        <Box sx={{ height: 500, width: '100%' }}>
            <DataGrid
                rows={filteredRows}
                columns={columns}
                pageSizeOptions={[5, 10, 15]}
                initialState={{
                    pagination: { paginationModel: { page: 0, pageSize: 15 } },
                }}
                slots={{
                    toolbar: () => <CustomToolbar columns={columns} rows={filteredRows} />
                }}
                disableColumnSelector
                disableDensitySelector
                disableRowSelectionOnClick
                showToolbar
                sx={sx}
            />
        </Box>
    );
}
