import React, { useRef, useState, useMemo, useCallback } from 'react';
import { Menu, MenuItem, Tooltip } from '@mui/material';
import Box from '@mui/material/Box';
import {
    DataGrid,
    ToolbarButton,
    GridToolbarContainer,
    GridToolbarQuickFilter,
} from '@mui/x-data-grid';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PrintIcon from '@mui/icons-material/Print';
import DownloadForOfflineIcon from '@mui/icons-material/DownloadForOffline';
import { exportToExcel, exportToPDF } from '../../Utils/ExportUtils';

/* -------------------- Exportações -------------------- */
function ExportExcel({ onMenuItemClick, rows }) {
    const handleClick = () => {
        if (!rows?.length) {
            console.warn('Nenhuma linha para exportar.');
            return;
        }
        const dataAtual = new Date().toISOString().split('T')[0];
        exportToExcel(rows, `dados-${dataAtual}`);
        onMenuItemClick?.();
    };
    return (
        <MenuItem onClick={handleClick}>
            <DownloadForOfflineIcon fontSize="small" sx={{ mr: 1 }} />
            Excel
        </MenuItem>
    );
}

function ExportPDF({ onMenuItemClick, columns, rows }) {
    const handleClick = () => {
        if (!rows?.length) {
            console.warn('Nenhuma linha para imprimir.');
            return;
        }
        const dataAtual = new Date().toISOString().split('T')[0];
        exportToPDF(columns, rows, `dados-${dataAtual}`);
        onMenuItemClick?.();
    };
    return (
        <MenuItem onClick={handleClick}>
            <PrintIcon fontSize="small" sx={{ mr: 1 }} />
            PDF
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
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <ExportExcel rows={rows} onMenuItemClick={() => setOpen(false)} />
                <ExportPDF columns={columns} rows={rows} onMenuItemClick={() => setOpen(false)} />
            </Menu>
        </>
    );
}

const CustomToolbar = React.memo(function CustomToolbar({ columns, rows }) {
    return (
        <GridToolbarContainer>
            <GridToolbarQuickFilter />
            <ExportMenu columns={columns} rows={rows} />
        </GridToolbarContainer>
    );
});

/* -------------------- TabelaExibicao -------------------- */
export default function TabelaExibicao({
    rows = [],
    columns = [],
    sx,
    filtroExterno = {},
    prefix = 'tbl',
    tablefin
}) {
    const [search, setSearch] = useState('');
    const lastQuick = useRef(''); // guarda último valor da quick-filter

    // IDs estáveis (nada de randomUUID)
    const rowsComId = useMemo(() => {
        return rows.map((row, index) => ({
            id: row.id ?? row.codigo ?? row.Codigo ?? `${prefix}-${index}`,
            ...row,
        }));
    }, [rows, prefix]);

    // onFilterModelChange estável + guarda último valor para evitar setState repetido
    const handleFilterModelChange = useCallback((model) => {
        const next = (model?.quickFilterValues?.[0] ?? '').toLowerCase();
        if (next !== lastQuick.current) {
            lastQuick.current = next;
            setSearch(next);
        }
    }, []);

    // Filtro externo + busca global (qualquer coluna; datas com match parcial)
    const linhasFiltradas = useMemo(() => {
        const { tecnicoLabel = '', dataFiltro = '' } = filtroExterno;
        const temFiltro = Boolean(tecnicoLabel || dataFiltro);
        const tecnicoLower = tecnicoLabel.toLowerCase();
        const termo = search.trim();

        const normalizaData = (s) => {
            const t = String(s ?? '').toLowerCase().replace(/[-.]/g, '/').trim();
            // ISO -> dd/mm/yyyy
            if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(t)) {
                const [a, m, d] = t.split('/');
                return `${d}/${m}/${a}`.replace(/\b0(\d)/g, '$1');
            }
            return t.replace(/\b0(\d)/g, '$1');
        };

        return rowsComId.filter((row) => {
            // filtro externo
            const tecnicoOk = tecnicoLabel
                ? (row.equipe ?? '').toString().toLowerCase().includes(tecnicoLower)
                : true;
            const dataOk = dataFiltro ? String(row.data ?? '').includes(dataFiltro) : true;
            if (temFiltro && !(tecnicoOk && dataOk)) return false;

            if (!termo) return true;

            const termoNorm = normalizaData(termo);
            return columns.some((col) => {
                const v = row[col.field];
                if (v == null) return false;

                const txt = String(v).toLowerCase();
                if (col.field === 'nome') return txt === termo;        // nome: match exato
                const ehData =
                    col.field.includes('data') ||
                    col.field.includes('vencimento') ||
                    col.field.includes('bloqueio');
                return ehData ? normalizaData(txt).includes(termoNorm) : txt.includes(termo);
            });
        });
    }, [rowsComId, filtroExterno, search, columns]);

    return (
        <Box sx={{ height: 500, width: '100%' }}>
            {tablefin ? <DataGrid
                rows={linhasFiltradas}                 // sem estado espelho -> sem loop
                columns={columns}
                pageSizeOptions={[5, 10, 15]}
                getRowId={(row) => row.id}
                initialState={{
                    pagination: { paginationModel: { page: 0, pageSize: 15 } },
                }}
                onFilterModelChange={handleFilterModelChange}
                slots={{ toolbar: CustomToolbar }}
                slotProps={{ toolbar: { columns, rows: linhasFiltradas } }}
                disableColumnSelector
                disableDensitySelector
                disableRowSelectionOnClick
                showToolbar
                sx={sx}
            />
                :
                <DataGrid
                    rows={linhasFiltradas}                 // sem estado espelho -> sem loop
                    columns={columns}
                    pageSizeOptions={[5, 10, 15]}
                    initialState={{
                        pagination: { paginationModel: { page: 0, pageSize: 15 } },
                    }}
                    onFilterModelChange={handleFilterModelChange}
                    slots={{ toolbar: CustomToolbar }}
                    slotProps={{ toolbar: { columns, rows: linhasFiltradas } }}
                    disableColumnSelector
                    disableDensitySelector
                    disableRowSelectionOnClick
                    showToolbar
                    sx={sx}
                />}
        </Box>
    );
}
