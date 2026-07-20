import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import SupportAgentRoundedIcon from '@mui/icons-material/SupportAgentRounded';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Divider,
    Grid,
    LinearProgress,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Api from '../../Services/Api';
import ExportDashboardPdfButton from '../../Componentes/ExportDashboardPdfButton';
import {
    dashboardHeaderSx,
    dashboardMetricSx,
    dashboardMutedTextSx,
    dashboardPanelSx,
    dashboardShellSx,
    dashboardSubtleTextSx,
} from '../../Utils/DashboardTheme';

const UseApi = Api();
const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const compactMoney = new Intl.NumberFormat('pt-BR', {
    notation: 'compact',
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 1,
});

const statusMeta = [
    ['active', 'Ativos', '#2D9C75'],
    ['inactive', 'Inativos', '#E8A23A'],
    ['suspended', 'Suspensos', '#E27B58'],
    ['blocked', 'Bloqueados', '#8B6DB1'],
    ['awaitingInstallation', 'Aguardando instalacao', '#3B82C4'],
    ['canceled', 'Cancelados', '#91A1AD'],
    ['other', 'Outros', '#C8D2D8'],
];

function localIsoDate(date) {
    const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return offsetDate.toISOString().slice(0, 10);
}

function getMonthPeriod(year, monthIndex) {
    return {
        from: localIsoDate(new Date(year, monthIndex, 1)),
        to: localIsoDate(new Date(year, monthIndex + 1, 0)),
    };
}

function createMonthOptions(referenceDate = new Date(), length = 6) {
    return Array.from({ length }, (_, index) => {
        const date = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - (length - 1 - index), 1);
        return {
            key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
            label: date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', ''),
            ...getMonthPeriod(date.getFullYear(), date.getMonth()),
        };
    });
}

const monthOptions = createMonthOptions();

function KpiCard({ title, value, detail, icon, color }) {
    return (
        <Paper variant="outlined" sx={{ ...dashboardMetricSx, height: '100%' }}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
                <Box sx={{ color: color || '#0f4c81', display: 'flex', '.dark &': { color: color || '#17e2e8' } }}>{icon}</Box>
                <Box>
                    <Typography sx={dashboardSubtleTextSx} variant="body2" fontWeight={800}>{title}</Typography>
                    <Typography variant="h5" fontWeight={800}>{value}</Typography>
                    <Typography sx={dashboardMutedTextSx} variant="caption">{detail}</Typography>
                </Box>
            </Stack>
        </Paper>
    );
}

function Panel({ title, subtitle, action, children }) {
    return (
        <Paper variant="outlined" sx={{ ...dashboardPanelSx, p: 2, height: '100%' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2} mb={2}>
                <Box>
                    <Typography variant="h6" fontWeight={800}>{title}</Typography>
                    {subtitle && <Typography variant="body2" sx={dashboardSubtleTextSx}>{subtitle}</Typography>}
                </Box>
                {action}
            </Stack>
            {children}
        </Paper>
    );
}

function StatusPanel({ clients }) {
    const data = clients.data;
    const total = data?.total || 0;
    return (
        <Panel title="Carteira de clientes" subtitle="Consulta consolidada via backend Spring Boot">
            {clients.error && <Alert severity="error" sx={{ mb: 2 }}>{clients.error}</Alert>}
            {clients.loading && !data ? (
                <Stack alignItems="center" py={5}><CircularProgress /></Stack>
            ) : (
                <Stack spacing={1.5}>
                    {statusMeta.map(([key, label, color]) => {
                        const value = data?.statuses?.[key] || 0;
                        const percent = total ? (value / total) * 100 : 0;
                        return (
                            <Box key={key}>
                                <Stack direction="row" justifyContent="space-between" mb={0.5}>
                                    <Typography>{label}</Typography>
                                    <Typography fontWeight={700}>{value.toLocaleString('pt-BR')} · {percent.toFixed(1).replace('.', ',')}%</Typography>
                                </Stack>
                                <LinearProgress variant="determinate" value={percent} sx={{ '& .MuiLinearProgress-bar': { bgcolor: color } }} />
                            </Box>
                        );
                    })}
                </Stack>
            )}
        </Panel>
    );
}

function FinancePanel({ financial, selectedMonth, onMonthChange, onRefresh }) {
    const data = financial.data;
    const totals = data?.totals || {};
    const billing = data?.billing?.totals || {};
    return (
        <Panel
            title="Fluxo financeiro"
            subtitle="Recebimentos, faturamento e cobranca por grupo"
            action={(
                <Button size="small" startIcon={financial.loading ? <CircularProgress size={16} /> : <RefreshRoundedIcon />} onClick={onRefresh} disabled={financial.loading}>
                    Atualizar
                </Button>
            )}
        >
            {financial.error && <Alert severity="error" sx={{ mb: 2 }}>{financial.error}</Alert>}
            <Stack direction="row" gap={1} flexWrap="wrap" mb={2}>
                {monthOptions.map((month) => (
                    <Button
                        key={month.key}
                        size="small"
                        variant={selectedMonth === month.key ? 'contained' : 'outlined'}
                        onClick={() => onMonthChange(month)}
                        sx={selectedMonth === month.key ? undefined : { color: '#0f4c81', borderColor: '#0f4c81', '.dark &': { color: '#7befff', borderColor: '#17e2e8' } }}
                    >
                        {month.label}
                    </Button>
                ))}
            </Stack>
            <Grid container spacing={1.5} mb={2}>
                <Grid item xs={12} md={4}>
                    <Chip icon={<CalendarMonthRoundedIcon />} label={`Faturado: ${money.format(billing.billed || 0)}`} variant="outlined" sx={{ width: '100%', justifyContent: 'flex-start', color: '#0f2630', borderColor: '#0f4c81', '.dark &': { color: '#f8fbff', borderColor: '#17e2e8' } }} />
                </Grid>
                <Grid item xs={12} md={4}>
                    <Chip color="success" label={`Recebido: ${money.format(billing.received || 0)}`} sx={{ width: '100%', justifyContent: 'flex-start' }} />
                </Grid>
                <Grid item xs={12} md={4}>
                    <Chip color="error" variant="outlined" label={`Aberto: ${money.format(billing.open || 0)}`} sx={{ width: '100%', justifyContent: 'flex-start' }} />
                </Grid>
            </Grid>
            {financial.loading && !data ? (
                <Stack alignItems="center" py={5}><CircularProgress /></Stack>
            ) : (
                <>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Grupo</TableCell>
                                    <TableCell>Docs</TableCell>
                                    <TableCell>Original</TableCell>
                                    <TableCell>Juros/multa</TableCell>
                                    <TableCell>Descontos</TableCell>
                                    <TableCell>Baixado</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {(data?.groups || []).slice(0, 8).map((group) => (
                                    <TableRow key={group.groupId || group.groupName} hover>
                                        <TableCell>{group.groupName}</TableCell>
                                        <TableCell>{group.paidDocuments}</TableCell>
                                        <TableCell>{money.format(group.original || 0)}</TableCell>
                                        <TableCell>{money.format(group.fees || 0)}</TableCell>
                                        <TableCell>{money.format(group.discounts || 0)}</TableCell>
                                        <TableCell>{money.format(group.received || 0)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="body2" sx={dashboardMutedTextSx}>
                        Total baixado: <strong>{money.format(totals.received || 0)}</strong> · Documentos pagos: <strong>{(totals.paidDocuments || 0).toLocaleString('pt-BR')}</strong>
                    </Typography>
                </>
            )}
        </Panel>
    );
}

function AttendancePanel({ attendance }) {
    const totals = attendance.data?.totals || {};
    return (
        <Panel title="Atendimentos" subtitle="Ordens e ocorrencias do periodo">
            {attendance.error && <Alert severity="error" sx={{ mb: 2 }}>{attendance.error}</Alert>}
            {attendance.loading && !attendance.data ? (
                <Stack alignItems="center" py={5}><CircularProgress /></Stack>
            ) : (
                <>
                    <Box
                        sx={{
                            display: 'grid',
                            gap: 1.5,
                            gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' },
                            mb: 2,
                        }}
                    >
                        {[
                            ['Abertos', totals.open || 0],
                            ['Concluidos', totals.completed || 0],
                            ['Abertos hoje', totals.createdToday || 0],
                            ['Fechados hoje', totals.closedToday || 0],
                        ].map(([label, value]) => (
                            <Paper variant="outlined" sx={{ ...dashboardPanelSx, p: 1.5, borderRadius: 1.5 }} key={label}>
                                <Typography variant="h5" fontWeight={800}>{value}</Typography>
                                <Typography variant="caption" sx={dashboardMutedTextSx}>{label}</Typography>
                            </Paper>
                        ))}
                    </Box>
                    <TableContainer sx={{ maxHeight: 420 }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Numero</TableCell>
                                    <TableCell>Abertura</TableCell>
                                    <TableCell>Area</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Topico</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {(attendance.data?.recent || []).slice(0, 8).map((row) => (
                                    <TableRow key={row.number} hover>
                                        <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 700 }}>#{row.number}</TableCell>
                                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.openedAt}</TableCell>
                                        <TableCell>{row.typeName}</TableCell>
                                        <TableCell>
                                            <Chip size="small" variant="outlined" label={row.statusName || 'Nao informado'} />
                                        </TableCell>
                                        <TableCell sx={{ minWidth: 220 }}>{row.topic || 'Sem topico'}</TableCell>
                                    </TableRow>
                                ))}
                                {!(attendance.data?.recent || []).length && (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center">Nenhum atendimento recente encontrado.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </>
            )}
        </Panel>
    );
}

const DashboardClientes = () => {
    const initialMonth = monthOptions.at(-1);
    const [selectedMonth, setSelectedMonth] = useState(initialMonth.key);
    const [period, setPeriod] = useState({ from: initialMonth.from, to: initialMonth.to });
    const [clients, setClients] = useState({ data: null, loading: true, error: '' });
    const [financial, setFinancial] = useState({ data: null, loading: true, error: '' });
    const [attendance, setAttendance] = useState({ data: null, loading: true, error: '' });

    const loadClients = useCallback(async () => {
        setClients((state) => ({ ...state, loading: true, error: '' }));
        try {
            setClients({ data: await UseApi('dashboard-clientes/clientes/resumo'), loading: false, error: '' });
        } catch (error) {
            setClients((state) => ({ ...state, loading: false, error: error.message }));
        }
    }, []);

    const loadFinancial = useCallback(async (targetPeriod) => {
        setFinancial((state) => ({ ...state, loading: true, error: '' }));
        try {
            setFinancial({ data: await UseApi(`dashboard-clientes/financeiro/resumo?from=${targetPeriod.from}&to=${targetPeriod.to}`), loading: false, error: '' });
        } catch (error) {
            setFinancial((state) => ({ ...state, loading: false, error: error.message }));
        }
    }, []);

    const loadAttendance = useCallback(async (targetPeriod) => {
        setAttendance((state) => ({ ...state, loading: true, error: '' }));
        try {
            setAttendance({ data: await UseApi(`dashboard-clientes/atendimentos/resumo?from=${targetPeriod.from}&to=${targetPeriod.to}`), loading: false, error: '' });
        } catch (error) {
            setAttendance((state) => ({ ...state, loading: false, error: error.message }));
        }
    }, []);

    useEffect(() => {
        loadClients();
        loadFinancial(period);
        loadAttendance(period);
    }, [loadAttendance, loadClients, loadFinancial, period]);

    const changeMonth = (month) => {
        setSelectedMonth(month.key);
        setPeriod({ from: month.from, to: month.to });
    };

    const activeClients = clients.data?.statuses?.active || 0;
    const totalClients = clients.data?.total || 0;
    const billing = financial.data?.billing?.totals || {};
    const attendanceTotals = attendance.data?.totals || {};
    const isLoading = useMemo(() => clients.loading || financial.loading || attendance.loading, [attendance.loading, clients.loading, financial.loading]);

    return (
        <Box id="dashboard-clientes-export" sx={{ py: 2, ...dashboardShellSx }}>
            <Paper variant="outlined" sx={dashboardHeaderSx}>
            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
                <Box>
                    <Typography variant="h5" fontWeight={800}>Dashboard de clientes</Typography>
                    <Typography color="#e8f8ff">Indicadores do RouterBox processados pelo backend Spring Boot.</Typography>
                </Box>
                <Stack direction={{ xs: 'column', sm: 'row' }} gap={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
                    <ExportDashboardPdfButton
                        targetId="dashboard-clientes-export"
                        title="Dashboard de clientes"
                        fileName="dashboard-clientes"
                        disabled={isLoading}
                    />
                    <Button
                        variant="contained"
                        startIcon={isLoading ? <CircularProgress color="inherit" size={16} /> : <RefreshRoundedIcon />}
                        disabled={isLoading}
                        onClick={() => {
                            loadClients();
                            loadFinancial(period);
                            loadAttendance(period);
                        }}
                    >
                        Atualizar dados
                    </Button>
                </Stack>
            </Stack>
            </Paper>

            <Box
                sx={{
                    display: 'grid',
                    gap: 2,
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))' },
                    mb: 2,
                }}
            >
                <KpiCard title="Clientes ativos" value={activeClients.toLocaleString('pt-BR')} detail={`${totalClients.toLocaleString('pt-BR')} no total`} icon={<GroupsRoundedIcon />} color="#176B87" />
                <KpiCard title="Faturado" value={compactMoney.format(billing.billed || 0)} detail="periodo selecionado" icon={<AccountBalanceWalletRoundedIcon />} color="#8B6DB1" />
                <KpiCard title="Recebido" value={compactMoney.format(billing.received || 0)} detail={`${(billing.collectionRate || 0).toFixed(1).replace('.', ',')}% recebido`} icon={<AccountBalanceWalletRoundedIcon />} color="#2D9C75" />
                <KpiCard title="Atendimentos abertos" value={(attendanceTotals.open || 0).toLocaleString('pt-BR')} detail={`${(attendanceTotals.completed || 0).toLocaleString('pt-BR')} concluidos`} icon={<SupportAgentRoundedIcon />} color="#E27B58" />
            </Box>

            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', xl: 'minmax(320px, 420px) minmax(0, 1fr)' }, alignItems: 'start' }}>
                <StatusPanel clients={clients} />
                <Box sx={{ minWidth: 0 }}>
                    <FinancePanel financial={financial} selectedMonth={selectedMonth} onMonthChange={changeMonth} onRefresh={() => loadFinancial(period)} />
                </Box>
            </Box>
            <Box sx={{ mt: 2 }}>
                <AttendancePanel attendance={attendance} />
            </Box>
        </Box>
    );
};

export default DashboardClientes;
