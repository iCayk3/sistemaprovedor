import AddCircleRoundedIcon from '@mui/icons-material/AddCircleRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import TimelineRoundedIcon from '@mui/icons-material/TimelineRounded';
import { BarChart, PieChart } from '@mui/x-charts';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    MenuItem,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import ChartValueList from '../../Componentes/ChartValueList';
import ExportDashboardPdfButton from '../../Componentes/ExportDashboardPdfButton';
import Api from '../../Services/Api';

const UseApi = Api();

const statusOptions = ['Aberto', 'Em negociacao', 'Promessa de pagamento', 'Pago', 'Fechado', 'Cancelado'];
const actionOptions = [
    'Contato',
    'Sem retorno',
    'Promessa de pagamento',
    'Acordo',
    'Segunda via enviada',
    'Contestacao',
    'Negativacao',
    'Pago',
];
const dashboardPalette = ['#17e2e8', '#38bdf8', '#22c55e', '#f97316', '#a3e635', '#facc15', '#fb7185', '#a78bfa', '#8aa0ad'];
const dashboardPanelSx = {
    bgcolor: '#121329',
    color: '#f8fbff',
    border: '1px solid #0b7fbd',
    borderRadius: 1.5,
    boxShadow: '0 0 0 1px rgba(23, 226, 232, 0.25), 0 0 14px rgba(0, 145, 220, 0.32)',
};
const dashboardChartSx = {
    '& .MuiChartsAxis-line, & .MuiChartsAxis-tick': { stroke: '#dce8f5 !important' },
    '& .MuiChartsAxis-tickLabel, & .MuiChartsAxis-label': { fill: '#f8fbff !important' },
    '& .MuiChartsLegend-label': { fill: '#f8fbff !important' },
    '& .MuiChartsGrid-line': { stroke: 'rgba(255,255,255,0.12)' },
};
const clientGroupNames = {
    9: 'PADRAO',
    10: 'SJP',
    11: 'PMV',
    13: 'STN',
    15: 'QT',
    16: 'BV',
    17: 'SEM COBRANCA',
    26: 'MB',
    32: 'MRC',
    33: 'MRP',
    34: 'SAL',
    36: 'RADIO - PIRABAS',
    40: 'TESTE',
    41: 'PRE',
    42: 'CON',
    43: 'SOL',
};

const emptyForm = {
    acao: 'Contato',
    codigoCliente: '',
    cliente: '',
    grupoCliente: '',
    data: new Date().toISOString().slice(0, 10),
    dataPromessa: '',
    valor: '',
    status: 'Aberto',
    observacao: '',
};

const pageGridSx = {
    display: 'grid',
    gap: 2,
    gridTemplateColumns: {
        xs: '1fr',
        md: 'repeat(2, minmax(0, 1fr))',
        lg: 'repeat(4, minmax(0, 1fr))',
    },
};

const formGridSx = {
    display: 'grid',
    gap: 2,
    gridTemplateColumns: {
        xs: '1fr',
        sm: 'repeat(2, minmax(0, 1fr))',
        md: 'repeat(6, minmax(0, 1fr))',
    },
};

const fieldSpan = {
    third: { xs: 'span 1', sm: 'span 1', md: 'span 2' },
    half: { xs: 'span 1', sm: 'span 1', md: 'span 3' },
    full: { xs: 'span 1', sm: 'span 2', md: 'span 6' },
};

function normalizeCharge(charge) {
    return {
        id: charge.id,
        protocol: charge.protocolo,
        action: charge.acao,
        clientCode: charge.codigoCliente,
        client: charge.cliente,
        clientGroup: formatClientGroup(charge.grupoCliente),
        date: charge.data,
        promiseDate: charge.dataPromessa,
        value: Number(charge.valor || 0),
        status: charge.status || 'Aberto',
        notes: charge.observacao,
        createdAt: charge.criadoEm,
        updatedAt: charge.atualizadoEm,
        closedAt: charge.fechadoEm,
        createdBy: charge.criadoPor,
        updatedBy: charge.atualizadoPor,
        lastUser: charge.ultimoUsuario || charge.atualizadoPor || charge.criadoPor || '',
        editable: charge.editavel !== false,
        history: Array.isArray(charge.historico)
            ? charge.historico.map((item) => ({
                id: item.id,
                previousStatus: item.statusAnterior,
                nextStatus: item.statusNovo,
                previousValue: Number(item.valorAnterior || 0),
                nextValue: Number(item.valorNovo || 0),
                notes: item.observacao,
                user: item.usuario,
                createdAt: item.criadoEm,
            }))
            : [],
    };
}

function toForm(charge) {
    return {
        acao: charge?.action || 'Contato',
        codigoCliente: charge?.clientCode || '',
        cliente: charge?.client || '',
        grupoCliente: charge?.clientGroup || '',
        data: charge?.date || new Date().toISOString().slice(0, 10),
        dataPromessa: charge?.promiseDate || '',
        valor: charge?.value ? String(charge.value) : '',
        status: charge?.status || 'Aberto',
        observacao: charge?.notes || '',
    };
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));
}

function formatDate(value) {
    if (!value) return 'Nao informado';
    return new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR');
}

function isFinalStatus(status) {
    return ['PAGO', 'FECHADO', 'CANCELADO'].includes(String(status || '').trim().toUpperCase());
}

function isPaidOrClosedStatus(status) {
    return ['PAGO', 'FECHADO'].includes(String(status || '').trim().toUpperCase());
}

function isPromiseStatus(status) {
    return String(status || '').trim().toUpperCase() === 'PROMESSA DE PAGAMENTO';
}

function todayIso() {
    return new Date().toISOString().slice(0, 10);
}

function currentMonthIso() {
    return new Date().toISOString().slice(0, 7);
}

function isSameMonth(value, month) {
    if (!value || !month) return false;
    return String(value).slice(0, 7) === month;
}

function readClientField(cliente, lowerKey, upperKey) {
    return cliente?.[lowerKey] ?? cliente?.[upperKey] ?? '';
}

function formatClientGroup(group) {
    const normalized = String(group || '').trim();
    return clientGroupNames[normalized] || normalized;
}

function normalizeRbxClient(response) {
    const client = Array.isArray(response) ? response[0] : response?.data || response;

    if (!client || typeof client !== 'object') {
        return null;
    }

    return {
        codigo: readClientField(client, 'codigo', 'Codigo'),
        nome: readClientField(client, 'nome', 'Nome'),
        cpfCnpj: readClientField(client, 'cpfCnpj', 'CNPJ_CNPF'),
        sigla: readClientField(client, 'sigla', 'Sigla'),
        grupo: formatClientGroup(readClientField(client, 'grupoNome', 'Grupo_Nome') || readClientField(client, 'grupo', 'Grupo')),
        situacao: readClientField(client, 'situacao', 'Situacao'),
    };
}

function formatClientStatus(status) {
    const normalized = String(status || '').trim().toUpperCase();
    const statuses = {
        A: 'Ativo',
        B: 'Bloqueado',
        N: 'Inativo',
        S: 'Suspenso',
    };

    return statuses[normalized] || status || '';
}

function normalizeLabel(value, fallback = 'Nao informado') {
    return String(value || '').trim() || fallback;
}

function countBy(items, selector) {
    return items.reduce((acc, item) => {
        const key = normalizeLabel(selector(item));
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});
}

function sumBy(items, selector, valueSelector) {
    return items.reduce((acc, item) => {
        const key = normalizeLabel(selector(item));
        acc[key] = (acc[key] || 0) + Number(valueSelector(item) || 0);
        return acc;
    }, {});
}

function compactChartEntries(entries, limit = 8) {
    if (entries.length <= limit) return entries;
    const visible = entries.slice(0, limit - 1);
    const othersTotal = entries.slice(limit - 1).reduce((total, [, value]) => total + Number(value || 0), 0);
    return [...visible, ['Outros', othersTotal]];
}

const ClienteRbxPanel = ({ cliente }) => {
    if (!cliente) return null;

    return (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mt: 2 }}>
            <Typography variant="subtitle1" fontWeight={800}>Dados do cliente RBX</Typography>
            <Box
                sx={{
                    display: 'grid',
                    gap: 1,
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(6, minmax(0, 1fr))' },
                    mt: 1,
                }}
            >
                {[
                    ['Codigo', cliente.codigo],
                    ['Nome', cliente.nome],
                    ['CPF/CNPJ', cliente.cpfCnpj],
                    ['Sigla', cliente.sigla],
                    ['Grupo', cliente.grupo],
                    ['Situacao', formatClientStatus(cliente.situacao)],
                ].map(([label, value]) => (
                    <Box key={label}>
                        <Typography variant="caption" color="text.secondary">{label}</Typography>
                        <Typography fontWeight={700}>{value || '-'}</Typography>
                    </Box>
                ))}
            </Box>
        </Paper>
    );
};

const Cobrancas = ({ readOnly = false, mode }) => {
    const viewMode = mode || (readOnly ? 'dashboard' : 'cadastro');
    const isDashboard = viewMode === 'dashboard';
    const isTracking = viewMode === 'acompanhamento';
    const isRegister = viewMode === 'cadastro';
    const [charges, setCharges] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [selected, setSelected] = useState(null);
    const [rbxClient, setRbxClient] = useState(null);
    const [validatedClientCode, setValidatedClientCode] = useState('');
    const [statusFilter, setStatusFilter] = useState(isTracking ? 'Em aberto' : 'Todos');
    const [searchFilter, setSearchFilter] = useState('');
    const [userFilter, setUserFilter] = useState('Todos');
    const [actionFilter, setActionFilter] = useState('Todos');
    const [groupFilter, setGroupFilter] = useState('Todos');
    const [dashboardMonth, setDashboardMonth] = useState(currentMonthIso());
    const [trackingNote, setTrackingNote] = useState('');
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [rbxLoading, setRbxLoading] = useState(false);
    const [error, setError] = useState('');

    const loadCharges = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await UseApi('cobrancas');
            setCharges(Array.isArray(response) ? response.map(normalizeCharge) : []);
        } catch (requestError) {
            setError(requestError.message || 'Erro ao carregar cobrancas.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCharges();
    }, []);

    const userOptions = useMemo(() => {
        return Array.from(new Set(charges.map((charge) => normalizeLabel(charge.lastUser)).filter(Boolean))).sort();
    }, [charges]);

    const actionFilterOptions = useMemo(() => {
        return Array.from(new Set(charges.map((charge) => normalizeLabel(charge.action)).filter(Boolean))).sort();
    }, [charges]);

    const groupOptions = useMemo(() => {
        return Array.from(new Set(charges.map((charge) => normalizeLabel(charge.clientGroup)).filter(Boolean))).sort();
    }, [charges]);

    const filteredCharges = useMemo(() => {
        const search = searchFilter.trim().toLowerCase();
        return charges
            .filter((charge) => {
                if (statusFilter === 'Todos') return true;
                if (statusFilter === 'Em aberto') return !isFinalStatus(charge.status);
                if (statusFilter === 'Finalizadas') return isFinalStatus(charge.status);
                if (statusFilter === 'Promessas hoje') return isPromiseStatus(charge.status) && charge.promiseDate === todayIso();
                if (statusFilter === 'Promessas vencidas') return isPromiseStatus(charge.status) && charge.promiseDate && charge.promiseDate < todayIso();
                return charge.status === statusFilter;
            })
            .filter((charge) => userFilter === 'Todos' || normalizeLabel(charge.lastUser) === userFilter)
            .filter((charge) => actionFilter === 'Todos' || normalizeLabel(charge.action) === actionFilter)
            .filter((charge) => groupFilter === 'Todos' || normalizeLabel(charge.clientGroup) === groupFilter)
            .filter((charge) => {
                if (!search) return true;
                return [
                    charge.protocol,
                    charge.client,
                    charge.clientCode,
                    charge.action,
                    charge.status,
                    charge.lastUser,
                    charge.clientGroup,
                ].some((value) => String(value || '').toLowerCase().includes(search));
            })
            .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    }, [charges, statusFilter, searchFilter, userFilter, actionFilter, groupFilter]);

    const metrics = useMemo(() => {
        const source = isDashboard ? filteredCharges : charges;
        const abertas = source.filter((charge) => !isFinalStatus(charge.status));
        const pagas = source.filter((charge) => String(charge.status || '').toUpperCase() === 'PAGO');
        const pagasMes = source.filter((charge) => (
            String(charge.status || '').toUpperCase() === 'PAGO'
            && isSameMonth(charge.closedAt || charge.updatedAt || charge.date, dashboardMonth)
        ));
        const promessasHoje = source.filter((charge) => isPromiseStatus(charge.status) && charge.promiseDate === todayIso());
        const promessasVencidas = source.filter((charge) => isPromiseStatus(charge.status) && charge.promiseDate && charge.promiseDate < todayIso());
        const valorAberto = abertas.reduce((total, charge) => total + charge.value, 0);
        const valorPago = pagas.reduce((total, charge) => total + charge.value, 0);
        const valorPagoMes = pagasMes.reduce((total, charge) => total + charge.value, 0);
        const valorTotal = source.reduce((total, charge) => total + charge.value, 0);

        return {
            total: source.length,
            abertas: abertas.length,
            pagas: pagas.length,
            pagasMes: pagasMes.length,
            promessasHoje: promessasHoje.length,
            promessasVencidas: promessasVencidas.length,
            valorAberto,
            valorPago,
            valorPagoMes,
            valorTotal,
        };
    }, [charges, dashboardMonth, filteredCharges, isDashboard]);

    const chartData = useMemo(() => {
        const statusCounts = countBy(filteredCharges, (charge) => charge.status);
        const userCounts = countBy(filteredCharges, (charge) => charge.lastUser);
        const userValues = sumBy(filteredCharges, (charge) => charge.lastUser, (charge) => charge.value);
        const groupValues = sumBy(filteredCharges, (charge) => charge.clientGroup, (charge) => charge.value);
        const statusEntries = Object.entries(statusCounts).sort((a, b) => b[1] - a[1]);
        const userEntries = Object.entries(userCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
        const userValueEntries = compactChartEntries(Object.entries(userValues)
            .filter(([, value]) => Number(value) > 0)
            .sort((a, b) => Number(b[1]) - Number(a[1]))
        );
        const groupValueEntries = compactChartEntries(Object.entries(groupValues)
            .filter(([, value]) => Number(value) > 0)
            .sort((a, b) => Number(b[1]) - Number(a[1]))
        );
        const userLabels = userEntries.map(([label]) => label);
        const visibleStatuses = statusOptions.filter((status) => filteredCharges.some((charge) => charge.status === status));
        const statusByUserSeries = visibleStatuses.map((status) => ({
            label: status,
            data: userLabels.map((user) => filteredCharges.filter((charge) => normalizeLabel(charge.lastUser) === user && charge.status === status).length),
        }));
        const statusByUserTotals = userLabels.map((user, index) => ({
            label: user,
            value: statusByUserSeries.reduce((total, serie) => total + Number(serie.data[index] || 0), 0),
            color: dashboardPalette[index % dashboardPalette.length],
        }));

        return {
            statusPie: statusEntries.map(([label, value], index) => ({ id: index, label, value, color: dashboardPalette[index % dashboardPalette.length] })),
            userLabels,
            statusByUserSeries,
            statusByUserTotals,
            userValuePie: userValueEntries.map(([label, value], index) => ({
                id: index,
                label,
                value: Number(value),
                color: dashboardPalette[index % dashboardPalette.length],
            })),
            groupValuePie: groupValueEntries.map(([label, value], index) => ({
                id: index,
                label,
                value: Number(value),
                color: dashboardPalette[index % dashboardPalette.length],
            })),
        };
    }, [filteredCharges]);

    const updateForm = (field, value) => setForm((current) => ({ ...current, [field]: value }));

    const findChargeInProgressByCode = (code, ignoredId = selected?.id) => {
        const normalizedCode = String(code || '').trim();
        if (!normalizedCode) return null;

        return charges.find((charge) => (
            String(charge.clientCode || '').trim() === normalizedCode
            && charge.id !== ignoredId
            && !isPaidOrClosedStatus(charge.status)
        ));
    };

    const openNew = () => {
        setSelected(null);
        setRbxClient(null);
        setValidatedClientCode('');
        setTrackingNote('');
        setForm({ ...emptyForm, data: new Date().toISOString().slice(0, 10) });
        setOpen(true);
    };

    const openCharge = (charge) => {
        setSelected(charge);
        setRbxClient(null);
        setValidatedClientCode(charge.clientCode ? String(charge.clientCode) : '');
        setTrackingNote('');
        setForm(toForm(charge));
        setOpen(true);
    };

    const searchRbxClient = async () => {
        const code = form.codigoCliente || selected?.clientCode;
        if (!code) {
            setError('Informe o codigo do cliente para buscar no RBX.');
            return;
        }
        const chargeInProgress = isRegister && !selected ? findChargeInProgressByCode(code, null) : null;
        if (chargeInProgress) {
            setError(`Ja existe uma cobranca em andamento para o codigo ${code}: ${chargeInProgress.protocol} (${chargeInProgress.status}).`);
            setRbxClient(null);
            return;
        }
        setRbxLoading(true);
        setError('');
        try {
            const response = await UseApi(`cobrancas/rbx/clientes/${code}`);
            const normalizedClient = normalizeRbxClient(response);
            if (!normalizedClient?.nome) {
                throw new Error('Codigo de cliente nao encontrado no RBX.');
            }
            setRbxClient(normalizedClient);
            setValidatedClientCode(String(code).trim());
            if (normalizedClient?.nome || normalizedClient?.grupo) {
                setForm((current) => ({
                    ...current,
                    cliente: normalizedClient?.nome || current.cliente,
                    grupoCliente: normalizedClient?.grupo || current.grupoCliente,
                }));
            }
        } catch (requestError) {
            setError(requestError.message || 'Erro ao buscar cliente no RBX.');
        } finally {
            setRbxLoading(false);
        }
    };

    const handleSubmit = async () => {
        setSaving(true);
        setError('');
        try {
            if (isTracking && !trackingNote.trim()) {
                throw new Error('Informe o que foi realizado no acompanhamento.');
            }
            if (!selected && (!validatedClientCode || String(form.codigoCliente).trim() !== validatedClientCode || !form.cliente)) {
                throw new Error('Busque e valide um codigo de cliente no RBX antes de cadastrar a cobranca.');
            }
            const chargeInProgress = !selected ? findChargeInProgressByCode(form.codigoCliente, null) : null;
            if (chargeInProgress) {
                throw new Error(`Ja existe uma cobranca em andamento para o codigo ${form.codigoCliente}: ${chargeInProgress.protocol} (${chargeInProgress.status}).`);
            }
            const payload = {
                acao: form.acao,
                codigoCliente: form.codigoCliente ? Number(form.codigoCliente) : null,
                cliente: form.cliente,
                grupoCliente: form.grupoCliente,
                data: form.data || null,
                valor: Number(String(form.valor || 0).replace(',', '.')),
                dataPromessa: isPromiseStatus(form.status) ? form.dataPromessa || null : null,
                status: form.status,
                observacao: form.observacao,
            };
            const response = isTracking && selected
                ? await UseApi(`cobrancas/${selected.id}/acompanhamento`, 'PATCH', {
                    status: form.status,
                    valor: form.status === 'Em negociacao' ? Number(String(form.valor || 0).replace(',', '.')) : selected.value,
                    dataPromessa: isPromiseStatus(form.status) ? form.dataPromessa || null : null,
                    observacao: trackingNote,
                })
                : selected
                    ? await UseApi(`cobrancas/${selected.id}`, 'PUT', payload)
                    : await UseApi('cobrancas', 'POST', payload);
            const normalized = normalizeCharge(response);
            setCharges((current) => {
                if (!selected) {
                    return [normalized, ...current];
                }
                return current.map((charge) => (charge.id === normalized.id ? normalized : charge));
            });
            setSelected(normalized);
            setTrackingNote('');
            setOpen(false);
        } catch (requestError) {
            setError(requestError.message || 'Erro ao salvar cobranca.');
        } finally {
            setSaving(false);
        }
    };

    const canEditSelected = isRegister && (!selected || selected.editable);
    const canTrackSelected = isTracking && Boolean(selected?.editable);
    const canSaveSelected = canEditSelected || canTrackSelected;
    const canEditTrackingValue = canTrackSelected && form.status === 'Em negociacao';
    const saveDisabled = saving
        || (isTracking && canTrackSelected && !trackingNote.trim())
        || (!selected && isRegister && (!validatedClientCode || String(form.codigoCliente).trim() !== validatedClientCode || !form.cliente))
        || (canSaveSelected && isPromiseStatus(form.status) && !form.dataPromessa);

    const pageTitle = {
        cadastro: 'Cobrancas',
        dashboard: 'Dashboard de cobrancas',
        acompanhamento: 'Acompanhamento de cobrancas',
    }[viewMode];

    const pageSubtitle = {
        cadastro: 'Cadastro, acompanhamento e fechamento das acoes de cobranca.',
        dashboard: 'Resumo geral da carteira de cobrancas, sem alteracao de registros.',
        acompanhamento: 'Fila operacional para acompanhar status, priorizando cobrancas em aberto.',
    }[viewMode];

    return (
        <Box
            id="dashboard-cobrancas-export"
            sx={{
                py: 2,
                ...(isDashboard ? {
                    bgcolor: '#070b18',
                    p: { xs: 1, md: 1.5 },
                    borderRadius: 1,
                    border: '1px solid rgba(23, 226, 232, 0.22)',
                } : {}),
            }}
        >
            <Paper
                variant="outlined"
                sx={{
                    p: isDashboard ? 1.8 : 2.5,
                    mb: 2,
                    borderRadius: isDashboard ? 1 : 2,
                    ...(isDashboard ? {
                        bgcolor: '#1677bd',
                        color: '#fff',
                        border: '1px solid #17e2e8',
                        borderBottom: '3px solid #f97316',
                    } : {}),
                }}
            >
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
                    <Box>
                        <Typography variant="h5" fontWeight={800}>
                            {pageTitle}
                        </Typography>
                        <Typography color={isDashboard ? '#e8f8ff' : 'text.secondary'}>{pageSubtitle}</Typography>
                    </Box>
                    <Stack direction={{ xs: 'column', sm: 'row' }} gap={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
                        {isDashboard && (
                            <>
                                <TextField
                                    size="small"
                                    type="month"
                                    label="Mes de pagamento"
                                    value={dashboardMonth}
                                    onChange={(event) => setDashboardMonth(event.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                    sx={{
                                        minWidth: 210,
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: '#111a2e',
                                            color: '#f8fbff',
                                            '& fieldset': { borderColor: '#17e2e8' },
                                            '&:hover fieldset': { borderColor: '#7befff' },
                                            '&.Mui-focused fieldset': { borderColor: '#7befff' },
                                        },
                                        '& .MuiInputBase-input': { color: '#f8fbff', colorScheme: 'dark', fontWeight: 800 },
                                        '& .MuiInputLabel-root': { color: '#b8f7ff', fontWeight: 700 },
                                        '& .MuiInputLabel-root.Mui-focused': { color: '#7befff' },
                                    }}
                                />
                                <ExportDashboardPdfButton
                                    targetId="dashboard-cobrancas-export"
                                    title="Dashboard de cobrancas"
                                    fileName="dashboard-cobrancas"
                                />
                            </>
                        )}
                        {isRegister && (
                            <Button variant="contained" startIcon={<AddCircleRoundedIcon />} onClick={openNew}>
                                Nova cobranca
                            </Button>
                        )}
                    </Stack>
                </Stack>
            </Paper>

            {error && !open && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {(metrics.promessasHoje > 0 || metrics.promessasVencidas > 0) && (
                <Alert severity={metrics.promessasVencidas > 0 ? 'error' : 'warning'} sx={{ mb: 2 }}>
                    {metrics.promessasVencidas > 0
                        ? `${metrics.promessasVencidas} promessa(s) de pagamento vencida(s).`
                        : `${metrics.promessasHoje} promessa(s) de pagamento vencem hoje.`}
                </Alert>
            )}

            <Box sx={{ ...pageGridSx, mb: 2 }}>
                {[
                    ['Cobrancas', metrics.total, 'registros no sistema'],
                    ['Em aberto', metrics.abertas, formatCurrency(metrics.valorAberto)],
                    ...(isDashboard ? [['Pago no mes', metrics.pagasMes, formatCurrency(metrics.valorPagoMes)]] : []),
                    ['Promessas hoje', metrics.promessasHoje, `${metrics.promessasVencidas} vencidas`],
                    ['Pagas', metrics.pagas, `${formatCurrency(metrics.valorPago)} de ${formatCurrency(metrics.valorTotal)}`],
                ].map(([label, value, detail]) => (
                    <Paper
                        variant="outlined"
                        sx={{
                            p: 2,
                            borderRadius: isDashboard ? 1.5 : 2,
                            ...(isDashboard ? { ...dashboardPanelSx, borderLeft: '5px solid #17e2e8' } : {}),
                        }}
                        key={label}
                    >
                        <Stack direction="row" alignItems="center" spacing={1.2}>
                            <TimelineRoundedIcon color="primary" />
                            <Box>
                                <Typography color={isDashboard ? '#7befff' : 'text.secondary'} variant="body2" fontWeight={isDashboard ? 800 : 400}>{label}</Typography>
                                <Typography variant="h5" fontWeight={800}>{value}</Typography>
                                <Typography color={isDashboard ? '#c9d7e8' : 'text.secondary'} variant="caption">{detail}</Typography>
                            </Box>
                        </Stack>
                    </Paper>
                ))}
            </Box>

            {isDashboard && (
                <Box
                    sx={{
                        display: 'grid',
                        gap: 2,
                        gridTemplateColumns: '1fr',
                        mb: 2,
                    }}
                >
                    <Paper variant="outlined" sx={{ ...dashboardPanelSx, p: 2 }}>
                        <Typography variant="h6" fontWeight={800}>Status por usuario</Typography>
                        <Typography color="#7befff" variant="body2" sx={{ mb: 1 }}>
                            {userFilter === 'Todos'
                                ? 'Distribuicao de status da fila filtrada. Selecione um usuario para detalhar.'
                                : `Distribuicao de status de ${userFilter}.`}
                        </Typography>
                        {chartData.statusPie.length ? (
                            <Box
                                sx={{
                                    display: 'grid',
                                    gap: 2,
                                    gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 240px' },
                                    alignItems: 'center',
                                }}
                            >
                                <Box sx={{ minWidth: 0 }}>
                                    <PieChart
                                        height={260}
                                        series={[{
                                            data: chartData.statusPie,
                                            innerRadius: 45,
                                            paddingAngle: 2,
                                        }]}
                                        slotProps={{ legend: { hidden: true } }}
                                        sx={dashboardChartSx}
                                    />
                                </Box>
                                <ChartValueList items={chartData.statusPie} />
                            </Box>
                        ) : (
                            <Stack alignItems="center" justifyContent="center" minHeight={220}>
                                <Typography color="#c9d7e8">Sem dados para exibir.</Typography>
                            </Stack>
                        )}
                    </Paper>
                    <Paper variant="outlined" sx={{ ...dashboardPanelSx, p: 2 }}>
                        <Typography variant="h6" fontWeight={800}>Status por usuario</Typography>
                        <Typography color="#7befff" variant="body2" sx={{ mb: 1 }}>
                            Compare a quantidade de cobrancas por status em cada responsavel.
                        </Typography>
                        {chartData.userLabels.length && chartData.statusByUserSeries.length ? (
                            <Box
                                sx={{
                                    display: 'grid',
                                    gap: 2,
                                    gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 240px' },
                                    alignItems: 'center',
                                }}
                            >
                                <Box sx={{ minWidth: 0 }}>
                                    <BarChart
                                        height={260}
                                        xAxis={[{ scaleType: 'band', data: chartData.userLabels }]}
                                        series={chartData.statusByUserSeries}
                                        margin={{ left: 35, right: 10, top: 25, bottom: 70 }}
                                        sx={dashboardChartSx}
                                    />
                                </Box>
                                <ChartValueList items={chartData.statusByUserTotals} showPercent={false} />
                            </Box>
                        ) : (
                            <Stack alignItems="center" justifyContent="center" minHeight={220}>
                                <Typography color="#c9d7e8">Sem dados para exibir.</Typography>
                            </Stack>
                        )}
                    </Paper>
                    <Paper variant="outlined" sx={{ ...dashboardPanelSx, p: 2 }}>
                        <Typography variant="h6" fontWeight={800}>Valor por usuario</Typography>
                        <Typography color="#7befff" variant="body2" sx={{ mb: 1 }}>
                            Participacao em valor por ultimo responsavel.
                        </Typography>
                        {chartData.userValuePie.length ? (
                            <Box
                                sx={{
                                    display: 'grid',
                                    gap: 2,
                                    gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 260px' },
                                    alignItems: 'center',
                                }}
                            >
                                <Box sx={{ minWidth: 0 }}>
                                    <PieChart
                                        height={260}
                                        series={[{
                                            data: chartData.userValuePie,
                                            innerRadius: 45,
                                            paddingAngle: 2,
                                            valueFormatter: (item) => formatCurrency(item.value),
                                        }]}
                                        slotProps={{ legend: { hidden: true } }}
                                        sx={dashboardChartSx}
                                    />
                                </Box>
                                <ChartValueList items={chartData.userValuePie} valueFormatter={formatCurrency} />
                            </Box>
                        ) : (
                            <Stack alignItems="center" justifyContent="center" minHeight={220}>
                                <Typography color="#c9d7e8">Sem dados para exibir.</Typography>
                            </Stack>
                        )}
                    </Paper>
                    <Paper variant="outlined" sx={{ ...dashboardPanelSx, p: 2 }}>
                        <Typography variant="h6" fontWeight={800}>Valor por grupo</Typography>
                        <Typography color="#7befff" variant="body2" sx={{ mb: 1 }}>
                            Participacao em valor por grupo do cliente.
                        </Typography>
                        {chartData.groupValuePie.length ? (
                            <Box
                                sx={{
                                    display: 'grid',
                                    gap: 2,
                                    gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 260px' },
                                    alignItems: 'center',
                                }}
                            >
                                <Box sx={{ minWidth: 0 }}>
                                    <PieChart
                                        height={260}
                                        series={[{
                                            data: chartData.groupValuePie,
                                            innerRadius: 45,
                                            paddingAngle: 2,
                                            valueFormatter: (item) => formatCurrency(item.value),
                                        }]}
                                        slotProps={{ legend: { hidden: true } }}
                                        sx={dashboardChartSx}
                                    />
                                </Box>
                                <ChartValueList items={chartData.groupValuePie} valueFormatter={formatCurrency} />
                            </Box>
                        ) : (
                            <Stack alignItems="center" justifyContent="center" minHeight={220}>
                                <Typography color="#c9d7e8">Sem dados para exibir.</Typography>
                            </Stack>
                        )}
                    </Paper>
                </Box>
            )}

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2} mb={2}>
                    <Box>
                        <Typography variant="h6" fontWeight={800}>
                            {isDashboard ? 'Resumo da fila' : 'Fila de cobranca'}
                        </Typography>
                        <Typography color="text.secondary" variant="body2">{filteredCharges.length} registros encontrados</Typography>
                    </Box>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                        <TextField
                            size="small"
                            label="Buscar"
                            value={searchFilter}
                            onChange={(event) => setSearchFilter(event.target.value)}
                            placeholder="Cliente, codigo ou protocolo"
                            sx={{ minWidth: { xs: '100%', sm: 260 } }}
                        />
                        <TextField
                            select
                            size="small"
                            label="Status"
                            value={statusFilter}
                            onChange={(event) => setStatusFilter(event.target.value)}
                            sx={{ minWidth: 220 }}
                        >
                            <MenuItem value="Todos">Todos</MenuItem>
                            <MenuItem value="Em aberto">Em aberto</MenuItem>
                            <MenuItem value="Finalizadas">Finalizadas</MenuItem>
                            <MenuItem value="Promessas hoje">Promessas hoje</MenuItem>
                            <MenuItem value="Promessas vencidas">Promessas vencidas</MenuItem>
                            {statusOptions.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
                        </TextField>
                        {(isDashboard || isTracking) && (
                            <>
                                {isDashboard && (
                                    <>
                                        <TextField
                                            select
                                            size="small"
                                            label="Usuario"
                                            value={userFilter}
                                            onChange={(event) => setUserFilter(event.target.value)}
                                            sx={{ minWidth: 190 }}
                                        >
                                            <MenuItem value="Todos">Todos</MenuItem>
                                            {userOptions.map((user) => <MenuItem key={user} value={user}>{user}</MenuItem>)}
                                        </TextField>
                                        <TextField
                                            select
                                            size="small"
                                            label="Acao"
                                            value={actionFilter}
                                            onChange={(event) => setActionFilter(event.target.value)}
                                            sx={{ minWidth: 210 }}
                                        >
                                            <MenuItem value="Todos">Todas</MenuItem>
                                            {actionFilterOptions.map((action) => <MenuItem key={action} value={action}>{action}</MenuItem>)}
                                        </TextField>
                                    </>
                                )}
                                <TextField
                                    select
                                    size="small"
                                    label="Grupo"
                                    value={groupFilter}
                                    onChange={(event) => setGroupFilter(event.target.value)}
                                    sx={{ minWidth: 190 }}
                                >
                                    <MenuItem value="Todos">Todos</MenuItem>
                                    {groupOptions.map((group) => <MenuItem key={group} value={group}>{group}</MenuItem>)}
                                </TextField>
                            </>
                        )}
                    </Stack>
                </Stack>

                <TableContainer>
                    {loading ? (
                        <Stack alignItems="center" py={5}><CircularProgress /></Stack>
                    ) : (
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Protocolo</TableCell>
                                    <TableCell>Cliente</TableCell>
                                    <TableCell>Grupo</TableCell>
                                    <TableCell>Acao</TableCell>
                                    <TableCell>Data</TableCell>
                                    <TableCell>Valor</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Usuario</TableCell>
                                    <TableCell align="right">Detalhes</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredCharges.map((charge) => (
                                    <TableRow key={charge.id} hover>
                                        <TableCell>{charge.protocol}</TableCell>
                                        <TableCell>
                                            <Typography fontWeight={700} fontSize="inherit">{charge.client || 'Nao informado'}</Typography>
                                            <Typography color="text.secondary" variant="caption">
                                                Codigo {charge.clientCode || '-'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{charge.clientGroup || 'Nao informado'}</TableCell>
                                        <TableCell>{charge.action}</TableCell>
                                        <TableCell>{formatDate(charge.date)}</TableCell>
                                        <TableCell>{formatCurrency(charge.value)}</TableCell>
                                        <TableCell>
                                            <Chip
                                                size="small"
                                                color={isPromiseStatus(charge.status) && charge.promiseDate && charge.promiseDate <= todayIso() ? 'error' : isFinalStatus(charge.status) ? 'success' : 'warning'}
                                                label={charge.status}
                                            />
                                            {isPromiseStatus(charge.status) && charge.promiseDate && (
                                                <Typography display="block" color="text.secondary" variant="caption">
                                                    Promessa: {formatDate(charge.promiseDate)}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>{charge.lastUser || 'sem usuario'}</TableCell>
                                        <TableCell align="right">
                                            <IconButton size="small" onClick={() => openCharge(charge)}>
                                                {isDashboard || !charge.editable ? <InfoOutlinedIcon fontSize="small" /> : <EditRoundedIcon fontSize="small" />}
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {!filteredCharges.length && (
                                    <TableRow>
                                        <TableCell colSpan={9} align="center">Nenhuma cobranca cadastrada.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </TableContainer>
            </Paper>

            <Dialog
                open={open}
                onClose={() => setOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { width: 'min(980px, calc(100vw - 32px))', maxHeight: 'calc(100vh - 32px)' } }}
            >
                <DialogTitle>
                    {selected
                        ? `${canSaveSelected ? (isTracking ? 'Acompanhar' : 'Editar') : 'Detalhes da'} cobranca ${selected.protocol}`
                        : 'Nova cobranca'}
                </DialogTitle>
                <DialogContent sx={{ overflowX: 'hidden' }}>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}
                    {!selected && isRegister && (!validatedClientCode || String(form.codigoCliente).trim() !== validatedClientCode || !form.cliente) && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            Informe o codigo do cliente e clique na lupa para validar no RBX antes de salvar.
                        </Alert>
                    )}
                    <Box sx={{ ...formGridSx, pt: 1 }}>
                        <Box sx={{ gridColumn: fieldSpan.third }}>
                            <TextField
                                select
                                fullWidth
                                label="Acao"
                                value={form.acao}
                                onChange={(event) => updateForm('acao', event.target.value)}
                                disabled={!canEditSelected}
                            >
                                {actionOptions.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                            </TextField>
                        </Box>
                        <Box sx={{ gridColumn: fieldSpan.third }}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Codigo cliente"
                                value={form.codigoCliente}
                                onChange={(event) => {
                                    updateForm('codigoCliente', event.target.value);
                                    updateForm('cliente', '');
                                    updateForm('grupoCliente', '');
                                    setRbxClient(null);
                                    setValidatedClientCode('');
                                }}
                                disabled={!canEditSelected}
                                InputProps={{
                                    endAdornment: (
                                        <IconButton size="small" onClick={searchRbxClient} disabled={rbxLoading}>
                                            {rbxLoading ? <CircularProgress size={18} /> : <SearchRoundedIcon fontSize="small" />}
                                        </IconButton>
                                    ),
                                }}
                            />
                        </Box>
                        {isPromiseStatus(form.status) && (
                            <Box sx={{ gridColumn: fieldSpan.third }}>
                                <TextField
                                    fullWidth
                                    required
                                    type="date"
                                    label="Data da promessa"
                                    value={form.dataPromessa}
                                    onChange={(event) => updateForm('dataPromessa', event.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                    disabled={!(canEditSelected || canTrackSelected)}
                                    helperText="Obrigatorio para promessa de pagamento"
                                />
                            </Box>
                        )}
                        <Box sx={{ gridColumn: fieldSpan.third }}>
                            <TextField
                                fullWidth
                                label="Cliente"
                                value={form.cliente}
                                disabled
                                helperText="Preenchido pela busca do codigo no RBX"
                            />
                        </Box>
                        <Box sx={{ gridColumn: fieldSpan.third }}>
                            <TextField
                                fullWidth
                                label="Grupo"
                                value={form.grupoCliente}
                                disabled
                                helperText="Grupo do cliente no RBX"
                            />
                        </Box>
                        <Box sx={{ gridColumn: fieldSpan.third }}>
                            <TextField
                                fullWidth
                                type="date"
                                label="Data"
                                value={form.data}
                                onChange={(event) => updateForm('data', event.target.value)}
                                InputLabelProps={{ shrink: true }}
                                disabled={!canEditSelected}
                            />
                        </Box>
                        <Box sx={{ gridColumn: fieldSpan.third }}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Valor"
                                value={form.valor}
                                onChange={(event) => updateForm('valor', event.target.value)}
                                inputProps={{ step: '0.01', min: '0' }}
                                disabled={!(canEditSelected || canEditTrackingValue)}
                                helperText={isTracking ? 'Disponivel quando o status estiver Em negociacao' : ''}
                            />
                        </Box>
                        <Box sx={{ gridColumn: fieldSpan.third }}>
                            <TextField
                                select
                                fullWidth
                                label="Status"
                                value={form.status}
                                onChange={(event) => updateForm('status', event.target.value)}
                                disabled={!(canEditSelected || canTrackSelected)}
                            >
                                {statusOptions.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
                            </TextField>
                        </Box>
                        <Box sx={{ gridColumn: fieldSpan.full }}>
                            <TextField
                                fullWidth
                                multiline
                                minRows={3}
                                label="Observacao"
                                value={form.observacao}
                                onChange={(event) => updateForm('observacao', event.target.value)}
                                disabled={!canEditSelected}
                            />
                        </Box>
                        {isTracking && canTrackSelected && (
                            <Box sx={{ gridColumn: fieldSpan.full }}>
                                <TextField
                                    fullWidth
                                    required
                                    multiline
                                    minRows={3}
                                    label={`O que foi feito (${form.status})`}
                                    value={trackingNote}
                                    onChange={(event) => setTrackingNote(event.target.value)}
                                    helperText="Esse texto sera salvo no historico junto com o status selecionado."
                                />
                            </Box>
                        )}
                    </Box>

                    <ClienteRbxPanel cliente={rbxClient} />

                    {selected && (
                        <>
                            <Divider sx={{ my: 2 }} />
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Criado em</Typography>
                                    <Typography fontWeight={700}>
                                        {selected.createdAt ? new Date(selected.createdAt).toLocaleString('pt-BR') : '-'}
                                    </Typography>
                                    <Typography color="text.secondary" variant="caption">
                                        {selected.createdBy ? `por ${selected.createdBy}` : ''}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Atualizado em</Typography>
                                    <Typography fontWeight={700}>
                                        {selected.updatedAt ? new Date(selected.updatedAt).toLocaleString('pt-BR') : '-'}
                                    </Typography>
                                    <Typography color="text.secondary" variant="caption">
                                        {selected.updatedBy ? `por ${selected.updatedBy}` : ''}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Fechado em</Typography>
                                    <Typography fontWeight={700}>
                                        {selected.closedAt ? new Date(selected.closedAt).toLocaleString('pt-BR') : '-'}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Ultimo usuario</Typography>
                                    <Typography fontWeight={700}>
                                        {selected.lastUser || '-'}
                                    </Typography>
                                </Box>
                            </Stack>
                            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mt: 2 }}>
                                <Typography variant="subtitle1" fontWeight={800}>Historico de acompanhamento</Typography>
                                <Stack spacing={1.2} sx={{ mt: 1.5 }}>
                                    {selected.history?.length ? selected.history.map((item) => (
                                        <Box
                                            key={item.id}
                                            sx={{
                                                border: '1px solid',
                                                borderColor: 'divider',
                                                borderRadius: 1,
                                                p: 1.5,
                                            }}
                                        >
                                            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1}>
                                                <Box>
                                                    <Typography fontWeight={800}>
                                                        {item.previousStatus || '-'} para {item.nextStatus || '-'}
                                                    </Typography>
                                                    <Typography color="text.secondary" variant="body2">
                                                        {item.notes}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                                                    <Typography variant="body2" fontWeight={700}>
                                                        {formatCurrency(item.previousValue)} para {formatCurrency(item.nextValue)}
                                                    </Typography>
                                                    <Typography color="text.secondary" variant="caption">
                                                        {[item.user, item.createdAt ? new Date(item.createdAt).toLocaleString('pt-BR') : null].filter(Boolean).join(' - ')}
                                                    </Typography>
                                                </Box>
                                            </Stack>
                                        </Box>
                                    )) : (
                                        <Typography color="text.secondary" variant="body2">
                                            Nenhum acompanhamento registrado.
                                        </Typography>
                                    )}
                                </Stack>
                            </Paper>
                        </>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setOpen(false)}>Cancelar</Button>
                    {canSaveSelected && (
                        <Button variant="contained" onClick={handleSubmit} disabled={saveDisabled}>
                            {saving ? 'Salvando...' : 'Salvar cobranca'}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Cobrancas;
