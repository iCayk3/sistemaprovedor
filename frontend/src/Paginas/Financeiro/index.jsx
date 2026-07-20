import { useEffect, useState } from "react";
import BasicCard from "../../Componentes/BasicCard";
import BasicDatePicker from "../../Componentes/BasicDatePicker";
import DashPizza from "../../Componentes/DashPizza";
import Api from "../../Services/Api";
import dayjs from "dayjs";
import { Box, Paper, Stack, Typography } from "@mui/material";
import ExportDashboardPdfButton from "../../Componentes/ExportDashboardPdfButton";
import { dashboardHeaderSx, dashboardInputSx, dashboardPanelSx, dashboardShellSx } from "../../Utils/DashboardTheme";

const today = new Date();
const UseApi = Api();

const Financeiro = () => {
    const [dataConsulta, setDataConsulta] = useState(today.toISOString().slice(0, 10));
    const [boletosBaixados, setBoletosBaixados] = useState({});
    const [boletosAbertos, setBoletosAbertos] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                const bbaixados = await UseApi(`rbx/boletosbaixados?data=${dataConsulta}`, 'POST');
                const babertos = await UseApi('rbx/boletosabertos', 'POST');
                setBoletosBaixados(bbaixados);
                setBoletosAbertos(babertos);
            } catch (error) {
                console.error('Erro ao buscar dados:', error);
            }
        };

        fetchData();
    }, [dataConsulta]);

    return (
        <Box id="dashboard-financeiro-export" sx={{ display: 'grid', gap: 2, ...dashboardShellSx }}>
            <Paper variant="outlined" sx={dashboardHeaderSx}>
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} gap={2}>
                    <Box>
                        <Typography variant="h5" fontWeight={800}>Financeiro</Typography>
                        <Typography color="#e8f8ff">Boletos baixados e boletos em aberto por cidade.</Typography>
                    </Box>
                    <Stack direction={{ xs: 'column', sm: 'row' }} gap={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
                        <ExportDashboardPdfButton
                            targetId="dashboard-financeiro-export"
                            title="Dashboard financeiro"
                            fileName="dashboard-financeiro"
                        />
                        <Box sx={{ width: { xs: '100%', sm: 220 } }}>
                            <BasicDatePicker
                                valor={dayjs(dataConsulta)}
                                aoAlterado={(value) => setDataConsulta(value.toISOString().slice(0, 10))}
                                label="Data"
                                textFieldSx={dashboardInputSx}
                            />
                        </Box>
                    </Stack>
                </Stack>
            </Paper>

            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', xl: '1fr 1fr' } }}>
                <Paper variant="outlined" sx={{ ...dashboardPanelSx, p: 2.5, minWidth: 0 }}>
                    <BasicCard dark data={dataConsulta} valor={(boletosBaixados.valor || 0) / 2} titulo="Total em valor de boletos liquidados dia" />
                    <Box sx={{ mt: 2 }}>
                        <DashPizza uri={`rbx/boletosbaixadoscidade?data=${dataConsulta}`} metodo="POST" financeiro />
                    </Box>
                </Paper>
                <Paper variant="outlined" sx={{ ...dashboardPanelSx, p: 2.5, minWidth: 0 }}>
                    <BasicCard dark valor={boletosAbertos.Valor || 0} titulo="Total de boletos abertos" boletoAberto />
                    <Box sx={{ mt: 2 }}>
                        <DashPizza uri="rbx/boletosabertos/cidade" metodo="POST" financeiro />
                    </Box>
                </Paper>
            </Box>
        </Box>
    );
};

export default Financeiro;
