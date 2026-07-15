import { useEffect, useState } from "react";
import { Box, Paper, Stack, Typography } from "@mui/material";
import ResumoMensal from "../../Componentes/ResumoMensal";
import Api from "../../Services/Api";
import DashPizza from "../../Componentes/DashPizza";
import TabelaExibicao from "../../Componentes/TabelaExibicao";
import Filtros from "../../Componentes/Filtros";
import ExportDashboardPdfButton from "../../Componentes/ExportDashboardPdfButton";

const today = new Date();

const columns = [
    { field: 'cliente', headerName: 'CODIGO', width: 80 },
    { field: 'login', headerName: 'LOGIN', width: 80 },
    { field: 'olt', headerName: 'OLT', width: 150 },
    { field: 'cto', headerName: 'CTO', width: 130 },
    { field: 'porta', headerName: 'PORTA', width: 70 },
    { field: 'equipe', headerName: 'Equipe tecnica', width: 250 },
    {
        field: 'data',
        headerName: 'Data',
        width: 120,
        valueFormatter: (params) => {
            const raw = params;
            if (!raw) return '';
            const data = new Date(`${raw}T00:00:00`);
            return data.toLocaleDateString('pt-BR');
        }
    },
    { field: 'procedimento', headerName: 'Procedimento', width: 130 },
    { field: 'mac', headerName: 'MAC', width: 130 },
    { field: 'ctoAntiga', headerName: 'CTO Antiga', width: 130 },
    { field: 'localidade', headerName: 'Localidade', width: 130 },
    { field: 'observacao', headerName: 'Observacao', width: 130 },
];

const OverviewRegistro = () => {
    const [dataConsulta, setDataConsulta] = useState(today.toISOString().slice(0, 10));
    const [data, setData] = useState();
    const [rows, setRows] = useState();
    const [dataFiltro, setDataFiltro] = useState('');
    const [codigo, setCodigo] = useState('');
    const [tecnico, setTecnico] = useState('');
    const [tecnicoLabel, setTecnicoLabel] = useState('');
    const UseApi = Api();

    const selectData = (even) => {
        setDataConsulta(even.toISOString().slice(0, 10));
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await UseApi(`registros/servicos/mensais/resumo?filtro=${dataConsulta}`);
                setData(response);
            } catch (error) {
                console.error('Erro ao buscar dados:', error);
            }
        };

        fetchData();
    }, [dataConsulta]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await UseApi(`registros?filtro=${dataConsulta}`);
                setRows(response);
            } catch (error) {
                console.error('Erro ao buscar dados:', error);
            }
        };

        fetchData();
    }, [dataConsulta]);

    return (
        <Box id="overview-registros-export" sx={{ display: 'grid', gap: 2 }}>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2} alignItems={{ xs: 'stretch', md: 'center' }}>
                    <Box>
                        <Typography variant="h5" fontWeight={800}>Overview de registros</Typography>
                        <Typography color="text.secondary">Consulta operacional com filtros, resumo mensal e distribuicao por tecnico.</Typography>
                    </Box>
                    <ExportDashboardPdfButton
                        targetId="overview-registros-export"
                        title="Overview de registros"
                        fileName="overview-registros"
                    />
                </Stack>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, minWidth: 0 }}>
                <Filtros
                    aoAlteradoTecnico={setTecnico}
                    aoAlteradoTecnicoLabel={setTecnicoLabel}
                    aoAlteradoData={setDataFiltro}
                    aoAlteradoCliente={setCodigo}
                />
                <Box sx={{ mt: 2 }}>
                    <TabelaExibicao columns={columns} rows={rows} filtroExterno={{ tecnicoLabel, codigo, dataFiltro }} />
                </Box>
            </Paper>

            <ResumoMensal dataApiCto={data} aoSelectData={(e) => selectData(e)} />

            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                <Typography variant="h6" fontWeight={800} mb={2}>Distribuicao por equipe</Typography>
                <DashPizza uri={`registros/servicos/tecnicos/mensal/resumo?filtro=${dataConsulta}`} />
            </Paper>
        </Box>
    );
};

export default OverviewRegistro;
