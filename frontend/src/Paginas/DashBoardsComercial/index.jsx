import * as React from 'react';
import { BarChart } from '@mui/x-charts/BarChart';
import { LineChart } from '@mui/x-charts/LineChart';
import { PieChart } from '@mui/x-charts/PieChart';
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
import ExportDashboardPdfButton from '../../Componentes/ExportDashboardPdfButton';
import ChartValueList from '../../Componentes/ChartValueList';
import {
    dashboardHeaderSx,
    dashboardHeaderInputSx,
    dashboardInputSx,
    dashboardMetricSx,
    dashboardMutedTextSx,
    dashboardPanelSx,
    dashboardShellSx,
    dashboardSubtleTextSx,
} from '../../Utils/DashboardTheme';

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

const chartColors = ['#0f4c81', '#2f80c0', '#2D9C75', '#f97316', '#8a9f20', '#c89b08', '#8064c8', '#8aa0ad'];
const cancellationColor = '#d32f2f';
const postSaleColor = '#7c3aed';

function normalizeChartLabel(label) {
    return String(label || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[-_]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toUpperCase();
}

function chartColorForLabel(label, index) {
    const normalized = normalizeChartLabel(label);
    if (normalized === 'CANCELAMENTO') return cancellationColor;
    if (normalized === 'POS VENDA') return postSaleColor;
    return chartColors[index % chartColors.length];
}
const reportPanelSx = dashboardPanelSx;
const reportChartSx = {
    '& .MuiChartsAxis-line, & .MuiChartsAxis-tick': { stroke: '#31545f !important' },
    '& .MuiChartsAxis-tickLabel, & .MuiChartsAxis-label': { fill: '#0f2630 !important' },
    '& .MuiChartsLegend-label': { fill: '#0f2630 !important' },
    '& .MuiChartsGrid-line': { stroke: 'rgba(15,38,48,0.12)' },
    '.dark & .MuiChartsAxis-line, .dark & .MuiChartsAxis-tick': { stroke: '#dce8f5 !important' },
    '.dark & .MuiChartsAxis-tickLabel, .dark & .MuiChartsAxis-label': { fill: '#f8fbff !important' },
    '.dark & .MuiChartsLegend-label': { fill: '#f8fbff !important' },
    '.dark & .MuiChartsGrid-line': { stroke: 'rgba(255,255,255,0.12)' },
};

function formatMoney(value) {
    return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatNumber(value) {
    return Number(value || 0).toLocaleString('pt-BR');
}

function sumBy(items, keyGetter, valueGetter = () => 1) {
    return items.reduce((acc, item) => {
        const key = keyGetter(item) || 'Nao informado';
        const atual = acc[key] || { label: key, quantidade: 0, valor: 0 };
        atual.quantidade += 1;
        atual.valor += Number(valueGetter(item) || 0);
        acc[key] = atual;
        return acc;
    }, {});
}

function rankedItems(grouped, limit = 10, sortKey = 'valor') {
    return Object.values(grouped)
        .sort((a, b) => Number(b[sortKey] || 0) - Number(a[sortKey] || 0) || b.quantidade - a.quantidade)
        .slice(0, limit);
}

function cleanClientName(value) {
    return String(value || 'Nao informado').replace(/^\s*\d+\s*-\s*/, '').trim() || 'Nao informado';
}

const planByValue = [
    { value: 74.99, label: '250MB' },
    { value: 109.99, label: '500MB' },
    { value: 129.99, label: '600MB' },
    { value: 149.99, label: '800MB' },
    { value: 199.99, label: '1G' },
];

function planLabelByValue(value) {
    const numericValue = Number(value || 0);
    const found = planByValue.find((plan) => Math.abs(plan.value - numericValue) < 0.01);
    return found ? found.label : `Outro (${formatMoney(numericValue)})`;
}

const ChartCard = ({ title, subtitle, children, dark = false, sx, className }) => (
    <Paper
        className={className}
        variant="outlined"
        sx={{
            p: 2,
            borderRadius: dark ? 1.5 : 2,
            minWidth: 0,
            ...(dark ? reportPanelSx : {}),
            ...sx,
        }}
    >
            <Typography variant="h6" fontWeight={800}>{title}</Typography>
        {subtitle && (
            <Typography sx={dark ? dashboardSubtleTextSx : undefined} color={dark ? undefined : 'text.secondary'} variant="body2" mb={2}>
                {subtitle}
            </Typography>
        )}
        {children}
    </Paper>
);

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
    const [registrosMensais, setRegistrosMensais] = React.useState([]);
    const [registrosAnuais, setRegistrosAnuais] = React.useState([]);
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

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const registros = await UseApi(`atividades/registro/mensal?data=${dataMensal}&segmento=${segmento}`);
                setRegistrosMensais(Array.isArray(registros) ? registros : []);
            } catch (err) {
                console.error(err);
                setRegistrosMensais([]);
            }
        };
        fetchData();
    }, [dataMensal, segmento]);

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const registros = await UseApi(`atividades/registro/anual?data=${dataMensal}&segmento=${segmento}`);
                setRegistrosAnuais(Array.isArray(registros) ? registros : []);
            } catch (err) {
                console.error(err);
                setRegistrosAnuais([]);
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
        color: chartColorForLabel(label),
    }));
    const hasChartData = datasetConvertido.some((item) => labels.some((label) => Number(item[label]) > 0));
    const totalMensal = resumoMensal.reduce((total, item) => total + (Number(item.value) || 0), 0);
    const chartTitle = modoGrafico === 'mensal' ? 'Producao mensal' : 'Producao diaria';
    const chartSubtitle = modoGrafico === 'mensal'
        ? 'Comparativo por usuario no mes selecionado.'
        : 'Comparativo por usuario no dia selecionado.';
    const chartSummaryItems = datasetConvertido.map((item, index) => ({
        label: item.usuario || 'Nao informado',
        value: labels.reduce((total, label) => total + Number(item[label] || 0), 0),
        color: chartColors[index % chartColors.length],
    }));
    const leadMetrics = React.useMemo(() => {
        const convertidos = registrosMensais.filter((item) => item.status === 'CONVERTIDO');
        const abertos = registrosMensais.filter((item) => (item.status || 'ABERTO') !== 'CONVERTIDO');
        const valorConvertido = convertidos.reduce((total, item) => total + Number(item.valorPlano || item.valor || 0), 0);
        const grupos = new Set(convertidos.map((item) => item.grupoCliente).filter(Boolean));
        const convertidosAnuais = registrosAnuais.filter((item) => item.status === 'CONVERTIDO');
        const valorAnual = convertidosAnuais.reduce((total, item) => total + Number(item.valorPlano || item.valor || 0), 0);
        return { convertidos: convertidos.length, abertos: abertos.length, valorConvertido, grupos: grupos.size, vendasAnuais: convertidosAnuais.length, valorAnual };
    }, [registrosAnuais, registrosMensais]);

    const monthlySales = React.useMemo(() => {
        const monthNames = Array.from({ length: 12 }, (_, index) => (
            new Date(2000, index, 1).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
        ));
        const totals = monthNames.map((label, index) => ({ mes: label, vendas: 0 }));

        registrosAnuais
            .filter((item) => item.status === 'CONVERTIDO' && item.data)
            .forEach((item) => {
                const monthIndex = new Date(`${item.data}T00:00:00`).getMonth();
                if (totals[monthIndex]) {
                    totals[monthIndex].vendas += 1;
                }
            });

        return totals;
    }, [registrosAnuais]);

    const monthlySalesItems = monthlySales.map((item, index) => ({
        label: item.mes,
        value: item.vendas,
        color: chartColors[index % chartColors.length],
    }));

    const convertedMonth = React.useMemo(
        () => registrosMensais.filter((item) => item.status === 'CONVERTIDO'),
        [registrosMensais],
    );

    const convertedYear = React.useMemo(
        () => registrosAnuais.filter((item) => item.status === 'CONVERTIDO'),
        [registrosAnuais],
    );

    const leadSalesRanking = React.useMemo(() => (
        rankedItems(
            sumBy(convertedMonth, (item) => item.convertidoPor || item.usuario, (item) => item.valorPlano || item.valor),
            10,
            'valor',
        ).map((item) => ({ usuario: item.label, quantidade: item.quantidade, valor: item.valor }))
    ), [convertedMonth]);

    const leadCountDataset = leadSalesRanking.map((item) => ({ usuario: item.usuario, vendas: item.quantidade }));
    const leadCountItems = leadSalesRanking.map((item, index) => ({
        label: item.usuario,
        value: item.quantidade,
        color: chartColors[index % chartColors.length],
    }));

    const monthlyPlanDistribution = React.useMemo(() => {
        const grouped = convertedMonth.reduce((acc, item) => {
            const valor = Number(item.valorPlano || item.valor || 0);
            const label = planLabelByValue(valor);
            const atual = acc[label] || { label, quantidade: 0, valorUnitario: valor, receita: 0 };
            atual.quantidade += 1;
            atual.receita += valor;
            acc[label] = atual;
            return acc;
        }, {});

        return Object.values(grouped)
            .sort((a, b) => b.quantidade - a.quantidade || b.receita - a.receita)
            .map((item, index) => ({
                id: item.label,
                label: `${item.label} - ${formatMoney(item.valorUnitario)}`,
                value: item.quantidade,
                receita: item.receita,
                color: chartColors[index % chartColors.length],
            }));
    }, [convertedMonth]);

    const commercialReport = React.useMemo(() => {
        const totalMes = convertedMonth.reduce((total, item) => total + Number(item.valorPlano || item.valor || 0), 0);
        const totalAno = convertedYear.reduce((total, item) => total + Number(item.valorPlano || item.valor || 0), 0);
        const ticketMedio = convertedMonth.length ? totalMes / convertedMonth.length : 0;
        const ticketMedioAnual = convertedYear.length ? totalAno / convertedYear.length : 0;

        const topClientes = rankedItems(
            sumBy(convertedYear, (item) => cleanClientName(item.cliente), (item) => item.valorPlano || item.valor),
            8,
            'valor',
        );
        const planos = rankedItems(
            sumBy(convertedYear, (item) => item.plano, (item) => item.valorPlano || item.valor),
            10,
            'quantidade',
        );
        const origens = rankedItems(
            sumBy(convertedYear, (item) => item.evento, (item) => item.valorPlano || item.valor),
            10,
            'quantidade',
        );
        const grupos = rankedItems(
            sumBy(convertedYear, (item) => item.grupoCliente, (item) => item.valorPlano || item.valor),
            10,
            'valor',
        );

        return { totalMes, totalAno, ticketMedio, ticketMedioAnual, topClientes, planos, origens, grupos };
    }, [convertedMonth, convertedYear]);

    const reportListItems = (items, valueKey = 'valor') => items.map((item, index) => ({
        label: item.label,
        value: valueKey === 'valor' ? item.valor : item.quantidade,
        color: chartColorForLabel(item.label, index),
    }));
    const isLeadDashboard = segmento === 'LEAD';
    const isExecutiveDashboard = true;

    return (
        <Box
            id="dashboard-comercial-export"
            sx={{
                display: 'grid',
                gap: 1.5,
                ...(isExecutiveDashboard ? dashboardShellSx : {}),
            }}
        >
            <Paper
                className={isLeadDashboard ? 'commercial-dashboard-title' : undefined}
                variant="outlined"
                sx={{
                    p: 1.5,
                    borderRadius: 1,
                    ...(isExecutiveDashboard ? { ...dashboardHeaderSx, textAlign: 'center' } : {}),
                }}
            >
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2} alignItems={{ xs: 'stretch', md: 'center' }}>
                    <Box>
                        <Typography variant={isLeadDashboard ? 'h4' : 'h5'} fontWeight={800}>Dashboard comercial</Typography>
                        <Typography color="#e8f8ff">
                            {isLeadDashboard ? 'Acompanhamento executivo de vendas convertidas' : `${segmentOptions[segmento]} por usuario com visao diaria ou mensal.`}
                        </Typography>
                    </Box>
                    <Stack direction={{ xs: 'column', sm: 'row' }} gap={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
                        <ExportDashboardPdfButton
                            targetId="dashboard-comercial-export"
                            title={`Dashboard comercial - ${segmentOptions[segmento]}`}
                            fileName={`dashboard-comercial-${segmento.toLowerCase()}`}
                        />
                        {isLeadDashboard && (
                            <Box
                                sx={{
                                    width: { xs: '100%', sm: 220 },
                                }}
                            >
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Mes/ano"
                                    type="month"
                                    value={dataMensal.slice(0, 7)}
                                    onChange={(event) => setDataMensal(`${event.target.value}-01`)}
                                    InputLabelProps={{ shrink: true }}
                                    sx={dashboardHeaderInputSx}
                                />
                            </Box>
                        )}
                        {allowSegmentSelect && (
                            <TextField
                                select
                                size="small"
                                label="Dashboard"
                                value={segmento}
                                onChange={(event) => setSegmento(event.target.value)}
                                sx={{ minWidth: { xs: '100%', md: 260 }, ...dashboardHeaderInputSx }}
                            >
                                {visibleSegments.map((key) => (
                                    <MenuItem key={key} value={key}>{segmentOptions[key]}</MenuItem>
                                ))}
                            </TextField>
                        )}
                    </Stack>
                </Stack>
            </Paper>

            {segmento === 'LEAD' && (
                <Box className="commercial-metric-grid" sx={{ display: 'grid', gap: 1.25, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' } }}>
                    {[
                        ['Leads no mes', registrosMensais.length, 'registros cadastrados'],
                        ['Convertidos', leadMetrics.convertidos, 'vendas confirmadas'],
                        ['Vendas no mes', formatMoney(commercialReport.totalMes), `${formatNumber(leadMetrics.convertidos)} venda(s)`],
                        ['Em acompanhamento', leadMetrics.abertos, 'aguardando conversao'],
                        ['Ticket medio mensal', formatMoney(commercialReport.ticketMedio), `${formatNumber(leadMetrics.convertidos)} venda(s) no mes`],
                        ['Vendas no ano', leadMetrics.vendasAnuais, formatMoney(leadMetrics.valorAnual)],
                        ['Total anual', formatMoney(commercialReport.totalAno), `${formatNumber(convertedYear.length)} venda(s)`],
                        ['Ticket medio anual', formatMoney(commercialReport.ticketMedioAnual), 'media do ano selecionado'],
                    ].map(([label, value, detail]) => (
                        <Paper
                            className="commercial-metric-card"
                            key={label}
                            variant="outlined"
                            sx={{
                                ...dashboardMetricSx,
                                p: 1.5,
                                minHeight: 96,
                            }}
                        >
                            <Typography sx={dashboardSubtleTextSx} variant="body2" fontWeight={700}>{label}</Typography>
                            <Typography variant="h5" fontWeight={900}>{value}</Typography>
                            <Typography sx={dashboardMutedTextSx} variant="caption">{detail}</Typography>
                        </Paper>
                    ))}
                </Box>
            )}

            {segmento === 'LEAD' && (
                <Box sx={{ display: 'grid', gap: 1.5 }}>
                    <ChartCard
                        className="commercial-chart-card"
                        dark
                        title="Evolucao de vendas no ano"
                        subtitle="Linha do tempo de vendas convertidas."
                    >
                        {monthlySales.some((item) => item.vendas > 0) ? (
                            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 280px' }, alignItems: 'center' }}>
                                <Box sx={{ minWidth: 0 }}>
                                    <LineChart
                                        dataset={monthlySales}
                                        xAxis={[{ dataKey: 'mes', scaleType: 'point' }]}
                                        series={[{ dataKey: 'vendas', label: 'Vendas', area: true, color: '#0f4c81' }]}
                                        height={340}
                                        margin={{ top: 35, right: 24, bottom: 56, left: 54 }}
                                        sx={reportChartSx}
                                    />
                                </Box>
                                <ChartValueList items={monthlySalesItems} showPercent={false} />
                            </Box>
                        ) : (
                            <Box sx={{ height: 240, display: 'grid', placeItems: 'center' }}>
                                <Typography color="text.secondary">Nenhuma venda convertida no ano selecionado.</Typography>
                            </Box>
                        )}
                    </ChartCard>

                    <ChartCard
                        className="commercial-chart-card"
                        dark
                        title="Planos convertidos por valor"
                        subtitle="Pizza mensal pela quantidade vendida em cada plano."
                    >
                        {monthlyPlanDistribution.length ? (
                            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 280px' }, alignItems: 'center' }}>
                                <Box sx={{ minWidth: 0 }}>
                                    <PieChart
                                        series={[{
                                            data: monthlyPlanDistribution,
                                            innerRadius: 70,
                                            outerRadius: 135,
                                            paddingAngle: 2,
                                            cornerRadius: 3,
                                            valueFormatter: ({ value }) => `${formatNumber(value)} venda(s)`,
                                        }]}
                                        slotProps={{ legend: { hidden: true } }}
                                        height={340}
                                        sx={reportChartSx}
                                    />
                                </Box>
                                <ChartValueList
                                    items={monthlyPlanDistribution}
                                    valueFormatter={(value) => `${formatNumber(value)} venda(s)`}
                                    showPercent
                                />
                            </Box>
                        ) : (
                            <Box sx={{ height: 260, display: 'grid', placeItems: 'center' }}>
                                <Typography color="text.secondary">Nenhum plano convertido no mes selecionado.</Typography>
                            </Box>
                        )}
                    </ChartCard>

                    <ChartCard
                        className="commercial-chart-card"
                        dark
                        title="Quantidade de vendas por usuario"
                        subtitle="Ranking mensal pela quantidade de leads convertidos em venda."
                    >
                        {leadSalesRanking.length ? (
                            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 280px' }, alignItems: 'center' }}>
                                <Box sx={{ minWidth: 0 }}>
                                    <BarChart
                                        dataset={leadCountDataset}
                                        xAxis={[{ dataKey: 'usuario', scaleType: 'band' }]}
                                        series={[{ dataKey: 'vendas', label: 'Vendas', color: '#0f4c81' }]}
                                        height={320}
                                        margin={{ top: 35, right: 20, bottom: 70, left: 54 }}
                                        sx={reportChartSx}
                                    />
                                </Box>
                                <ChartValueList items={leadCountItems} showPercent={false} />
                            </Box>
                        ) : (
                            <Box sx={{ height: 240, display: 'grid', placeItems: 'center' }}>
                                <Typography color="text.secondary">Nenhuma venda convertida no mes selecionado.</Typography>
                            </Box>
                        )}
                    </ChartCard>

                    <ChartCard
                        className="commercial-chart-card"
                        dark
                        title="Top clientes convertidos"
                        subtitle="Clientes com maior valor vendido no ano selecionado."
                    >
                        {commercialReport.topClientes.length ? (
                            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 280px' }, alignItems: 'center' }}>
                                <Box sx={{ minWidth: 0 }}>
                                    <BarChart
                                        dataset={commercialReport.topClientes}
                                        yAxis={[{ dataKey: 'label', scaleType: 'band', width: 260 }]}
                                        series={[{
                                            dataKey: 'valor',
                                            label: 'Valor',
                                            color: '#0f4c81',
                                            valueFormatter: formatMoney,
                                        }]}
                                        layout="horizontal"
                                        height={320}
                                        margin={{ top: 35, right: 24, bottom: 36, left: 260 }}
                                        sx={reportChartSx}
                                    />
                                </Box>
                                <ChartValueList items={reportListItems(commercialReport.topClientes, 'valor')} valueFormatter={formatMoney} showPercent={false} />
                            </Box>
                        ) : (
                            <Box sx={{ height: 240, display: 'grid', placeItems: 'center' }}>
                                <Typography color="text.secondary">Nenhum cliente convertido no ano selecionado.</Typography>
                            </Box>
                        )}
                    </ChartCard>

                    <ChartCard
                        className="commercial-chart-card"
                        dark
                        title="Produtos mais vendidos"
                        subtitle="Planos com maior quantidade de vendas convertidas no ano."
                    >
                        {commercialReport.planos.length ? (
                            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 280px' }, alignItems: 'center' }}>
                                <Box sx={{ minWidth: 0 }}>
                                    <BarChart
                                        dataset={commercialReport.planos}
                                        xAxis={[{ dataKey: 'label', scaleType: 'band' }]}
                                        series={[{ dataKey: 'quantidade', label: 'Vendas', color: '#0f4c81' }]}
                                        height={320}
                                        margin={{ top: 35, right: 24, bottom: 70, left: 54 }}
                                        sx={reportChartSx}
                                    />
                                </Box>
                                <ChartValueList items={reportListItems(commercialReport.planos, 'quantidade')} showPercent={false} />
                            </Box>
                        ) : (
                            <Box sx={{ height: 240, display: 'grid', placeItems: 'center' }}>
                                <Typography color="text.secondary">Nenhum plano vendido no ano selecionado.</Typography>
                            </Box>
                        )}
                    </ChartCard>

                    <Box className="commercial-two-column-grid" sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' } }}>
                        <ChartCard
                            className="commercial-chart-card"
                            dark
                            title="Participacao por origem"
                            subtitle="De onde vieram os leads que foram convertidos no ano."
                        >
                            {commercialReport.origens.length ? (
                                <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 260px' }, alignItems: 'center' }}>
                                    <PieChart
                                        series={[{
                                            data: commercialReport.origens.map((item, index) => ({
                                                id: item.label,
                                                label: item.label,
                                                value: item.quantidade,
                                                color: chartColorForLabel(item.label, index),
                                            })),
                                            innerRadius: 55,
                                        }]}
                                        slotProps={{ legend: { hidden: true } }}
                                        height={300}
                                        sx={reportChartSx}
                                    />
                                    <ChartValueList items={reportListItems(commercialReport.origens, 'quantidade')} showPercent={false} />
                                </Box>
                            ) : (
                                <Box sx={{ height: 220, display: 'grid', placeItems: 'center' }}>
                                    <Typography color="text.secondary">Nenhuma origem convertida no ano.</Typography>
                                </Box>
                            )}
                        </ChartCard>

                        <ChartCard
                            className="commercial-chart-card"
                            dark
                            title="Vendas por grupo"
                            subtitle="Valor vendido por grupo de cliente no ano selecionado."
                        >
                            {commercialReport.grupos.length ? (
                                <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 260px' }, alignItems: 'center' }}>
                                    <PieChart
                                        series={[{
                                            data: commercialReport.grupos.map((item, index) => ({
                                                id: item.label,
                                                label: item.label,
                                                value: Number(item.valor.toFixed(2)),
                                                color: chartColors[index % chartColors.length],
                                            })),
                                            innerRadius: 55,
                                            valueFormatter: ({ value }) => formatMoney(value),
                                        }]}
                                        slotProps={{ legend: { hidden: true } }}
                                        height={300}
                                        sx={reportChartSx}
                                    />
                                    <ChartValueList items={reportListItems(commercialReport.grupos, 'valor')} valueFormatter={formatMoney} showPercent={false} />
                                </Box>
                            ) : (
                                <Box sx={{ height: 220, display: 'grid', placeItems: 'center' }}>
                                    <Typography color="text.secondary">Nenhum grupo convertido no ano.</Typography>
                                </Box>
                            )}
                        </ChartCard>
                    </Box>
                </Box>
            )}

            {segmento !== 'LEAD' && <Box sx={{ display: 'grid', gap: 2 }}>
                <Paper variant="outlined" sx={{ ...reportPanelSx, p: 2.5, minWidth: 0 }}>
                    <Stack direction={{ xs: 'column', lg: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', lg: 'center' }} gap={2} mb={2}>
                        <Box>
                            <Typography variant="h6" fontWeight={800}>{chartTitle}</Typography>
                            <Typography sx={dashboardSubtleTextSx} variant="body2">{chartSubtitle}</Typography>
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
                        <Box
                            sx={{
                                display: 'grid',
                                gap: 2,
                                gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 260px' },
                                alignItems: 'center',
                            }}
                        >
                            <Box sx={{ minWidth: 0 }}>
                                    <BarChart
                                        dataset={datasetConvertido}
                                        xAxis={[{ dataKey: 'usuario', scaleType: 'band' }]}
                                        series={series}
                                        {...chartSetting}
                                        sx={reportChartSx}
                                    />
                            </Box>
                            <ChartValueList items={chartSummaryItems} showPercent={false} />
                        </Box>
                    ) : (
                        <Box sx={{ height: 340, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
                            <Typography sx={dashboardMutedTextSx}>
                                Nenhum registro encontrado para o periodo selecionado.
                            </Typography>
                        </Box>
                    )}
                </Paper>

                <Paper variant="outlined" sx={{ ...reportPanelSx, p: 2.5 }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} gap={2} mb={2}>
                        <Box>
                            <Typography variant="h6" fontWeight={800}>Resumo mensal</Typography>
                            <Typography sx={dashboardSubtleTextSx} variant="body2">
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
                    <TabelaResumo rows={resumoMensal} dark />
                </Paper>
            </Box>}
        </Box>
    );
};

export default DashBoardsComercial;
