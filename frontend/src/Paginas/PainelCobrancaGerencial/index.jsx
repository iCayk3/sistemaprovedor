import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import FileUploadRoundedIcon from '@mui/icons-material/FileUploadRounded';
import FlagRoundedIcon from '@mui/icons-material/FlagRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import SyncRoundedIcon from '@mui/icons-material/SyncRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import { BarChart, PieChart } from '@mui/x-charts';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Divider,
    LinearProgress,
    Paper,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import Api from '../../Services/Api';
import {
    dashboardHeaderSx,
    dashboardChartSx,
    dashboardInputSx,
    dashboardMutedTextSx,
    dashboardPanelSx,
    dashboardShellSx,
    dashboardSubtleTextSx,
} from '../../Utils/DashboardTheme';

const UseApi = Api();

const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
}).format(Number(value || 0));
const formatDate = (value) => value ? new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR') : '—';

const currentMonth = () => new Date().toISOString().slice(0, 7);
const monthPeriod = (month) => {
    const [year, monthNumber] = month.split('-').map(Number);
    const lastDay = new Date(year, monthNumber, 0).getDate();
    return {
        from: `${month}-01`,
        to: `${month}-${String(lastDay).padStart(2, '0')}`,
    };
};
const today = () => new Date().toISOString().slice(0, 10);
const isFinal = (item) => (
    String(item.situacaoAtendimento || '').toUpperCase() === 'FECHADA'
    || ['PAGO', 'FECHADO', 'CANCELADO'].includes(String(item.status || '').trim().toUpperCase())
);
const isPaid = (item) => String(item.status || '').trim().toUpperCase() === 'PAGO';
const emptyGoals = {
    metaRecebimento: '',
    metaRecuperacao: '',
    limiteInadimplencia: '',
    metaAcordos: '',
};
const inputNumber = (value) => value === '' || value === null || value === undefined ? null : Number(value);
const goalProgress = (actual, target, inverse = false) => {
    const result = Number(actual || 0);
    const goal = Number(target || 0);
    if (inverse) {
        if (result === 0) return 100;
        return Math.min(100, Math.max(0, (goal / result) * 100));
    }
    if (goal <= 0) return 0;
    return Math.min(100, Math.max(0, (result / goal) * 100));
};

export default function PainelCobrancaGerencial() {
    const [month, setMonth] = useState(currentMonth());
    const [charges, setCharges] = useState([]);
    const [financial, setFinancial] = useState(null);
    const [operational, setOperational] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [goals, setGoals] = useState(emptyGoals);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await UseApi('cobrancas');
                setCharges(Array.isArray(response) ? response : []);
            } catch (requestError) {
                setError(requestError.message || 'Erro ao carregar os dados da cobrança.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    useEffect(() => {
        let active = true;

        const loadFinancial = async () => {
            setLoading(true);
            setError('');
            setFinancial(null);
            try {
                const period = monthPeriod(month);
                const [response, savedGoals, operationalResponse] = await Promise.all([
                    UseApi(`cobrancas/painel/financeiro?from=${period.from}&to=${period.to}&refresh=${Date.now()}`),
                    UseApi(`cobrancas/painel/metas?mes=${month}-01`),
                    UseApi(`cobrancas/painel/operacional?mes=${month}-01`),
                ]);
                if (active) {
                    setFinancial(response);
                    setOperational(operationalResponse);
                    setGoals({
                        metaRecebimento: savedGoals.metaRecebimento ?? '',
                        metaRecuperacao: savedGoals.metaRecuperacao ?? '',
                        limiteInadimplencia: savedGoals.limiteInadimplencia ?? '',
                        metaAcordos: savedGoals.metaAcordos ?? '',
                    });
                }
            } catch (requestError) {
                if (active) setError(requestError.message || 'Erro ao carregar o faturamento mensal do RBX.');
            } finally {
                if (active) setLoading(false);
            }
        };
        loadFinancial();

        return () => {
            active = false;
        };
    }, [month]);

    const importSpreadsheet = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;
        setActionLoading(true);
        setError('');
        setSuccess('');
        try {
            const data = new FormData();
            data.append('arquivo', file);
            const response = await UseApi(
                `cobrancas/painel/faturamento/importar?mes=${month}-01`,
                'POST',
                data,
            );
            setFinancial(response);
            const imported = response?.imported || {};
            const ignored = Number(imported.ignoredFromOtherMonths || 0);
            setSuccess(`Faturamento de ${month} importado: ${Number(imported.documents || 0).toLocaleString('pt-BR')} título(s). A primeira verificação das baixas está sendo executada em segundo plano.${ignored ? ` ${ignored.toLocaleString('pt-BR')} linha(s) de outros meses foram ignoradas.` : ''}`);
        } catch (requestError) {
            setError(requestError.message || 'Erro ao importar a planilha de faturamento.');
        } finally {
            setActionLoading(false);
        }
    };

    const saveGoals = async () => {
        setActionLoading(true);
        setError('');
        setSuccess('');
        try {
            const saved = await UseApi(`cobrancas/painel/metas?mes=${month}-01`, 'PUT', {
                mesReferencia: `${month}-01`,
                metaRecebimento: inputNumber(goals.metaRecebimento),
                metaRecuperacao: inputNumber(goals.metaRecuperacao),
                limiteInadimplencia: inputNumber(goals.limiteInadimplencia),
                metaAcordos: inputNumber(goals.metaAcordos),
            });
            setGoals({
                metaRecebimento: saved.metaRecebimento ?? '',
                metaRecuperacao: saved.metaRecuperacao ?? '',
                limiteInadimplencia: saved.limiteInadimplencia ?? '',
                metaAcordos: saved.metaAcordos ?? '',
            });
            setSuccess(`Metas de ${month.split('-').reverse().join('/')} salvas com sucesso.`);
        } catch (requestError) {
            setError(requestError.message || 'Erro ao salvar as metas mensais.');
        } finally {
            setActionLoading(false);
        }
    };

    const syncSpreadsheet = async () => {
        setActionLoading(true);
        setError('');
        setSuccess('');
        try {
            const response = await UseApi(
                `cobrancas/painel/faturamento/sincronizar?mes=${month}-01`,
                'POST',
            );
            setFinancial(response);
            setSuccess('Baixas sincronizadas com o RBX.');
        } catch (requestError) {
            setError(requestError.message || 'Erro ao sincronizar as baixas com o RBX.');
        } finally {
            setActionLoading(false);
        }
    };

    const summary = useMemo(() => {
        const monthly = charges.filter((item) => (
            !item.excluida && String(item.data || '').slice(0, 7) === month
        ));
        const paid = monthly.filter(isPaid);
        const open = monthly.filter((item) => !isFinal(item));
        const overdue = open.filter((item) => item.dataVencimento && item.dataVencimento < today());
        const agreements = monthly.filter((item) => (
            ['acordo', 'promessa', 'negocia'].some((term) => (
                `${item.acao || ''} ${item.status || ''}`.toLowerCase().includes(term)
            ))
        ));
        const billed = monthly.reduce((total, item) => total + Number(item.valor || 0), 0);
        const received = paid.reduce((total, item) => total + Number(item.valorPago ?? item.valor ?? 0), 0);
        const openValue = open.reduce((total, item) => total + Number(item.valor || 0), 0);
        const overdueValue = overdue.reduce((total, item) => total + Number(item.valor || 0), 0);
        const agreementValue = agreements.reduce((total, item) => total + Number(item.valor || 0), 0);
        const recovery = billed > 0 ? (received / billed) * 100 : 0;
        const dueDates = new Set(monthly.map((item) => item.dataVencimento).filter(Boolean));
        const users = new Set(monthly.map((item) => item.ultimoUsuario || item.atualizadoPor || item.criadoPor).filter(Boolean));

        return {
            monthly,
            paid,
            open,
            overdue,
            agreements,
            billed,
            received,
            openValue,
            overdueValue,
            agreementValue,
            recovery,
            dueDates,
            users,
        };
    }, [charges, month]);

    const billing = financial?.billing?.totals || {};
    const hasImportedBilling = financial?.billing?.source === 'PLANILHA';
    const collectionRate = Number(billing.collectionRate || 0);
    const billingDueDates = financial?.billing?.dueDates || [];
    const closing = operational?.closing || {};
    const agreementsReport = operational?.agreements || {};
    const operationalResults = operational?.results || {};
    const productivity = Array.isArray(operational?.productivity) ? operational.productivity : [];
    const goalIndicators = [
        {
            key: 'metaRecebimento',
            label: 'Meta de recebimento',
            unit: 'R$',
            actual: Number(billing.received || 0),
            result: formatCurrency(billing.received || 0),
            detail: 'Valor recebido no mês',
        },
        {
            key: 'metaRecuperacao',
            label: 'Meta de recuperação',
            unit: '%',
            actual: collectionRate,
            result: `${collectionRate.toFixed(1).replace('.', ',')}%`,
            detail: 'Percentual recebido do faturamento',
        },
        {
            key: 'limiteInadimplencia',
            label: 'Limite de inadimplência',
            unit: '%',
            actual: Number(billing.delinquencyRate || 0),
            inverse: true,
            result: `${Number(billing.delinquencyRate || 0).toFixed(1).replace('.', ',')}%`,
            detail: `Acumulado anual de ${billing.delinquencyYear || month.slice(0, 4)}`,
        },
        {
            key: 'metaAcordos',
            label: 'Meta de acordos',
            unit: 'Qtd.',
            actual: Number(summary.agreements.length),
            result: Number(summary.agreements.length).toLocaleString('pt-BR'),
            detail: 'Acordos registrados no mês',
        },
    ];

    const topics = [
        ['Fechamento mensal do setor de cobrança', formatCurrency(summary.received), `${summary.paid.length} cobrança(s) concluída(s)`, 'Disponível'],
        ['Relatório de valores recebidos', formatCurrency(summary.received), `${summary.recovery.toFixed(1).replace('.', ',')}% de recuperação`, 'Disponível'],
        ['Controle e acompanhamento de títulos em aberto', formatCurrency(summary.openValue), `${summary.open.length} atendimento(s) em aberto`, 'Disponível'],
        ['Relatório de acordos realizados', summary.agreements.length, formatCurrency(summary.agreementValue), 'Base inicial'],
        ['Relatório de produtividade da equipe de cobrança', `${summary.users.size} usuário(s)`, `${summary.monthly.length} registro(s) no período`, 'Disponível'],
        ['Atualização dos indicadores e metas do setor', `${summary.recovery.toFixed(1).replace('.', ',')}%`, 'Indicador atual; metas serão configuráveis', 'Em evolução'],
        ['Resultados mensais da cobrança', `${summary.paid.length} pagas / ${summary.open.length} abertas`, `${formatCurrency(summary.received)} recebido`, 'Disponível'],
    ];

    return (
        <Box sx={{ ...dashboardShellSx, py: 2 }}>
            <Paper variant="outlined" sx={{ ...dashboardHeaderSx, p: 2, mb: 2 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
                    <Box>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <AssessmentRoundedIcon />
                            <Typography variant="h5" fontWeight={900}>Painel gerencial da cobrança</Typography>
                        </Stack>
                        <Typography color="#e8f8ff">
                            Dashboard independente para construir os relatórios e indicadores do setor.
                        </Typography>
                    </Box>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center">
                        <TextField
                            size="small"
                            type="month"
                            label="Mês de referência"
                            value={month}
                            onChange={(event) => setMonth(event.target.value)}
                            InputLabelProps={{ shrink: true }}
                            sx={{ minWidth: 220, ...dashboardInputSx }}
                        />
                        <Button component="label" variant="contained" color="inherit" startIcon={<FileUploadRoundedIcon />} disabled={actionLoading}>
                            Importar Excel
                            <input hidden type="file" accept=".xls,.xlsx" onChange={importSpreadsheet} />
                        </Button>
                        <Button variant="outlined" color="inherit" startIcon={<SyncRoundedIcon />} onClick={syncSpreadsheet} disabled={actionLoading || financial?.billing?.source !== 'PLANILHA'}>
                            Sincronizar
                        </Button>
                    </Stack>
                </Stack>
            </Paper>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            {loading ? (
                <Stack minHeight={300} alignItems="center" justifyContent="center">
                    <CircularProgress />
                </Stack>
            ) : (
                <Paper variant="outlined" sx={{ ...dashboardPanelSx, p: 2 }}>
                    <Paper
                        variant="outlined"
                        sx={{
                            p: { xs: 2, md: 2.5 },
                            mb: 2.5,
                            borderRadius: 2.5,
                            borderColor: 'rgba(23,226,232,0.4)',
                            background: 'linear-gradient(135deg, rgba(23,226,232,0.10), rgba(139,109,177,0.08))',
                        }}
                    >
                        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={1} mb={2}>
                            <Box>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <FlagRoundedIcon color="primary" />
                                    <Typography variant="h6" fontWeight={900}>Atualização dos indicadores e metas do setor</Typography>
                                </Stack>
                                <Typography variant="caption" sx={dashboardMutedTextSx}>
                                    Estrutura preparada para receber os parâmetros e regras das metas do período
                                </Typography>
                            </Box>
                            <Button variant="contained" startIcon={<SaveRoundedIcon />} onClick={saveGoals} disabled={actionLoading}>
                                Salvar metas do mês
                            </Button>
                        </Stack>

                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', xl: 'repeat(4, 1fr)' }, gap: 1.5 }}>
                            {goalIndicators.map((indicator) => (
                                <Paper key={indicator.label} variant="outlined" sx={{ p: 1.5, borderRadius: 1.5, bgcolor: 'rgba(255,255,255,0.025)' }}>
                                    <Typography fontWeight={800} mb={1}>{indicator.label}</Typography>
                                    <Stack direction="row" spacing={1}>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            label="Meta do período"
                                            type="number"
                                            value={goals[indicator.key]}
                                            onChange={(event) => setGoals((current) => ({ ...current, [indicator.key]: event.target.value }))}
                                            placeholder="Informe a meta"
                                            InputLabelProps={{ shrink: true }}
                                            inputProps={{ min: 0, max: indicator.unit === '%' ? 100 : undefined, step: indicator.unit === 'Qtd.' ? 1 : 0.01 }}
                                            sx={dashboardInputSx}
                                        />
                                        <TextField
                                            size="small"
                                            label="Unidade"
                                            value={indicator.unit}
                                            InputProps={{ readOnly: true }}
                                            InputLabelProps={{ shrink: true }}
                                            sx={{ width: 92, ...dashboardInputSx }}
                                        />
                                    </Stack>
                                </Paper>
                            ))}
                        </Box>

                        <Divider sx={{ my: 2 }} />
                        <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
                            <TrendingUpRoundedIcon color="primary" />
                            <Typography fontWeight={900}>Resultados sobre as metas</Typography>
                        </Stack>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', xl: 'repeat(4, 1fr)' }, gap: 1.5 }}>
                            {goalIndicators.map((indicator) => (
                                <Paper key={`result-${indicator.label}`} variant="outlined" sx={{ p: 1.5, borderRadius: 1.5, bgcolor: 'rgba(255,255,255,0.035)' }}>
                                    <Typography variant="caption" sx={dashboardMutedTextSx}>{indicator.label}</Typography>
                                    <Typography variant="h5" fontWeight={900} my={0.5}>{indicator.result}</Typography>
                                    <Typography variant="caption" sx={dashboardMutedTextSx}>{indicator.detail}</Typography>
                                    {goals[indicator.key] !== '' && (
                                        <LinearProgress
                                            variant="determinate"
                                            value={goalProgress(indicator.actual, goals[indicator.key], indicator.inverse)}
                                            color={indicator.inverse
                                                ? (indicator.actual <= Number(goals[indicator.key]) ? 'success' : 'error')
                                                : (indicator.actual >= Number(goals[indicator.key]) ? 'success' : 'primary')}
                                            sx={{ mt: 1.2, height: 8, borderRadius: 5 }}
                                        />
                                    )}
                                    <Divider sx={{ my: 1 }} />
                                    {goals[indicator.key] === '' ? (
                                        <Chip size="small" variant="outlined" color="warning" label="Meta ainda não definida" />
                                    ) : indicator.inverse ? (
                                        <Chip
                                            size="small"
                                            variant="outlined"
                                            color={indicator.actual <= Number(goals[indicator.key]) ? 'success' : 'error'}
                                            label={`${indicator.actual <= Number(goals[indicator.key]) ? 'Dentro' : 'Acima'} da meta de ${Number(goals[indicator.key]).toFixed(1).replace('.', ',')}%`}
                                        />
                                    ) : (
                                        <Chip
                                            size="small"
                                            variant="outlined"
                                            color={indicator.actual >= Number(goals[indicator.key]) ? 'success' : 'primary'}
                                            label={`${Number(goals[indicator.key]) > 0 ? ((indicator.actual / Number(goals[indicator.key])) * 100).toFixed(1).replace('.', ',') : '0,0'}% da meta`}
                                        />
                                    )}
                                </Paper>
                            ))}
                        </Box>
                    </Paper>
                    <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 }, mb: 2.5, borderRadius: 2.5 }}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1} mb={2}>
                            <Box>
                                <Typography variant="h6" fontWeight={900}>Operação mensal da cobrança</Typography>
                                <Typography variant="caption" sx={dashboardMutedTextSx}>
                                    Consolidação dos atendimentos e históricos registrados em {month.split('-').reverse().join('/')}
                                </Typography>
                            </Box>
                            <Chip size="small" color="success" variant="outlined" label="Dados do sistema" />
                        </Stack>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', xl: 'repeat(4, 1fr)' }, gap: 1.5 }}>
                            {[
                                ['Fechamento mensal do setor', `${Number(closing.fechadasNoMes || 0).toLocaleString('pt-BR')} encerradas`, `${Number(closing.abertasNoMes || 0).toLocaleString('pt-BR')} abertas • ${formatCurrency(closing.recebidoPelaEquipe)} recebido`],
                                ['Acordos realizados', Number(agreementsReport.count || 0).toLocaleString('pt-BR'), `${formatCurrency(agreementsReport.value)} negociado`],
                                ['Produtividade da equipe', `${productivity.length.toLocaleString('pt-BR')} usuário(s)`, `${Number(operationalResults.actions || 0).toLocaleString('pt-BR')} ações registradas`],
                                ['Resultados mensais', formatCurrency(operationalResults.received), `${Number(operationalResults.opened || 0).toLocaleString('pt-BR')} iniciadas • ${Number(operationalResults.closed || 0).toLocaleString('pt-BR')} encerradas`],
                            ].map(([label, value, detail]) => (
                                <Paper key={label} variant="outlined" sx={{ p: 1.5, borderRadius: 1.5, bgcolor: 'rgba(255,255,255,0.03)' }}>
                                    <Typography variant="caption" sx={dashboardMutedTextSx}>{label}</Typography>
                                    <Typography variant="h6" fontWeight={900} my={0.6}>{value}</Typography>
                                    <Typography variant="caption" sx={dashboardMutedTextSx}>{detail}</Typography>
                                </Paper>
                            ))}
                        </Box>
                        {productivity.length > 0 && (
                            <Box sx={{ mt: 2 }}>
                                <Typography fontWeight={850} mb={1}>Detalhamento por usuário</Typography>
                                <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' } }}>
                                    {productivity.map((row) => (
                                        <Paper key={row.usuario} variant="outlined" sx={{ p: 1.25, borderRadius: 1.5 }}>
                                            <Typography fontWeight={800}>{row.usuario}</Typography>
                                            <Typography variant="caption" sx={dashboardMutedTextSx}>
                                                {row.acoes} ações • {row.clientes} clientes • {row.acordos} acordos • {row.pagamentos} pagamentos
                                            </Typography>
                                        </Paper>
                                    ))}
                                </Box>
                            </Box>
                        )}
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, minmax(0, 1fr))' }, gap: 1.5, mt: 2 }}>
                            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.5, minWidth: 0 }}>
                                <Typography fontWeight={850}>Movimentação do mês</Typography>
                                <Typography variant="caption" sx={dashboardMutedTextSx}>Aberturas, encerramentos e acordos registrados</Typography>
                                <BarChart
                                    height={260}
                                    xAxis={[{ scaleType: 'band', data: ['Abertas', 'Encerradas', 'Acordos'] }]}
                                    series={[{ data: [Number(closing.abertasNoMes || 0), Number(closing.fechadasNoMes || 0), Number(agreementsReport.count || 0)], label: 'Quantidade', color: '#17e2e8' }]}
                                    margin={{ left: 45, right: 10, top: 30, bottom: 35 }}
                                    sx={dashboardChartSx}
                                />
                            </Paper>
                            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.5, minWidth: 0 }}>
                                <Typography fontWeight={850}>Abertas x encerradas</Typography>
                                <Typography variant="caption" sx={dashboardMutedTextSx}>Distribuição dos atendimentos movimentados</Typography>
                                {(Number(closing.abertasNoMes || 0) + Number(closing.fechadasNoMes || 0)) > 0 ? (
                                    <PieChart
                                        height={260}
                                        series={[{
                                            data: [
                                                { id: 0, label: 'Abertas', value: Number(closing.abertasNoMes || 0), color: '#f6a609' },
                                                { id: 1, label: 'Encerradas', value: Number(closing.fechadasNoMes || 0), color: '#39d98a' },
                                            ],
                                            innerRadius: 48,
                                            paddingAngle: 3,
                                        }]}
                                        slotProps={{ legend: { direction: 'horizontal', position: { vertical: 'bottom', horizontal: 'middle' } } }}
                                        sx={dashboardChartSx}
                                    />
                                ) : (
                                    <Stack height={260} alignItems="center" justifyContent="center"><Typography sx={dashboardMutedTextSx}>Sem movimentações no período.</Typography></Stack>
                                )}
                            </Paper>
                            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.5, minWidth: 0 }}>
                                <Typography fontWeight={850}>Produtividade por usuário</Typography>
                                <Typography variant="caption" sx={dashboardMutedTextSx}>Ações, acordos e pagamentos registrados</Typography>
                                {productivity.length > 0 ? (
                                    <BarChart
                                        height={260}
                                        xAxis={[{ scaleType: 'band', data: productivity.map((row) => row.usuario) }]}
                                        series={[
                                            { data: productivity.map((row) => Number(row.acoes || 0)), label: 'Ações', color: '#17e2e8' },
                                            { data: productivity.map((row) => Number(row.acordos || 0)), label: 'Acordos', color: '#a98bd0' },
                                            { data: productivity.map((row) => Number(row.pagamentos || 0)), label: 'Pagamentos', color: '#39d98a' },
                                        ]}
                                        margin={{ left: 45, right: 10, top: 40, bottom: 55 }}
                                        sx={dashboardChartSx}
                                    />
                                ) : (
                                    <Stack height={260} alignItems="center" justifyContent="center"><Typography sx={dashboardMutedTextSx}>Sem ações no período.</Typography></Stack>
                                )}
                            </Paper>
                        </Box>
                    </Paper>
                    <Paper
                        variant="outlined"
                        sx={{
                            p: { xs: 2, md: 2.5 },
                            mb: 2.5,
                            borderRadius: 2.5,
                            borderColor: 'rgba(139,109,177,0.45)',
                            background: 'linear-gradient(135deg, rgba(139,109,177,0.13), rgba(23,226,232,0.05))',
                        }}
                    >
                        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
                            <Box sx={{ flex: 1 }}>
                                <Stack direction="row" spacing={1.2} alignItems="center" mb={1.5}>
                                    <Box sx={{ p: 1, borderRadius: 2, display: 'flex', bgcolor: 'rgba(139,109,177,0.18)', color: '#a98bd0' }}>
                                        <AccountBalanceWalletRoundedIcon />
                                    </Box>
                                    <Box>
                                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                            <Typography variant="h6" fontWeight={900}>Relatório de faturamento mensal</Typography>
                                            <Chip
                                                size="small"
                                                color={hasImportedBilling ? 'success' : 'warning'}
                                                variant="outlined"
                                                label={hasImportedBilling ? `${collectionRate.toFixed(1).replace('.', ',')}% recebido` : 'Aguardando importação'}
                                            />
                                        </Stack>
                                        <Typography variant="caption" sx={dashboardMutedTextSx}>
                                            Competência {month.split('-').reverse().join('/')} • Fonte: {hasImportedBilling ? 'planilha importada' : 'nenhuma importação'}
                                        </Typography>
                                    </Box>
                                </Stack>
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="stretch">
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption" sx={dashboardMutedTextSx}>Faturado</Typography>
                                        <Typography variant="h4" fontWeight={900} color="#a98bd0">
                                            {formatCurrency(billing.billed || 0)}
                                        </Typography>
                                    </Box>
                                    <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption" sx={dashboardMutedTextSx}>Recebido</Typography>
                                        <Typography variant="h4" fontWeight={900} color="primary.main">
                                            {formatCurrency(billing.received || 0)}
                                        </Typography>
                                    </Box>
                                </Stack>
                                <Typography mt={1.5} variant="body2" fontWeight={700}>
                                    Falta receber: {formatCurrency(billing.open || 0)}
                                </Typography>
                            </Box>
                            <Stack minWidth={{ md: 190 }} justifyContent="center" spacing={0.7}>
                                <Typography variant="caption" sx={dashboardMutedTextSx}>Títulos da competência</Typography>
                                <Typography variant="h5" fontWeight={900}>{Number(billing.documents || 0).toLocaleString('pt-BR')}</Typography>
                                <Typography variant="caption" sx={dashboardMutedTextSx}>
                                    {Number(billing.receivedDocuments || 0).toLocaleString('pt-BR')} baixados • {Number(billing.openDocuments || 0).toLocaleString('pt-BR')} em aberto
                                </Typography>
                            </Stack>
                        </Stack>
                    </Paper>
                    <Paper
                        variant="outlined"
                        sx={{
                            p: { xs: 2, md: 2.5 },
                            mb: 2.5,
                            borderRadius: 2.5,
                            borderColor: 'rgba(23,226,232,0.35)',
                            background: 'linear-gradient(135deg, rgba(23,226,232,0.08), rgba(139,109,177,0.06))',
                        }}
                    >
                        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1} mb={2}>
                            <Box>
                                <Typography variant="h6" fontWeight={900}>Relatório de valores faturados por vencimento</Typography>
                                <Typography variant="caption" sx={dashboardMutedTextSx}>
                                    Distribuição da competência {month.split('-').reverse().join('/')} conforme a data de vencimento da planilha
                                </Typography>
                            </Box>
                            <Chip
                                size="small"
                                color={hasImportedBilling ? 'success' : 'warning'}
                                variant="outlined"
                                label={hasImportedBilling ? `${billingDueDates.length} vencimento(s)` : 'Aguardando importação'}
                            />
                        </Stack>
                        {billingDueDates.length === 0 ? (
                            <Typography sx={dashboardMutedTextSx}>Importe o faturamento deste mês para visualizar os vencimentos.</Typography>
                        ) : (
                            <Stack spacing={1}>
                                <Box sx={{ display: { xs: 'none', md: 'grid' }, gridTemplateColumns: '120px 1fr 1fr 1fr 120px', gap: 2, px: 1.5 }}>
                                    {['Vencimento', 'Faturado', 'Recebido', 'Falta receber', '% recebido'].map((label) => (
                                        <Typography key={label} variant="caption" fontWeight={800} sx={dashboardMutedTextSx}>{label}</Typography>
                                    ))}
                                </Box>
                                {billingDueDates.map((row) => (
                                    <Paper key={row.dueDate} variant="outlined" sx={{ p: 1.5, borderRadius: 1.5, bgcolor: 'rgba(255,255,255,0.025)' }}>
                                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: '120px 1fr 1fr 1fr 120px' }, gap: 2, alignItems: 'center' }}>
                                            <Box>
                                                <Typography fontWeight={900}>{row.dueDateLabel || formatDate(row.dueDate)}</Typography>
                                                <Typography variant="caption" sx={dashboardMutedTextSx}>{row.dateRange} • {Number(row.documents || 0).toLocaleString('pt-BR')} título(s)</Typography>
                                            </Box>
                                            <Box><Typography variant="caption" sx={{ ...dashboardMutedTextSx, display: { md: 'none' } }}>Faturado</Typography><Typography fontWeight={800}>{formatCurrency(row.billed)}</Typography></Box>
                                            <Box><Typography variant="caption" sx={{ ...dashboardMutedTextSx, display: { md: 'none' } }}>Recebido</Typography><Typography fontWeight={800} color="primary.main">{formatCurrency(row.received)}</Typography></Box>
                                            <Box><Typography variant="caption" sx={{ ...dashboardMutedTextSx, display: { md: 'none' } }}>Falta receber</Typography><Typography fontWeight={800}>{formatCurrency(row.open)}</Typography></Box>
                                            <Chip size="small" variant="outlined" color="success" label={`${Number(row.collectionRate || 0).toFixed(1).replace('.', ',')}%`} />
                                        </Box>
                                    </Paper>
                                ))}
                            </Stack>
                        )}
                    </Paper>
                    <Paper
                        variant="outlined"
                        sx={{
                            p: { xs: 2, md: 2.5 },
                            mb: 2.5,
                            borderRadius: 2.5,
                            borderColor: 'rgba(211,71,71,0.4)',
                            background: 'linear-gradient(135deg, rgba(211,71,71,0.10), rgba(139,109,177,0.05))',
                        }}
                    >
                        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} gap={2}>
                            <Box>
                                <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                                    <Typography variant="h6" fontWeight={900}>Relatório de inadimplência atualizado</Typography>
                                    <Chip
                                        size="small"
                                        color={Number(billing.delinquentDocuments || 0) > 0 ? 'error' : 'success'}
                                        variant="outlined"
                                        label={`${Number(billing.delinquencyRate || 0).toFixed(1).replace('.', ',')}% do faturamento`}
                                    />
                                </Stack>
                                <Typography variant="caption" sx={dashboardMutedTextSx}>
                                    Todos os títulos importados de {billing.delinquencyYear || month.slice(0, 4)} que venceram e continuam sem baixa
                                </Typography>
                            </Box>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} minWidth={{ md: 430 }}>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="caption" sx={dashboardMutedTextSx}>Valor vencido</Typography>
                                    <Typography variant="h5" fontWeight={900} color="error.main">{formatCurrency(billing.delinquent || 0)}</Typography>
                                </Box>
                                <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="caption" sx={dashboardMutedTextSx}>Boletos vencidos</Typography>
                                    <Typography variant="h5" fontWeight={900}>{Number(billing.delinquentDocuments || 0).toLocaleString('pt-BR')}</Typography>
                                </Box>
                            </Stack>
                        </Stack>
                    </Paper>
                    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1} mb={2}>
                        <Box>
                            <Typography variant="h6" fontWeight={900}>Estrutura do painel</Typography>
                            <Typography sx={dashboardSubtleTextSx} variant="body2">
                                Primeira versão para validarmos cada tópico, fonte de dados e regra de cálculo.
                            </Typography>
                        </Box>
                        <Chip icon={<CalendarMonthRoundedIcon />} label={`${topics.length + 3} tópicos`} color="primary" />
                    </Stack>
                    <Box
                        sx={{
                            display: 'grid',
                            gap: 1.5,
                            gridTemplateColumns: {
                                xs: '1fr',
                                sm: 'repeat(2, minmax(0, 1fr))',
                                lg: 'repeat(3, minmax(0, 1fr))',
                                xl: 'repeat(5, minmax(0, 1fr))',
                            },
                        }}
                    >
                        {topics.map(([title, value, detail, status], index) => (
                            <Paper
                                key={title}
                                variant="outlined"
                                sx={{
                                    p: 1.7,
                                    minHeight: 195,
                                    borderRadius: 1.5,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    bgcolor: 'rgba(255,255,255,0.03)',
                                }}
                            >
                                <Box>
                                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                                        <Typography color="primary" fontWeight={900} variant="caption">
                                            {String(index + 1).padStart(2, '0')}
                                        </Typography>
                                        <Chip
                                            size="small"
                                            label={status}
                                            color={status === 'Disponível' ? 'success' : 'warning'}
                                            variant="outlined"
                                        />
                                    </Stack>
                                    <Typography fontWeight={850} sx={{ mt: 1, lineHeight: 1.25 }}>{title}</Typography>
                                </Box>
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="h6" fontWeight={900}>{value}</Typography>
                                    <Typography sx={dashboardMutedTextSx} variant="caption">{detail}</Typography>
                                </Box>
                            </Paper>
                        ))}
                    </Box>
                </Paper>
            )}
        </Box>
    );
}
