import { useState } from "react";
import { Box, Paper, Stack, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import ResumoMensal from "../../Componentes/ResumoMensal";
import Api from "../../Services/Api";
import DashPizza from "../../Componentes/DashPizza";
import TabelaExibicao from "../../Componentes/TabelaExibicao";
import Filtros from "../../Componentes/Filtros";
import ExportDashboardPdfButton from "../../Componentes/ExportDashboardPdfButton";
import { dashboardHeaderSx, dashboardPanelSx, dashboardShellSx } from "../../Utils/DashboardTheme";

const today = new Date();

const columns = [
    { field: 'cliente', headerName: 'CODIGO', width: 90 },
    { field: 'login', headerName: 'LOGIN', width: 90 },
    { field: 'olt', headerName: 'OLT', width: 150 },
    { field: 'cto', headerName: 'CTO', width: 140 },
    { field: 'porta', headerName: 'PORTA', width: 80 },
    { field: 'equipe', headerName: 'Equipe técnica', width: 240 },
    {
        field: 'data',
        headerName: 'Data',
        width: 120,
        valueFormatter: (params) => {
            const raw = params;
            if (!raw) return '';
            const dataObj = new Date(`${raw}T00:00:00`);
            return dataObj.toLocaleDateString('pt-BR');
        }
    },
    { field: 'procedimento', headerName: 'Procedimento', width: 150 },
    { field: 'mac', headerName: 'MAC', width: 140 },
    { field: 'ctoAntiga', headerName: 'CTO Antiga', width: 130 },
    { field: 'localidade', headerName: 'Localidade', width: 130 },
    { field: 'observacao', headerName: 'Observação', width: 160 },
];

const UseApi = Api();

const OverviewRegistro = () => {
    const [dataConsulta, setDataConsulta] = useState(today.toISOString().slice(0, 10));
    const [dataFiltro, setDataFiltro] = useState('');
    const [codigo, setCodigo] = useState('');
    const [tecnicoLabel, setTecnicoLabel] = useState('');

    const selectData = (dateVal) => {
        if (dateVal) {
            setDataConsulta(dateVal.toISOString().slice(0, 10));
        }
    };

    const { data: overviewData, isLoading } = useQuery({
        queryKey: ['overviewRegistros', dataConsulta],
        queryFn: async () => {
            const [resumo, registros] = await Promise.all([
                UseApi(`registros/servicos/mensais/resumo?filtro=${dataConsulta}`),
                UseApi(`registros?filtro=${dataConsulta}`),
            ]);
            return {
                resumo: Array.isArray(resumo) ? resumo : [],
                registros: Array.isArray(registros) ? registros : [],
            };
        },
    });

    const data = overviewData?.resumo || [];
    const rows = overviewData?.registros || [];

    return (
        <Box id="overview-registros-export" sx={{ display: 'grid', gap: 2, ...dashboardShellSx }}>
            <Paper variant="outlined" sx={dashboardHeaderSx}>
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2} alignItems={{ xs: 'stretch', md: 'center' }}>
                    <Box>
                        <Typography variant="h5" fontWeight={800}>Overview de registros</Typography>
                        <Typography color="#e8f8ff">Consulta operacional com filtros, resumo mensal e distribuição por técnico.</Typography>
                    </Box>
                    <ExportDashboardPdfButton
                        targetId="overview-registros-export"
                        title="Overview de registros"
                        fileName="overview-registros"
                    />
                </Stack>
            </Paper>

            <Paper variant="outlined" sx={{ ...dashboardPanelSx, p: 2.5, minWidth: 0 }}>
                <Filtros
                    aoAlteradoTecnicoLabel={setTecnicoLabel}
                    aoAlteradoData={setDataFiltro}
                    aoAlteradoCliente={setCodigo}
                />
                <Box sx={{ mt: 2 }}>
                    <TabelaExibicao
                        columns={columns}
                        rows={rows}
                        loading={isLoading}
                        filtroExterno={{ tecnicoLabel, codigo, dataFiltro }}
                    />
                </Box>
            </Paper>

            <ResumoMensal dataApiCto={data} aoSelectData={selectData} dark />

            <Paper variant="outlined" sx={{ ...dashboardPanelSx, p: 2.5 }}>
                <Typography variant="h6" fontWeight={800} mb={2}>Distribuição por equipe</Typography>
                <DashPizza uri={`registros/servicos/tecnicos/mensal/resumo?filtro=${dataConsulta}`} />
            </Paper>
        </Box>
    );
};

export default OverviewRegistro;
