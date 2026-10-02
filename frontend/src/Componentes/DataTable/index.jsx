import * as React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Box, Paper } from '@mui/material';
import Filtros from '../Filtros';
import Api from '../../Services/Api';

const columns = [
    { field: 'codigo', headerName: 'CODIGO', width: 80 },
    { field: 'nomeOlt', headerName: 'OLT', width: 150 },
    { field: 'nomeCto', headerName: 'CTO', width: 130 },
    { field: 'porta', headerName: 'PORTA', width: 70 },
    { field: 'nomeEquipeTecnica', headerName: 'Equipe técnica', width: 250 },
    { field: 'data', headerName: 'DATA', width: 100 },
    { field: 'procedimento', headerName: 'Procedimento', width: 130 },
    { field: 'ctoAntiga', headerName: 'CTO Antiga', width: 130 },
    { field: 'localidade', headerName: 'Localidade', width: 130 },
    { field: 'observacao', headerName: 'Observação', width: 130 },
];

const paginationModel = { page: 0, pageSize: 10 };
const UseApi = Api();

const DataTable = ({ filtro }) => {
    const [dataFiltro, setDataFiltro] = React.useState('');
    const [tecnico, setTecnico] = React.useState('');
    const [tecnicoLabel, setTecnicoLabel] = React.useState('');
    const [cliente, setCliente] = React.useState('');
    const [data, setData] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    const aoAlteradoData = (valorData) => {
        setDataFiltro(valorData || '');
    };

    const aoAlteradoCliente = (clienteFiltro) => {
        setCliente(clienteFiltro?.target?.value || '');
    };

    React.useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await UseApi(`registros?filtro=${filtro || ''}`);
                setData(Array.isArray(response) ? response : []);
            } catch (error) {
                console.error('Erro ao buscar dados:', error);
                setData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [filtro]);

    const filteredRows = React.useMemo(() => {
        if (!Array.isArray(data)) return [];
        return data.filter((item) => {
            if (tecnico?.label && item.nomeEquipeTecnica !== tecnico.label) return false;
            if (dataFiltro && item.data !== dataFiltro) return false;
            if (cliente && item.codigo !== parseInt(cliente, 10)) return false;
            return true;
        });
    }, [data, tecnico, dataFiltro, cliente]);

    return (
        <Box sx={{ position: 'relative' }}>
            <Filtros
                aoAlteradoTecnico={setTecnico}
                valor={tecnico}
                valorInput={tecnicoLabel}
                aoAlteradoTecnicoLabel={setTecnicoLabel}
                aoAlteradoData={aoAlteradoData}
                aoAlteradoCliente={aoAlteradoCliente}
            />
            <Paper sx={{ height: 440, width: '100%' }}>
                <DataGrid
                    rows={filteredRows}
                    columns={columns}
                    loading={loading}
                    initialState={{ pagination: { paginationModel } }}
                    pageSizeOptions={[10, 15, 25]}
                    sx={{ border: 0 }}
                />
            </Paper>
        </Box>
    );
};

export default DataTable;