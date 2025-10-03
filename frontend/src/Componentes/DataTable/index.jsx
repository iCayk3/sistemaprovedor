import * as React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import Paper from '@mui/material/Paper';
import Filtros from '../Filtros';
import styled from 'styled-components';
import Api from '../../Services/Api';

const DivEstilizada = styled.div`
  position: relative;
`

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

const DataTable = ({ filtro }) => {

    const [dataFiltro, setDataFiltro] = React.useState('');
    const [tecnico, setTecnico] = React.useState('');
    const [tecnicoLabel, setTecnicoLabel] = React.useState('');
    const [cliente, setCliente] = React.useState('')
    const [data, setData] = React.useState()
    const UseApi = Api()


    const aoAlteradoData = (dataFiltro) => {
        if (dataFiltro === null) {
            setDataFiltro('')
        } else {
            setDataFiltro(dataFiltro)
        }
    }

    const aoAlteradoCliente = (clienteFiltro) => {
        if (clienteFiltro === null) {
            setCliente('')
        } else {
            setCliente(clienteFiltro.target.value)
        }
    }

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await UseApi(`registros?filtro=${filtro}`);
                setData(response);
            } catch (error) {
                console.error('Erro ao buscar dados:', error);
            } 
        };

        fetchData();
    }, [filtro]);

    return (
        <DivEstilizada>
            <Filtros
                aoAlteradoTecnico={setTecnico}
                valor={tecnico}
                valorInput={tecnicoLabel}
                aoAlteradoTecnicoLabel={setTecnicoLabel}
                aoAlteradoData={(data) => aoAlteradoData(data)}
                aoAlteradoCliente={(cliente) => aoAlteradoCliente(cliente)}
            />
            <Paper sx={{ height: 400, width: '100%' }}>

                {!cliente && !dataFiltro && tecnico && <DataGrid
                    key={data.id}
                    rows={data.filter((item) => item.nomeEquipeTecnica === tecnico.label)}
                    columns={columns}
                    initialState={{ pagination: { paginationModel } }}
                    pageSizeOptions={[10, 15]}
                    sx={{ border: 0 }}

                />}
                {!cliente && !tecnico && dataFiltro && <DataGrid
                    key={data.id}
                    rows={data.filter((item) => item.data === dataFiltro)}
                    columns={columns}
                    initialState={{ pagination: { paginationModel } }}
                    pageSizeOptions={[10, 15]}
                    sx={{ border: 0 }}

                />}
                {!cliente && !tecnico && !dataFiltro && data &&
                    <DataGrid
                        key={data.id}
                        rows={data}
                        columns={columns}
                        initialState={{ pagination: { paginationModel } }}
                        pageSizeOptions={[10, 15]}
                        sx={{ border: 0 }}

                    />}
                {tecnico && dataFiltro && <DataGrid
                    key={data.id}
                    rows={data.filter((item) => { return item.data === dataFiltro && item.nomeEquipeTecnica === tecnico.label })}
                    columns={columns}
                    initialState={{ pagination: { paginationModel } }}
                    pageSizeOptions={[10, 15]}
                    sx={{ border: 0 }}

                />}
                {!tecnico && !dataFiltro && cliente && <DataGrid
                    key={data.id}
                    rows={data.filter((item) => { return item.codigo === parseInt(cliente) })}
                    columns={columns}
                    initialState={{ pagination: { paginationModel } }}
                    pageSizeOptions={[10, 15]}
                    sx={{ border: 0 }}

                />}
            </Paper>
        </DivEstilizada >

    );
}

export default DataTable