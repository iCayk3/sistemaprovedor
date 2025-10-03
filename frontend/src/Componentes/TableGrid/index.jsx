import Box from '@mui/material/Box';
import { DataGrid } from '@mui/x-data-grid';
import { styled } from '@mui/material/styles';
import { useMemo } from 'react';

const StyledGridOverlay = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  '& .no-rows-primary': {
    fill: '#3D4751',
    ...theme.applyStyles('light', {
      fill: '#AEB8C2',
    }),
  },
  '& .no-rows-secondary': {
    fill: '#1D2126',
    ...theme.applyStyles('light', {
      fill: '#E8EAED',
    }),
  },
}));

const colunas = [{ field: 'id', width: 10 },
{ field: 'codigo', headerName: 'Código', width: 60 },
{ field: 'nomeOlt', headerName: 'OLT', width: 140 },
{ field: 'nomeCto', headerName: 'CTO', width: 140 },
{ field: 'nomeEquipeTecnica', headerName: 'Equipe técnica', width: 140 },
{ field: 'data', headerName: 'Data', width: 120 },
{ field: 'procedimento', headerName: 'Procedimento', width: 180 },
{ field: 'ctoAntiga', headerName: 'CTO Antiga', width: 90 },
{ field: 'localidade', headerName: 'Localidade', width: 100 },
{ field: 'observacao', headerName: 'Observação', width: 100 }
]

function CustomNoRowsOverlay() {
  return (
    <StyledGridOverlay>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        width={96}
        viewBox="0 0 452 257"
        aria-hidden
        focusable="false"
      >
        <path
          className="no-rows-primary"
          d="M348 69c-46.392 0-84 37.608-84 84s37.608 84 84 84 84-37.608 84-84-37.608-84-84-84Zm-104 84c0-57.438 46.562-104 104-104s104 46.562 104 104-46.562 104-104 104-104-46.562-104-104Z"
        />
        <path
          className="no-rows-primary"
          d="M308.929 113.929c3.905-3.905 10.237-3.905 14.142 0l63.64 63.64c3.905 3.905 3.905 10.236 0 14.142-3.906 3.905-10.237 3.905-14.142 0l-63.64-63.64c-3.905-3.905-3.905-10.237 0-14.142Z"
        />
        <path
          className="no-rows-primary"
          d="M308.929 191.711c-3.905-3.906-3.905-10.237 0-14.142l63.64-63.64c3.905-3.905 10.236-3.905 14.142 0 3.905 3.905 3.905 10.237 0 14.142l-63.64 63.64c-3.905 3.905-10.237 3.905-14.142 0Z"
        />
        <path
          className="no-rows-secondary"
          d="M0 10C0 4.477 4.477 0 10 0h380c5.523 0 10 4.477 10 10s-4.477 10-10 10H10C4.477 20 0 15.523 0 10ZM0 59c0-5.523 4.477-10 10-10h231c5.523 0 10 4.477 10 10s-4.477 10-10 10H10C4.477 69 0 64.523 0 59ZM0 106c0-5.523 4.477-10 10-10h203c5.523 0 10 4.477 10 10s-4.477 10-10 10H10c-5.523 0-10-4.477-10-10ZM0 153c0-5.523 4.477-10 10-10h195.5c5.523 0 10 4.477 10 10s-4.477 10-10 10H10c-5.523 0-10-4.477-10-10ZM0 200c0-5.523 4.477-10 10-10h203c5.523 0 10 4.477 10 10s-4.477 10-10 10H10c-5.523 0-10-4.477-10-10ZM0 247c0-5.523 4.477-10 10-10h231c5.523 0 10 4.477 10 10s-4.477 10-10 10H10c-5.523 0-10-4.477-10-10Z"
        />
      </svg>
      <Box sx={{ mt: 2 }}>No rows</Box>
    </StyledGridOverlay>
  );
}

const paginationModel = { page: 0, pageSize: 15 };

const TableGrid = ({ dados, colunasEdit, financeiro, filtro, prefix }) => {

  return (

    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', mt: 4 }}>
      {!dados && !colunasEdit &&
        <DataGrid
          columns={colunas}
          rows={[]}
          slots={{ noRowsOverlay: CustomNoRowsOverlay }}
          sx={{ '--DataGrid-overlayHeight': '250px' }}
          initialState={{ pagination: { paginationModel } }}
          pageSizeOptions={[10, 15]}
        />
      }
      {dados && !colunasEdit && <DataGrid
        columns={colunas}
        rows={dados}
        slots={{ noRowsOverlay: CustomNoRowsOverlay }}
        sx={{ '--DataGrid-overlayHeight': '250px' }}
        initialState={{ pagination: { paginationModel } }}
        pageSizeOptions={[10, 15]}
      />}
      {dados && colunasEdit && !financeiro && <DataGrid
        columns={colunasEdit}
        rows={dados}
        slots={{ noRowsOverlay: CustomNoRowsOverlay }}
        sx={{ '--DataGrid-overlayHeight': '250px' }}
        initialState={{ pagination: { paginationModel } }}
        pageSizeOptions={[10, 15]}
        showToolbar
      />}
      {dados && colunasEdit && financeiro && !filtro && (
        <DataGrid
          columns={colunasEdit}
          rows={dados}
          getRowId={(row) => (row.codigo ? `${row.codigo}-${prefix}` : `${prefix}-${crypto.randomUUID()}`)}
          slots={{ noRowsOverlay: CustomNoRowsOverlay }}
          sx={{ '--DataGrid-overlayHeight': '250px' }}
          initialState={{ pagination: { paginationModel } }}
          pageSizeOptions={[10, 15]}
        />
      )}
      {dados && colunasEdit && financeiro && filtro && (
        <DataGrid
          columns={colunasEdit}
          rows={dados}
          getRowId={(row) => (row.codigo ? `${row.codigo}-${prefix}` : `${prefix}-${crypto.randomUUID()}`)}
          slots={{ noRowsOverlay: CustomNoRowsOverlay }}
          sx={{ '--DataGrid-overlayHeight': '250px' }}
          initialState={{ pagination: { paginationModel } }}
          pageSizeOptions={[10, 15]}
        />

      )}
    </Box>
  );
}

export default TableGrid