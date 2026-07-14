import * as React from 'react';
import { BarChart } from '@mui/x-charts/BarChart';
import dayjs from 'dayjs';
import BasicDatePicker from '../../Componentes/BasicDatePicker';
import {
    Box,
    MenuItem,
    Paper,
    Stack,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from '@mui/material';
import TabelaResumo from '../../Componentes/TabelaResumo';
import Api from '../../Services/Api';

const today = new Date();
const UseApi = Api();

const segmentOptions = {
    ATIVIDADE: 'Atividades',
    LEAD: 'Leads',
    COBRANCA: 'Cobrancas',
};

const chartSetting = {
    yAxis: [{ label: 'Total', width: 54 }],
    height: 340,
    margin: { top: 42, right: 24, bottom: 56, left: 54 },
};

const DashBoardsComercial = ({
    segmento: segmentoInicial = 'ATIVIDADE',
    allowSegmentSelect = true,
    segmentKeys = Object.keys(segmentOptions),
}) => {
    const [segmento, setSegmento] = React.useState(segmentoInicial);
    const [modoGrafico, setModoGrafico] = React.useState('mensal');
    const [dataDiario, setDataDiario] = React.useState(today.toISOString().slice(0, 10));
    const [dataMensal, setDataMensal] = React.useState(today.toISOString().slice(0, 10));
    const [atividades, setAtividades] = React.useState([]);
    const [resumoMensal, setResumoMensal] = React.useState([]);
    const visibleSegments = React.useMemo(() => segmentKeys.filter((key) => segmentOptions[key]), [segmentKeys]);

    React.useEffect(() => {
        setSegmento(segmentoInicial);
    }, [segmentoInicial]);

    React.useEffect(() => {
        if (!visibleSegments.includes(segmento)) {
            setSegmento(visibleSegments[0] || 'ATIVIDADE');
        }
    }, [segmento, visibleSegments]);

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const endpoint = modoGrafico === 'mensal'
                    ? `atividades/usuario/mensal?data=${dataMensal}&segmento=${segmento}`
                    : `atividades/usuario?filtro=${dataDiario}&segmento=${segmento}`;
                const response = await UseApi(endpoint);
                setAtividades(Array.isArray(response) ? response : []);
            } catch (err) {
                console.error(err);
                setAtividades([]);
            }
        };
        fetchData();
    }, [dataDiario, dataMensal, modoGrafico, segmento]);

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const resumo = await UseApi(`atividades/resumo/mensal?data=${dataMensal}&segmento=${segmento}`);
                setResumoMensal(Array.isArray(resumo) ? resumo : []);
            } catch (err) {
                console.error(err);
                setResumoMensal([]);
            }
        };
        fetchData();
    }, [dataMensal, segmento]);

    const labels = resumoMensal.map((item) => item.label.toLowerCase());
    const datasetConvertido = atividades.map((item) => {
        const novoItem = { usuario: item.usuario };
        item.atividades.forEach((atividade) => {
            const key = atividade.label && atividade.label.toLowerCase();
            novoItem[key] = atividade.value;
        });
        return novoItem;
    });
    const series = labels.map((label) => ({
        dataKey: label,
        label: label.charAt(0).toUpperCase() + label.slice(1),
    }));
    const hasChartData = datasetConvertido.some((item) => labels.some((label) => Number(item[label]) > 0));
    const totalMensal = resumoMensal.reduce((total, item) => total + (Number(item.value) || 0), 0);
    const chartTitle = modoGrafico === 'mensal' ? 'Producao mensal' : 'Producao diaria';
    const chartSubtitle = modoGrafico === 'mensal'
        ? 'Comparativo por usuario no mes selecionado.'
        : 'Comparativo por usuario no dia selecionado.';

    return (
        <Box sx={{ display: 'grid', gap: 2 }}>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2} alignItems={{ xs: 'stretch', md: 'center' }}>
                    <Box>
                        <Typography variant="h5" fontWeight={800}>Dashboard comercial</Typography>
                        <Typography color="text.secondary">
                            {segmentOptions[segmento]} por usuario com visao diaria ou mensal.
                        </Typography>
                    </Box>
                    {allowSegmentSelect && (
                        <TextField
                            select
                            size="small"
                            label="Dashboard"
                            value={segmento}
                            onChange={(event) => setSegmento(event.target.value)}
                            sx={{ minWidth: { xs: '100%', md: 260 } }}
                        >
                            {visibleSegments.map((key) => (
                                <MenuItem key={key} value={key}>{segmentOptions[key]}</MenuItem>
                            ))}
                        </TextField>
                    )}
                </Stack>
            </Paper>

            <Box sx={{ display: 'grid', gap: 2 }}>
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, minWidth: 0 }}>
                    <Stack direction={{ xs: 'column', lg: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', lg: 'center' }} gap={2} mb={2}>
                        <Box>
                            <Typography variant="h6" fontWeight={800}>{chartTitle}</Typography>
                            <Typography color="text.secondary" variant="body2">{chartSubtitle}</Typography>
                        </Box>
                        <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
                            <ToggleButtonGroup
                                exclusive
                                size="small"
                                value={modoGrafico}
                                onChange={(_, value) => value && setModoGrafico(value)}
                            >
                                <ToggleButton value="diario">Diario</ToggleButton>
                                <ToggleButton value="mensal">Mensal</ToggleButton>
                            </ToggleButtonGroup>
                            <Box sx={{ width: { xs: '100%', sm: 220 } }}>
                                {modoGrafico === 'mensal' ? (
                                    <BasicDatePicker
                                        aoAlterado={(valor) => setDataMensal(valor.toISOString().slice(0, 10))}
                                        label="Mes"
                                        valor={dayjs(dataMensal)}
                                        views={['year', 'month']}
                                        open="month"
                                    />
                                ) : (
                                    <BasicDatePicker
                                        aoAlterado={(valor) => setDataDiario(valor.toISOString().slice(0, 10))}
                                        label="Data"
                                        valor={dayjs(dataDiario)}
                                    />
                                )}
                            </Box>
                        </Stack>
                    </Stack>
                    {hasChartData ? (
                        <BarChart
                            dataset={datasetConvertido}
                            xAxis={[{ dataKey: 'usuario', scaleType: 'band' }]}
                            series={series}
                            {...chartSetting}
                        />
                    ) : (
                        <Box sx={{ height: 340, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
                            <Typography color="text.secondary">
                                Nenhum registro encontrado para o periodo selecionado.
                            </Typography>
                        </Box>
                    )}
                </Paper>

                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} gap={2} mb={2}>
                        <Box>
                            <Typography variant="h6" fontWeight={800}>Resumo mensal</Typography>
                            <Typography color="text.secondary" variant="body2">
                                Total do mes: <strong>{totalMensal.toLocaleString('pt-BR')}</strong>
                            </Typography>
                        </Box>
                        <Box sx={{ width: { xs: '100%', sm: 220 } }}>
                            <BasicDatePicker
                                aoAlterado={(valor) => setDataMensal(valor.toISOString().slice(0, 10))}
                                label="Mes"
                                valor={dayjs(dataMensal)}
                                views={['year', 'month']}
                                open="month"
                            />
                        </Box>
                    </Stack>
                    <TabelaResumo rows={resumoMensal} />
                </Paper>
            </Box>
        </Box>
    );
};

export default DashBoardsComercial;
