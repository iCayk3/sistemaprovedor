import { useState } from 'react';
import { Box, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import MixedBarChart from '../../Componentes/MixedBarChart';
import BasicLineChart from '../../Componentes/BasicLineChart';
import FieldAutoComplet from '../../Componentes/FieldAutoComplet';
import Api from '../../Services/Api';
import ExportDashboardPdfButton from '../../Componentes/ExportDashboardPdfButton';
import { dashboardHeaderSx, dashboardInputSx, dashboardPanelSx, dashboardShellSx, dashboardSubtleTextSx } from '../../Utils/DashboardTheme';

const UseApi = Api();

const DashboardPrincipal = () => {
    const [procedimento, setProcedimento] = useState(null);
    const [inputProcedimento, setInputProcedimento] = useState('');
    const [procedimentoService, setProcedimentoService] = useState(null);
    const [inputProcedimentoService, setInputProcedimentoService] = useState('');

    // Carrega a lista de procedimentos com cache de 10 minutos
    const { data: procedimentos = [] } = useQuery({
        queryKey: ['procedimentos'],
        queryFn: async () => {
            const response = await UseApi('procedimento');
            return Array.isArray(response) ? response : [];
        },
        staleTime: 1000 * 60 * 10,
    });

    // Carrega serviços por mês com cache inteligente
    const endpointMes = procedimento?.label
        ? `registros/totalpormes?servico=${encodeURIComponent(procedimento.label.toUpperCase())}`
        : 'registros/totalpormes';

    const { data: dadosMesResp = [], isLoading: loadingMes } = useQuery({
        queryKey: ['dashboard', 'totalPorMes', procedimento?.label || 'ALL'],
        queryFn: async () => {
            try {
                const response = await UseApi(endpointMes);
                return Array.isArray(response) ? response : [];
            } catch (error) {
                console.error('Erro ao buscar dados mensais:', error);
                return [];
            }
        },
    });

    const label = dadosMesResp.map((dados) => dados.mes);
    const data = dadosMesResp.map((dados) => dados.valor);

    // Carrega serviços por equipe com cache inteligente
    const endpointEquipe = procedimentoService?.label
        ? `registros/servicos/tecnico/mensal?servico=${encodeURIComponent(procedimentoService.label.toUpperCase())}`
        : 'registros/servicos/tecnico/mensal';

    const { data: dadosEquipeResp = [], isLoading: loadingEquipe } = useQuery({
        queryKey: ['dashboard', 'servicosEquipe', procedimentoService?.label || 'ALL'],
        queryFn: async () => {
            try {
                const response = await UseApi(endpointEquipe);
                return Array.isArray(response) ? response : [];
            } catch (error) {
                console.error('Erro ao buscar dados de equipe:', error);
                return [];
            }
        },
    });

    const labelEquipe = dadosEquipeResp.map((dados) => dados.equipe);
    const dataEquipe = dadosEquipeResp.map((dados) => dados.valor);

    return (
        <Box id="dashboard-registros-tecnicos-export" sx={{ display: 'grid', gap: 2, ...dashboardShellSx }}>
            <Paper variant="outlined" sx={dashboardHeaderSx}>
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2} alignItems={{ xs: 'stretch', md: 'center' }}>
                    <Box>
                        <Typography variant="h5" fontWeight={800}>Registros técnicos</Typography>
                        <Typography color="#e8f8ff">
                            Evolução mensal dos serviços e distribuição por equipe técnica.
                        </Typography>
                    </Box>
                    <ExportDashboardPdfButton
                        targetId="dashboard-registros-tecnicos-export"
                        title="Dashboard de registros técnicos"
                        fileName="dashboard-registros-tecnicos"
                    />
                </Stack>
            </Paper>

            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: '1fr' }}>
                <Paper variant="outlined" sx={{ ...dashboardPanelSx, p: 2.5, minWidth: 0 }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} gap={2} mb={2}>
                        <Box>
                            <Typography variant="h6" fontWeight={800}>Serviços por mês</Typography>
                            <Typography sx={dashboardSubtleTextSx} variant="body2">Volume histórico por procedimento.</Typography>
                        </Box>
                        <Box sx={{ width: { xs: '100%', md: 280 } }}>
                            <FieldAutoComplet
                                dadosProcedimento={procedimentos}
                                label="Procedimento"
                                aoAlterado={(value) => setProcedimento(value || null)}
                                onInputValueChange={setInputProcedimento}
                                valor={procedimento}
                                inputValue={inputProcedimento}
                                sx={dashboardInputSx}
                            />
                        </Box>
                    </Stack>
                    {loadingMes ? (
                        <Box sx={{ height: 320, display: 'grid', placeItems: 'center' }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <BasicLineChart xLabels={label} data={data} dark />
                    )}
                </Paper>

                <Paper variant="outlined" sx={{ ...dashboardPanelSx, p: 2.5, minWidth: 0 }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} gap={2} mb={2}>
                        <Box>
                            <Typography variant="h6" fontWeight={800}>Serviços por equipe</Typography>
                            <Typography sx={dashboardSubtleTextSx} variant="body2">Total mensal filtrado por procedimento.</Typography>
                        </Box>
                        <Box sx={{ width: { xs: '100%', md: 280 } }}>
                            <FieldAutoComplet
                                dadosProcedimento={procedimentos}
                                label="Procedimento"
                                aoAlterado={(value) => setProcedimentoService(value || null)}
                                onInputValueChange={setInputProcedimentoService}
                                valor={procedimentoService}
                                inputValue={inputProcedimentoService}
                                sx={dashboardInputSx}
                            />
                        </Box>
                    </Stack>
                    {loadingEquipe ? (
                        <Box sx={{ height: 320, display: 'grid', placeItems: 'center' }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <MixedBarChart xLabels={labelEquipe} uData={dataEquipe} dark />
                    )}
                </Paper>
            </Box>
        </Box>
    );
};

export default DashboardPrincipal;
