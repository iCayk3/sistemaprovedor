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
import ExportDashboardPdfButton from '../../Componentes/ExportDashboardPdfButton';
import ChartValueList from '../../Componentes/ChartValueList';

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
        color: ['#4454f6', '#ffb627', '#ff5b6e', '#28b8ee', '#2fc878', '#ec79c1', '#8e6ce8', '#19b5a5'][index % 8],
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
        color: ['#4454f6', '#ffb627', '#ff5b6e', '#28b8ee', '#2fc878', '#ec79c1'][index % 6],
    }));

    const leadSalesRanking = React.useMemo(() => {
        const porUsuario = registrosMensais
            .filter((item) => item.status === 'CONVERTIDO')
            .reduce((acc, item) => {
                const usuario = item.convertidoPor || item.usuario || 'Nao informado';
                const atual = acc[usuario] || { usuario, quantidade: 0, valor: 0 };
                atual.quantidade += 1;
                atual.valor += Number(item.valorPlano || item.valor || 0);
                acc[usuario] = atual;
                return acc;
            }, {});

        return Object.values(porUsuario).sort((a, b) => b.valor - a.valor || b.quantidade - a.quantidade);
    }, [registrosMensais]);

    const leadValueDataset = leadSalesRanking.map((item) => ({ usuario: item.usuario, valor: Number(item.valor.toFixed(2)) }));
    const leadCountDataset = leadSalesRanking.map((item) => ({ usuario: item.usuario, vendas: item.quantidade }));
    const leadValueItems = leadSalesRanking.map((item, index) => ({
        label: item.usuario,
        value: item.valor,
        color: ['#4454f6', '#ffb627', '#ff5b6e', '#28b8ee', '#2fc878', '#ec79c1'][index % 6],
    }));
    const leadCountItems = leadSalesRanking.map((item, index) => ({
        label: item.usuario,
        value: item.quantidade,
        color: ['#4454f6', '#ffb627', '#ff5b6e', '#28b8ee', '#2fc878', '#ec79c1'][index % 6],
    }));

    return (
        <Box id="dashboard-comercial-export" sx={{ display: 'grid', gap: 2 }}>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2} alignItems={{ xs: 'stretch', md: 'center' }}>
                    <Box>
                        <Typography variant="h5" fontWeight={800}>Dashboard comercial</Typography>
                        <Typography color="text.secondary">
                            {segmentOptions[segmento]} por usuario com visao diaria ou mensal.
                        </Typography>
                    </Box>
                    <Stack direction={{ xs: 'column', sm: 'row' }} gap={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
                        <ExportDashboardPdfButton
                            targetId="dashboard-comercial-export"
                            title={`Dashboard comercial - ${segmentOptions[segmento]}`}
                            fileName={`dashboard-comercial-${segmento.toLowerCase()}`}
                        />
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
                </Stack>
            </Paper>

            {segmento === 'LEAD' && (
                <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' } }}>
                    {[
                        ['Leads no mes', registrosMensais.length, 'registros cadastrados'],
                        ['Convertidos', leadMetrics.convertidos, 'vendas confirmadas'],
                        ['Vendas no mes', leadMetrics.convertidos, leadMetrics.valorConvertido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })],
                        ['Em acompanhamento', leadMetrics.abertos, 'aguardando conversao'],
                        ['Valor convertido', leadMetrics.valorConvertido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), `${leadMetrics.grupos} grupo(s)`],
                        ['Vendas no ano', leadMetrics.vendasAnuais, leadMetrics.valorAnual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })],
                    ].map(([label, value, detail]) => (
                        <Paper key={label} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                            <Typography color="text.secondary" variant="body2">{label}</Typography>
                            <Typography variant="h5" fontWeight={800}>{value}</Typography>
                            <Typography color="text.secondary" variant="caption">{detail}</Typography>
                        </Paper>
                    ))}
                </Box>
            )}

            {segmento === 'LEAD' && (
                <Box sx={{ display: 'grid', gap: 2 }}>
                    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, minWidth: 0 }}>
                        <Typography variant="h6" fontWeight={800}>Valores convertidos por usuario</Typography>
                        <Typography color="text.secondary" variant="body2" mb={2}>
                            Ranking mensal de vendas convertidas pelo usuario responsavel.
                        </Typography>
                        {leadSalesRanking.length ? (
                            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 280px' }, alignItems: 'center' }}>
                                <Box sx={{ minWidth: 0 }}>
                                    <BarChart
                                        dataset={leadValueDataset}
                                        xAxis={[{ dataKey: 'usuario', scaleType: 'band' }]}
                                        series={[{
                                            dataKey: 'valor',
                                            label: 'Valor convertido',
                                            valueFormatter: (value) => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                                        }]}
                                        height={340}
                                        margin={{ top: 35, right: 20, bottom: 70, left: 70 }}
                                    />
                                </Box>
                                <ChartValueList
                                    items={leadValueItems}
                                    valueFormatter={(value) => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    showPercent={false}
                                />
                            </Box>
                        ) : (
                            <Box sx={{ height: 260, display: 'grid', placeItems: 'center' }}>
                                <Typography color="text.secondary">Nenhuma venda convertida no mes selecionado.</Typography>
                            </Box>
                        )}
                    </Paper>

                    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, minWidth: 0 }}>
                        <Typography variant="h6" fontWeight={800}>Vendas por mes no ano</Typography>
                        <Typography color="text.secondary" variant="body2" mb={2}>
                            Quantidade de leads convertidos em cada mes do ano selecionado.
                        </Typography>
                        {monthlySales.some((item) => item.vendas > 0) ? (
                            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 280px' }, alignItems: 'center' }}>
                                <Box sx={{ minWidth: 0 }}>
                                    <BarChart
                                        dataset={monthlySales}
                                        xAxis={[{ dataKey: 'mes', scaleType: 'band' }]}
                                        series={[{ dataKey: 'vendas', label: 'Vendas' }]}
                                        height={320}
                                        margin={{ top: 35, right: 20, bottom: 56, left: 54 }}
                                    />
                                </Box>
                                <ChartValueList items={monthlySalesItems} showPercent={false} />
                            </Box>
                        ) : (
                            <Box sx={{ height: 240, display: 'grid', placeItems: 'center' }}>
                                <Typography color="text.secondary">Nenhuma venda convertida no ano selecionado.</Typography>
                            </Box>
                        )}
                    </Paper>

                    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, minWidth: 0 }}>
                        <Typography variant="h6" fontWeight={800}>Quantidade de vendas por usuario</Typography>
                        <Typography color="text.secondary" variant="body2" mb={2}>
                            Ranking mensal pela quantidade de leads convertidos em venda.
                        </Typography>
                        {leadSalesRanking.length ? (
                            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 280px' }, alignItems: 'center' }}>
                                <Box sx={{ minWidth: 0 }}>
                                    <BarChart
                                        dataset={leadCountDataset}
                                        xAxis={[{ dataKey: 'usuario', scaleType: 'band' }]}
                                        series={[{ dataKey: 'vendas', label: 'Vendas' }]}
                                        height={320}
                                        margin={{ top: 35, right: 20, bottom: 70, left: 54 }}
                                    />
                                </Box>
                                <ChartValueList items={leadCountItems} showPercent={false} />
                            </Box>
                        ) : (
                            <Box sx={{ height: 240, display: 'grid', placeItems: 'center' }}>
                                <Typography color="text.secondary">Nenhuma venda convertida no mes selecionado.</Typography>
                            </Box>
                        )}
                    </Paper>
                </Box>
            )}

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
                                />
                            </Box>
                            <ChartValueList items={chartSummaryItems} showPercent={false} />
                        </Box>
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
