import AddCircleRoundedIcon from '@mui/icons-material/AddCircleRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
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
    TablePagination,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ChartValueList from '../../Componentes/ChartValueList';
import ExportDashboardPdfButton from '../../Componentes/ExportDashboardPdfButton';
import Api from '../../Services/Api';
import {
    dashboardChartSx,
    dashboardHeaderSx,
    dashboardInputSx,
    dashboardMetricSx,
    dashboardMutedTextSx,
    dashboardPalette,
    dashboardPanelSx,
    dashboardShellSx,
    dashboardSubtleTextSx,
} from '../../Utils/DashboardTheme';

const UseApi = Api();

const defaultStatusOptions = ['Cobrança emitida', 'Promessa de pagamento', 'Sem retorno', 'Pago', 'Cancelado'];
const defaultActionOptions = [
    'Contato',
    'Sem retorno',
    'Promessa de pagamento',
    'Acordo',
    'Segunda via enviada',
    'Contestacao',
    'Negativacao',
    'Pago',
];
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
    numeroContrato: '',
    boletoSelecionado: '',
    cliente: '',
    grupoCliente: '',
    data: new Date().toISOString().slice(0, 10),
    dataVencimento: '',
    dataPromessa: '',
    valor: '',
    valorPago: '',
    status: 'Cobrança emitida',
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
        contractNumber: charge.numeroContrato,
        documentNumber: charge.documentoTitulo,
        client: charge.cliente,
        clientGroup: formatClientGroup(charge.grupoCliente),
        date: charge.data,
        dueDate: charge.dataVencimento,
        promiseDate: charge.dataPromessa,
        value: Number(charge.valor || 0),
        paidValue: charge.valorPago == null ? null : Number(charge.valorPago),
        status: charge.status || 'Cobrança emitida',
        serviceSituation: charge.situacaoAtendimento || (isFinalStatus(charge.status) ? 'Fechada' : 'Aberta'),
        notes: charge.observacao,
        createdAt: charge.criadoEm,
        updatedAt: charge.atualizadoEm,
        closedAt: charge.fechadoEm,
        createdBy: charge.criadoPor,
        updatedBy: charge.atualizadoPor,
        lastUser: charge.ultimoUsuario || charge.atualizadoPor || charge.criadoPor || '',
        automatic: Boolean(charge.geradaAutomaticamente),
        responsible: charge.responsavel || '',
        capturedAt: charge.capturadoEm,
        rbxStatus: charge.statusIntegracaoRbx || '',
        rbxTicket: charge.atendimentoRbxNumero || '',
        editable: charge.editavel !== false,
        excluded: Boolean(charge.excluida),
        excludedAt: charge.excluidoEm,
        excludedBy: charge.excluidoPor,
        exclusionReason: charge.motivoExclusao,
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
        numeroContrato: charge?.contractNumber || '',
        boletoSelecionado: charge?.documentNumber || '',
        cliente: charge?.client || '',
        grupoCliente: charge?.clientGroup || '',
        data: charge?.date || new Date().toISOString().slice(0, 10),
        dataVencimento: charge?.dueDate || '',
        dataPromessa: charge?.promiseDate || '',
        valor: charge?.value ? String(charge.value) : '',
        valorPago: charge?.paidValue != null ? String(charge.paidValue) : '',
        status: charge?.status || 'Cobrança emitida',
        observacao: charge?.notes || '',
    };
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));
}

function formatConfiguredOption(value, defaults) {
    const text = String(value || '').trim();
    const known = defaults.find((item) => item.localeCompare(text, 'pt-BR', { sensitivity: 'base' }) === 0);
    if (known) return known;
    return text ? `${text.charAt(0).toUpperCase()}${text.slice(1).toLowerCase()}` : '';
}

function formatDate(value) {
    if (!value) return 'Nao informado';
    return new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR');
}

function isFinalStatus(status) {
    return ['PAGO', 'FECHADO', 'CANCELADO'].includes(String(status || '').trim().toUpperCase());
}

function isClosedStatus(status) {
    return String(status || '').trim().toUpperCase() === 'FECHADO';
}

function isPromiseStatus(status) {
    return String(status || '').trim().toUpperCase() === 'PROMESSA DE PAGAMENTO';
}

function isPaidStatus(status) {
    return String(status || '').trim().toUpperCase() === 'PAGO';
}

function allowsOriginalValueChange(status) {
    return ['NEGOCIACAO', 'NEGOCIAÇÃO', 'EM NEGOCIACAO', 'EM NEGOCIAÇÃO', 'PROMESSA DE PAGAMENTO']
        .includes(String(status || '').trim().toUpperCase());
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

function needsSevenDayReminder(charge) {
    if (charge.excluded || charge.serviceSituation === 'Fechada') return false;
    const lastMovement = charge.updatedAt || charge.createdAt;
    if (!lastMovement) return false;
    const limit = new Date();
    limit.setDate(limit.getDate() - 7);
    return new Date(lastMovement) <= limit;
}

function readClientField(cliente, lowerKey, upperKey) {
    return cliente?.[lowerKey] ?? cliente?.[upperKey] ?? '';
}

function formatClientGroup(group) {
    const normalized = String(group || '').trim();
    return clientGroupNames[normalized] || normalized;
}

function normalizeRbxClient(response) {
    const payload = response?.data || response;
    const client = Array.isArray(payload) ? payload[0] : payload?.cliente || payload;
    const contratosPayload = Array.isArray(payload?.contratos) ? payload.contratos : [];

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
        contratos: contratosPayload.map((contrato) => ({
            numero: readClientField(contrato, 'numero', 'Numero'),
            plano: readClientField(contrato, 'plano', 'Plano'),
            situacao: readClientField(contrato, 'situacao', 'Situacao'),
            boletos: (Array.isArray(contrato.boletos) ? contrato.boletos : []).map((boleto, index) => ({
                id: readClientField(boleto, 'documento', 'Documento') || `${readClientField(boleto, 'vencimento', 'Vencimento')}-${index}`,
                documento: readClientField(boleto, 'documento', 'Documento'),
                valor: Number(readClientField(boleto, 'valor', 'Valor') || 0),
                vencimento: readClientField(boleto, 'vencimento', 'Vencimento'),
            })),
        })),
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
    const navigate = useNavigate();
    const [statusOptions, setStatusOptions] = useState(defaultStatusOptions);
    const [actionOptions, setActionOptions] = useState(defaultActionOptions);
    const viewMode = mode || (readOnly ? 'dashboard' : 'cadastro');
    const isDashboard = viewMode === 'dashboard';
    const isTracking = viewMode === 'acompanhamento';
    const isAutomaticQueue = viewMode === 'automaticas';
    const isRegister = viewMode === 'cadastro';
    const isPaidList = viewMode === 'pagas';
    const [charges, setCharges] = useState([]);
    const [delinquentQueue, setDelinquentQueue] = useState([]);
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
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(20);
    const [trackingNote, setTrackingNote] = useState('');
    const [open, setOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteReason, setDeleteReason] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [rbxLoading, setRbxLoading] = useState(false);
    const [error, setError] = useState('');

    const loadCharges = async () => {
        setLoading(true);
        setError('');
        try {
            const [response, queue] = await Promise.all([
                UseApi(isPaidList
                    ? 'cobrancas/auditoria'
                    : isTracking
                        ? 'cobrancas/acompanhamento'
                        : isAutomaticQueue
                            ? 'cobrancas/automaticas'
                            : 'cobrancas'),
                isRegister ? UseApi('cobrancas/painel/fila-inadimplentes') : Promise.resolve([]),
            ]);
            setCharges(Array.isArray(response) ? response.map(normalizeCharge) : []);
            setDelinquentQueue(Array.isArray(queue) ? queue : []);
        } catch (requestError) {
            setError(requestError.message || 'Erro ao carregar cobrancas.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCharges();
    }, [isPaidList, isTracking, isAutomaticQueue]);

    useEffect(() => {
        const loadConfiguredOptions = async () => {
            try {
                const [configuredActions, configuredStatuses] = await Promise.all([
                    UseApi('evento?segmento=COBRANCA_ACAO'),
                    UseApi('evento?segmento=COBRANCA_STATUS'),
                ]);
                const actions = Array.isArray(configuredActions)
                    ? configuredActions.map((item) => formatConfiguredOption(item.label, defaultActionOptions)).filter(Boolean)
                    : [];
                const statuses = Array.isArray(configuredStatuses)
                    ? configuredStatuses.map((item) => formatConfiguredOption(item.label, defaultStatusOptions)).filter(Boolean)
                    : [];
                setActionOptions(actions.length ? actions : defaultActionOptions);
                setStatusOptions(statuses.length ? statuses : defaultStatusOptions);
            } catch (requestError) {
                console.error('Erro ao carregar configuracoes de cobranca:', requestError);
            }
        };
        loadConfiguredOptions();
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
                if (!isDashboard) return true;
                return !charge.excluded && !isClosedStatus(charge.status);
            })
            .filter((charge) => {
                if (!isDashboard) return true;
                return isSameMonth(charge.date, dashboardMonth);
            })
            .filter((charge) => {
                if (statusFilter === 'Todos') return true;
                if (statusFilter === 'Em aberto') return !charge.excluded && !isFinalStatus(charge.status);
                if (statusFilter === 'Finalizadas') return isFinalStatus(charge.status);
                if (statusFilter === 'Promessas hoje') return isPromiseStatus(charge.status) && charge.promiseDate === todayIso();
                if (statusFilter === 'Promessas vencidas') return isPromiseStatus(charge.status) && charge.promiseDate && charge.promiseDate < todayIso();
                if (statusFilter === 'Sem atualização há 7 dias') return needsSevenDayReminder(charge);
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
                    charge.serviceSituation,
                    charge.lastUser,
                    charge.clientGroup,
                    charge.excludedBy,
                    charge.exclusionReason,
                ].some((value) => String(value || '').toLowerCase().includes(search));
            })
            .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    }, [charges, dashboardMonth, isDashboard, statusFilter, searchFilter, userFilter, actionFilter, groupFilter]);

    useEffect(() => {
        setPage(0);
    }, [dashboardMonth, statusFilter, searchFilter, userFilter, actionFilter, groupFilter, viewMode]);

    useEffect(() => {
        const lastPage = Math.max(0, Math.ceil(filteredCharges.length / rowsPerPage) - 1);
        if (page > lastPage) setPage(lastPage);
    }, [filteredCharges.length, page, rowsPerPage]);

    const paginatedCharges = useMemo(
        () => filteredCharges.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
        [filteredCharges, page, rowsPerPage],
    );

    const reminderCount = useMemo(
        () => charges.filter(needsSevenDayReminder).length,
        [charges],
    );

    const metrics = useMemo(() => {
        const source = isDashboard ? filteredCharges : charges;
        const abertas = source.filter((charge) => !charge.excluded && !isFinalStatus(charge.status));
        const pagas = source.filter((charge) => !charge.excluded && String(charge.status || '').toUpperCase() === 'PAGO');
        const excluidas = source.filter((charge) => charge.excluded);
        const pagasMes = source.filter((charge) => (
            !charge.excluded
            &&
            String(charge.status || '').toUpperCase() === 'PAGO'
            && isSameMonth(charge.date, dashboardMonth)
        ));
        const promessasHoje = source.filter((charge) => !charge.excluded && isPromiseStatus(charge.status) && charge.promiseDate === todayIso());
        const promessasVencidas = source.filter((charge) => !charge.excluded && isPromiseStatus(charge.status) && charge.promiseDate && charge.promiseDate < todayIso());
        const valorAberto = abertas.reduce((total, charge) => total + charge.value, 0);
        const valorPago = pagas.reduce((total, charge) => total + (charge.paidValue ?? charge.value), 0);
        const valorExcluido = excluidas.reduce((total, charge) => total + charge.value, 0);
        const valorPagoMes = pagasMes.reduce((total, charge) => total + (charge.paidValue ?? charge.value), 0);
        const valorTotal = source.reduce((total, charge) => total + charge.value, 0);

        return {
            total: source.length,
            abertas: abertas.length,
            pagas: pagas.length,
            excluidas: excluidas.length,
            pagasMes: pagasMes.length,
            promessasHoje: promessasHoje.length,
            promessasVencidas: promessasVencidas.length,
            valorAberto,
            valorPago,
            valorExcluido,
            valorPagoMes,
            valorTotal,
        };
    }, [charges, dashboardMonth, filteredCharges, isDashboard]);

    const chartData = useMemo(() => {
        const statusCounts = countBy(filteredCharges, (charge) => charge.status);
        const auditCounts = {
            'Em aberto': filteredCharges.filter((charge) => !charge.excluded && !isFinalStatus(charge.status)).length,
            Pagas: filteredCharges.filter((charge) => !charge.excluded && String(charge.status || '').toUpperCase() === 'PAGO').length,
        };
        const auditValues = {
            'Em aberto': filteredCharges
                .filter((charge) => !charge.excluded && !isFinalStatus(charge.status))
                .reduce((total, charge) => total + charge.value, 0),
            Pagas: filteredCharges
                .filter((charge) => !charge.excluded && String(charge.status || '').toUpperCase() === 'PAGO')
                .reduce((total, charge) => total + charge.value, 0),
        };
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
        const individualUsers = Array.from(new Set(filteredCharges
            .map((charge) => normalizeLabel(charge.createdBy))
            .filter((user) => user !== 'Nao informado'))).sort();
        const individualRows = individualUsers.map((user) => {
            const opened = filteredCharges.filter((charge) => (
                !charge.excluded
                && charge.serviceSituation !== 'Fechada'
                && normalizeLabel(charge.createdBy) === user
            ));
            const paid = filteredCharges.filter((charge) => (
                !charge.excluded
                && isPaidStatus(charge.status)
                && normalizeLabel(charge.createdBy) === user
                && normalizeLabel(charge.updatedBy) === user
            ));
            return {
                user,
                openedCount: opened.length,
                openedValue: opened.reduce((total, charge) => total + charge.value, 0),
                paidCount: paid.length,
                paidValue: paid.reduce((total, charge) => total + (charge.paidValue ?? charge.value), 0),
            };
        });

        return {
            statusPie: statusEntries.map(([label, value], index) => ({ id: index, label, value, color: dashboardPalette[index % dashboardPalette.length] })),
            auditStatusPie: Object.entries(auditCounts)
                .filter(([, value]) => value > 0)
                .map(([label, value], index) => ({ id: label, label, value, color: dashboardPalette[index % dashboardPalette.length] })),
            auditValuePie: Object.entries(auditValues)
                .filter(([, value]) => value > 0)
                .map(([label, value], index) => ({ id: label, label, value, color: dashboardPalette[index % dashboardPalette.length] })),
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
            individualRows,
        };
    }, [filteredCharges]);

    const updateForm = (field, value) => setForm((current) => ({ ...current, [field]: value }));

    const findChargeInProgressByContract = (code, contractNumber, ignoredId = selected?.id) => {
        const normalizedCode = String(code || '').trim();
        const normalizedContract = String(contractNumber || '').trim();
        if (!normalizedCode || !normalizedContract) return null;

        return charges.find((charge) => (
            String(charge.clientCode || '').trim() === normalizedCode
            && String(charge.contractNumber || '').trim() === normalizedContract
            && charge.id !== ignoredId
            && !charge.excluded
            && charge.serviceSituation !== 'Fechada'
            && !isFinalStatus(charge.status)
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

    const searchRbxClient = async (codeOverride) => {
        const explicitCode = typeof codeOverride === 'string' || typeof codeOverride === 'number' ? codeOverride : null;
        const code = explicitCode || form.codigoCliente || selected?.clientCode;
        if (!code) {
            setError('Informe o codigo do cliente para buscar no RBX.');
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
                    numeroContrato: '',
                    boletoSelecionado: '',
                    dataVencimento: '',
                    valor: '',
                }));
            }
        } catch (requestError) {
            setError(requestError.message || 'Erro ao buscar cliente no RBX.');
        } finally {
            setRbxLoading(false);
        }
    };

    const openFromDelinquentQueue = (item) => {
        setSelected(null);
        setRbxClient(null);
        setValidatedClientCode('');
        setTrackingNote('');
        setForm({
            ...emptyForm,
            codigoCliente: item.codigoCliente,
            cliente: item.cliente || '',
            data: new Date().toISOString().slice(0, 10),
        });
        setOpen(true);
        searchRbxClient(item.codigoCliente);
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
            if (!selected && (!form.numeroContrato || !form.boletoSelecionado)) {
                throw new Error('Selecione o contrato e um boleto em aberto antes de cadastrar a cobranca.');
            }
            const chargeInProgress = !selected ? findChargeInProgressByContract(form.codigoCliente, form.numeroContrato, null) : null;
            if (chargeInProgress) {
                throw new Error(`Ja existe uma cobranca em andamento para o contrato ${form.numeroContrato}: ${chargeInProgress.protocol} (${chargeInProgress.status}).`);
            }
            const payload = {
                acao: form.acao,
                codigoCliente: form.codigoCliente ? Number(form.codigoCliente) : null,
                numeroContrato: form.numeroContrato,
                documentoTitulo: selectedRbxContract?.boletos.find((item) => item.id === form.boletoSelecionado)?.documento || null,
                cliente: form.cliente,
                grupoCliente: form.grupoCliente,
                data: form.data || null,
                dataVencimento: form.dataVencimento || null,
                valor: Number(String(form.valor || 0).replace(',', '.')),
                valorPago: isPaidStatus(form.status) ? Number(String(form.valorPago || 0).replace(',', '.')) : null,
                dataPromessa: isPromiseStatus(form.status) ? form.dataPromessa || null : null,
                status: form.status,
                observacao: form.observacao,
            };
            const response = isTracking && selected
                ? await UseApi(`cobrancas/${selected.id}/acompanhamento`, 'PATCH', {
                    status: form.status,
                    valor: Number(String(form.valor || 0).replace(',', '.')),
                    valorPago: isPaidStatus(form.status) ? Number(String(form.valorPago || 0).replace(',', '.')) : null,
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

    const openDeleteDialog = (charge) => {
        setDeleteTarget(charge);
        setDeleteReason('');
        setError('');
        setDeleteOpen(true);
    };

    const closeDeleteDialog = () => {
        setDeleteOpen(false);
        setDeleteTarget(null);
        setDeleteReason('');
    };

    const handleLogicalDelete = async () => {
        if (!deleteReason.trim()) {
            setError('Informe o motivo da exclusao.');
            return;
        }
        setSaving(true);
        setError('');
        try {
            const response = await UseApi(`cobrancas/${deleteTarget.id}/excluir`, 'PATCH', {
                motivo: deleteReason.trim(),
            });
            const normalized = normalizeCharge(response);
            setCharges((current) => current.map((charge) => (charge.id === normalized.id ? normalized : charge)));
            closeDeleteDialog();
        } catch (requestError) {
            setError(requestError.message || 'Erro ao excluir cobranca.');
        } finally {
            setSaving(false);
        }
    };

    const captureCharge = async (charge) => {
        setSaving(true);
        setError('');
        try {
            const response = await UseApi(`cobrancas/${charge.id}/capturar`, 'PATCH');
            const normalized = normalizeCharge(response);
            setCharges((current) => current.map((item) => (item.id === normalized.id ? normalized : item)));
            if (isAutomaticQueue) navigate('/financeiro/cobranca/acompanhamento');
        } catch (requestError) {
            setError(requestError.message || 'Erro ao capturar atendimento.');
        } finally {
            setSaving(false);
        }
    };

    const canEditSelected = isRegister && (!selected || selected.editable);
    const canTrackSelected = isTracking && Boolean(selected?.editable);
    const canSaveSelected = canEditSelected || canTrackSelected;
    const canEditOriginalValue = canSaveSelected && allowsOriginalValueChange(form.status);
    const selectedRbxContract = rbxClient?.contratos?.find((item) => String(item.numero) === String(form.numeroContrato));
    const saveDisabled = saving
        || (isTracking && canTrackSelected && !trackingNote.trim())
        || (!selected && isRegister && (!validatedClientCode || String(form.codigoCliente).trim() !== validatedClientCode || !form.cliente))
        || (!selected && isRegister && (!form.numeroContrato || !form.boletoSelecionado))
        || (canEditSelected && !form.dataVencimento)
        || (canSaveSelected && isPaidStatus(form.status) && Number(String(form.valorPago || 0).replace(',', '.')) <= 0)
        || (canSaveSelected && isPromiseStatus(form.status) && !form.dataPromessa);

    const pageTitle = {
        cadastro: 'Cobrancas',
        dashboard: 'Dashboard de cobrancas',
        acompanhamento: 'Acompanhamento de cobrancas',
        automaticas: 'Atendimentos automaticos',
        pagas: 'Baixas e auditoria',
    }[viewMode];

    const pageSubtitle = {
        cadastro: 'Cadastro, acompanhamento e fechamento das acoes de cobranca.',
        dashboard: 'Resumo geral da carteira de cobrancas, sem alteracao de registros.',
        acompanhamento: 'Fila operacional para acompanhar status, priorizando cobrancas em aberto.',
        automaticas: 'Boletos vencidos identificados automaticamente e ainda aguardando captura.',
        pagas: 'Consulta de baixas, exclusoes logicas e historico de auditoria.',
    }[viewMode];

    return (
        <Box
            id="dashboard-cobrancas-export"
            sx={{
                py: 2,
                ...(isDashboard ? dashboardShellSx : {}),
            }}
        >
            <Paper
                variant="outlined"
                sx={{
                    p: isDashboard ? 1.8 : 2.5,
                    mb: 2,
                    borderRadius: isDashboard ? 1 : 2,
                    ...(isDashboard ? dashboardHeaderSx : {}),
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
                                        ...dashboardInputSx,
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
            {reminderCount > 0 && (
                <Alert
                    severity="warning"
                    sx={{ mb: 2 }}
                    action={(
                        <Button color="inherit" size="small" onClick={() => setStatusFilter('Sem atualização há 7 dias')}>
                            Ver cobranças
                        </Button>
                    )}
                >
                    {reminderCount} cobrança(s) aberta(s) estão há 7 dias ou mais sem atualização.
                </Alert>
            )}
            {(metrics.promessasHoje > 0 || metrics.promessasVencidas > 0) && (
                <Alert severity={metrics.promessasVencidas > 0 ? 'error' : 'warning'} sx={{ mb: 2 }}>
                    {metrics.promessasVencidas > 0
                        ? `${metrics.promessasVencidas} promessa(s) de pagamento vencida(s).`
                        : `${metrics.promessasHoje} promessa(s) de pagamento vencem hoje.`}
                </Alert>
            )}

            {isRegister && (
                <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1} mb={1.5}>
                        <Box>
                            <Typography variant="h6" fontWeight={800}>Fila automática de inadimplentes</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Clientes identificados pelos boletos importados, vencidos e ainda sem baixa. Selecione um cliente para consultar contratos e iniciar a cobrança.
                            </Typography>
                        </Box>
                        <Chip color={delinquentQueue.length ? 'error' : 'success'} variant="outlined" label={`${delinquentQueue.length} cliente(s)`} />
                    </Stack>
                    <TableContainer sx={{ maxHeight: 330 }}>
                        <Table size="small" stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Código / cliente</TableCell>
                                    <TableCell>Vencidos</TableCell>
                                    <TableCell>Mais antigo</TableCell>
                                    <TableCell>Valor vencido</TableCell>
                                    <TableCell>Situação</TableCell>
                                    <TableCell align="right">Ação</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {delinquentQueue.map((item) => (
                                    <TableRow key={item.codigoCliente} hover>
                                        <TableCell>
                                            <Typography fontWeight={700}>{item.cliente || 'Nome será atualizado pelo RBX'}</Typography>
                                            <Typography variant="caption" color="text.secondary">Código {item.codigoCliente}</Typography>
                                        </TableCell>
                                        <TableCell>{Number(item.boletosVencidos || 0).toLocaleString('pt-BR')}</TableCell>
                                        <TableCell>{formatDate(item.vencimentoMaisAntigo)}</TableCell>
                                        <TableCell>{formatCurrency(item.valorVencido)}</TableCell>
                                        <TableCell>
                                            <Chip size="small" color={item.atendimentoAberto ? 'warning' : 'error'} variant="outlined" label={item.atendimentoAberto ? 'Em atendimento' : 'Pendente'} />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Button size="small" variant="outlined" onClick={() => openFromDelinquentQueue(item)}>
                                                {item.atendimentoAberto ? 'Ver contratos' : 'Iniciar cobrança'}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {!delinquentQueue.length && (
                                    <TableRow><TableCell colSpan={6} align="center">Nenhum boleto vencido importado e pendente de baixa.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}

            {isDashboard && <Box sx={{ ...pageGridSx, mb: 2 }}>
                {[
                    ['Cobrancas', metrics.total, 'registros no sistema'],
                    ['Em aberto', metrics.abertas, formatCurrency(metrics.valorAberto)],
                    ['Pago no mes', metrics.pagasMes, formatCurrency(metrics.valorPagoMes)],
                    ['Promessas hoje', metrics.promessasHoje, `${metrics.promessasVencidas} vencidas`],
                    ['Pagas', metrics.pagas, `${formatCurrency(metrics.valorPago)} de ${formatCurrency(metrics.valorTotal)}`],
                ].map(([label, value, detail]) => (
                    <Paper
                        variant="outlined"
                        sx={{
                            p: 2,
                            borderRadius: 1.5,
                            ...dashboardMetricSx,
                        }}
                        key={label}
                    >
                        <Stack direction="row" alignItems="center" spacing={1.2}>
                            <TimelineRoundedIcon color="primary" />
                            <Box>
                                <Typography sx={dashboardSubtleTextSx} variant="body2" fontWeight={800}>{label}</Typography>
                                <Typography variant="h5" fontWeight={800}>{value}</Typography>
                                <Typography sx={dashboardMutedTextSx} variant="caption">{detail}</Typography>
                            </Box>
                        </Stack>
                    </Paper>
                ))}
            </Box>}

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
                        <Typography variant="h6" fontWeight={800}>Pagas x em aberto</Typography>
                                <Typography sx={{ ...dashboardSubtleTextSx, mb: 1 }} variant="body2">
                                    Visao de auditoria por situacao operacional.
                                </Typography>
                                {chartData.auditStatusPie.length ? (
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
                                                    data: chartData.auditStatusPie,
                                                    innerRadius: 45,
                                                    paddingAngle: 2,
                                                }]}
                                                slotProps={{ legend: { hidden: true } }}
                                                sx={dashboardChartSx}
                                            />
                                        </Box>
                                        <ChartValueList items={chartData.auditStatusPie} />
                                    </Box>
                                ) : (
                                    <Stack alignItems="center" justifyContent="center" minHeight={220}>
                                        <Typography sx={dashboardMutedTextSx}>Sem dados para exibir.</Typography>
                                    </Stack>
                                )}
                    </Paper>

                    <Paper variant="outlined" sx={{ ...dashboardPanelSx, p: 2 }}>
                        <Typography variant="h6" fontWeight={800}>Valores por situacao</Typography>
                                <Typography sx={{ ...dashboardSubtleTextSx, mb: 1 }} variant="body2">
                                    Comparativo financeiro entre abertas e pagas.
                                </Typography>
                                {chartData.auditValuePie.length ? (
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
                                                    data: chartData.auditValuePie,
                                                    innerRadius: 45,
                                                    paddingAngle: 2,
                                                    valueFormatter: (item) => formatCurrency(item.value),
                                                }]}
                                                slotProps={{ legend: { hidden: true } }}
                                                sx={dashboardChartSx}
                                            />
                                        </Box>
                                        <ChartValueList items={chartData.auditValuePie} valueFormatter={formatCurrency} />
                                    </Box>
                                ) : (
                                    <Stack alignItems="center" justifyContent="center" minHeight={220}>
                                        <Typography sx={dashboardMutedTextSx}>Sem dados para exibir.</Typography>
                                    </Stack>
                                )}
                    </Paper>
                    <Paper variant="outlined" sx={{ ...dashboardPanelSx, p: 2 }}>
                        <Typography variant="h6" fontWeight={800}>Status por usuario</Typography>
                        <Typography sx={{ ...dashboardSubtleTextSx, mb: 1 }} variant="body2">
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
                                <Typography sx={dashboardMutedTextSx}>Sem dados para exibir.</Typography>
                            </Stack>
                        )}
                    </Paper>
                    <Paper variant="outlined" sx={{ ...dashboardPanelSx, p: 2 }}>
                        <Typography variant="h6" fontWeight={800}>Status por usuario</Typography>
                        <Typography sx={{ ...dashboardSubtleTextSx, mb: 1 }} variant="body2">
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
                                <Typography sx={dashboardMutedTextSx}>Sem dados para exibir.</Typography>
                            </Stack>
                        )}
                    </Paper>
                    <Paper variant="outlined" sx={{ ...dashboardPanelSx, p: 2 }}>
                        <Typography variant="h6" fontWeight={800}>Valor por usuario</Typography>
                        <Typography sx={{ ...dashboardSubtleTextSx, mb: 1 }} variant="body2">
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
                                <Typography sx={dashboardMutedTextSx}>Sem dados para exibir.</Typography>
                            </Stack>
                        )}
                    </Paper>
                    <Paper variant="outlined" sx={{ ...dashboardPanelSx, p: 2 }}>
                        <Typography variant="h6" fontWeight={800}>Valor por grupo</Typography>
                        <Typography sx={{ ...dashboardSubtleTextSx, mb: 1 }} variant="body2">
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
                                <Typography sx={dashboardMutedTextSx}>Sem dados para exibir.</Typography>
                            </Stack>
                        )}
                    </Paper>
                    <Paper variant="outlined" sx={{ ...dashboardPanelSx, p: 2, gridColumn: '1 / -1' }}>
                        <Typography variant="h6" fontWeight={800}>Resultado individual por usuário</Typography>
                        <Typography sx={{ ...dashboardSubtleTextSx, mb: 1 }} variant="body2">
                            Uma cobrança paga só conta como resultado individual quando o mesmo usuário abriu e concluiu o atendimento.
                        </Typography>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Usuário</TableCell>
                                        <TableCell align="right">Em aberto</TableCell>
                                        <TableCell align="right">Valor em aberto</TableCell>
                                        <TableCell align="right">Pagas pelo mesmo usuário</TableCell>
                                        <TableCell align="right">Valor recuperado</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {chartData.individualRows.map((row) => (
                                        <TableRow key={row.user}>
                                            <TableCell>{row.user}</TableCell>
                                            <TableCell align="right">{row.openedCount}</TableCell>
                                            <TableCell align="right">{formatCurrency(row.openedValue)}</TableCell>
                                            <TableCell align="right">{row.paidCount}</TableCell>
                                            <TableCell align="right">{formatCurrency(row.paidValue)}</TableCell>
                                        </TableRow>
                                    ))}
                                    {!chartData.individualRows.length && (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center">Sem resultados individuais no período.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Box>
            )}

            <Paper
                className={isDashboard ? 'pdf-export-ignore' : undefined}
                variant="outlined"
                sx={{ p: 2, borderRadius: 2 }}
            >
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2} mb={2}>
                    <Box>
                        <Typography variant="h6" fontWeight={800}>
                            {isDashboard ? 'Resumo da fila' : isPaidList ? 'Baixas registradas' : isAutomaticQueue ? 'Disponiveis para captura' : 'Fila de cobranca'}
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
                            <MenuItem value="Sem atualização há 7 dias">Sem atualização há 7 dias</MenuItem>
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
                                    <TableCell>Data registro</TableCell>
                                    <TableCell>Data vencimento</TableCell>
                                    <TableCell>Valor</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Situação do atendimento</TableCell>
                                    <TableCell>Usuario</TableCell>
                                    {isPaidList && <TableCell>Exclusao</TableCell>}
                                    <TableCell align="right">{isPaidList ? 'Acoes' : 'Detalhes'}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {paginatedCharges.map((charge) => (
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
                                        <TableCell>{formatDate(charge.dueDate)}</TableCell>
                                        <TableCell>
                                            <Typography fontSize="inherit">Original: {formatCurrency(charge.value)}</Typography>
                                            {isPaidStatus(charge.status) && (
                                                <Typography color="success.main" variant="caption" display="block">
                                                    Pago: {formatCurrency(charge.paidValue ?? charge.value)}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                size="small"
                                                color={charge.excluded ? 'error' : isPromiseStatus(charge.status) && charge.promiseDate && charge.promiseDate <= todayIso() ? 'error' : isFinalStatus(charge.status) ? 'success' : 'warning'}
                                                label={charge.excluded ? 'Excluida' : charge.status}
                                            />
                                            {isPromiseStatus(charge.status) && charge.promiseDate && (
                                                <Typography display="block" color="text.secondary" variant="caption">
                                                    Promessa: {formatDate(charge.promiseDate)}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                size="small"
                                                color={charge.serviceSituation === 'Fechada' ? 'default' : 'success'}
                                                variant="outlined"
                                                label={charge.serviceSituation}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography fontSize="inherit">
                                                {charge.responsible || (charge.automatic ? 'Aguardando captura' : charge.lastUser || 'sem usuario')}
                                            </Typography>
                                            {charge.automatic && (
                                                <Typography color="text.secondary" variant="caption" display="block">
                                                    Automático • RBX: {charge.rbxStatus || 'não iniciado'}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        {isPaidList && (
                                            <TableCell>
                                                {charge.excluded ? (
                                                    <>
                                                        <Typography fontWeight={700} fontSize="inherit">
                                                            {charge.excludedBy || 'sem usuario'}
                                                        </Typography>
                                                        <Typography color="text.secondary" variant="caption" display="block">
                                                            {charge.excludedAt ? new Date(charge.excludedAt).toLocaleString('pt-BR') : '-'}
                                                        </Typography>
                                                        <Typography color="text.secondary" variant="caption" display="block">
                                                            {charge.exclusionReason || 'Motivo nao informado'}
                                                        </Typography>
                                                    </>
                                                ) : (
                                                    <Typography color="text.secondary" variant="caption">Nao excluida</Typography>
                                                )}
                                            </TableCell>
                                        )}
                                        <TableCell align="right">
                                            {charge.automatic
                                                && (!charge.responsible || charge.rbxStatus === 'ERRO_ABERTURA_TESTE_RBX')
                                                && charge.serviceSituation !== 'Fechada' && (
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    disabled={saving}
                                                    onClick={() => captureCharge(charge)}
                                                    sx={{ mr: 0.5 }}
                                                >
                                                    {charge.responsible ? 'Tentar RBX novamente' : 'Capturar'}
                                                </Button>
                                            )}
                                            <IconButton size="small" onClick={() => openCharge(charge)}>
                                                {isDashboard || !charge.editable ? <InfoOutlinedIcon fontSize="small" /> : <EditRoundedIcon fontSize="small" />}
                                            </IconButton>
                                            {isPaidList && !charge.excluded && (
                                                <IconButton size="small" color="error" onClick={() => openDeleteDialog(charge)}>
                                                    <DeleteRoundedIcon fontSize="small" />
                                                </IconButton>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {!filteredCharges.length && (
                                    <TableRow>
                                        <TableCell colSpan={isPaidList ? 12 : 11} align="center">Nenhuma cobranca cadastrada.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </TableContainer>
                {!loading && filteredCharges.length > 0 && (
                    <TablePagination
                        component="div"
                        count={filteredCharges.length}
                        page={page}
                        onPageChange={(_, nextPage) => setPage(nextPage)}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={(event) => {
                            setRowsPerPage(Number(event.target.value));
                            setPage(0);
                        }}
                        rowsPerPageOptions={[20, 50, 100]}
                        labelRowsPerPage="Linhas por página"
                        labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
                    />
                )}
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
                                    updateForm('numeroContrato', '');
                                    updateForm('boletoSelecionado', '');
                                    updateForm('dataVencimento', '');
                                    updateForm('valor', '');
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
                                select={Boolean(rbxClient) && !selected}
                                fullWidth
                                required={!selected}
                                label="Contrato / ponto de internet"
                                value={form.numeroContrato}
                                onChange={(event) => {
                                    const numeroContrato = event.target.value;
                                    updateForm('numeroContrato', numeroContrato);
                                    updateForm('boletoSelecionado', '');
                                    updateForm('dataVencimento', '');
                                    updateForm('valor', '');
                                    const charge = findChargeInProgressByContract(form.codigoCliente, numeroContrato, null);
                                    setError(charge
                                        ? `Ja existe uma cobranca em andamento para o contrato ${numeroContrato}: ${charge.protocol} (${charge.status}).`
                                        : '');
                                }}
                                disabled={!rbxClient || Boolean(selected)}
                                helperText={!rbxClient
                                    ? 'Busque o cliente para listar os contratos com boletos'
                                    : `${rbxClient.contratos.length} contrato(s) com boleto em aberto`}
                            >
                                {(rbxClient?.contratos || []).map((contrato) => (
                                    <MenuItem key={contrato.numero} value={contrato.numero}>
                                        Contrato {contrato.numero}{contrato.plano ? ` - ${contrato.plano}` : ''}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Box>
                        {!selected && (
                            <Box sx={{ gridColumn: fieldSpan.third }}>
                                <TextField
                                    select
                                    fullWidth
                                    required
                                    label="Boleto em aberto"
                                    value={form.boletoSelecionado}
                                    onChange={(event) => {
                                        const boletoId = event.target.value;
                                        const boleto = selectedRbxContract?.boletos.find((item) => item.id === boletoId);
                                        setForm((current) => ({
                                            ...current,
                                            boletoSelecionado: boletoId,
                                            dataVencimento: boleto?.vencimento || '',
                                            valor: boleto ? String(boleto.valor) : '',
                                        }));
                                    }}
                                    disabled={!selectedRbxContract}
                                    helperText="Selecione um boleto do contrato"
                                >
                                    {(selectedRbxContract?.boletos || []).map((boleto) => (
                                        <MenuItem key={boleto.id} value={boleto.id}>
                                            {formatDate(boleto.vencimento)} - {formatCurrency(boleto.valor)}
                                            {boleto.documento ? ` - ${boleto.documento}` : ''}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Box>
                        )}
                        <Box sx={{ gridColumn: fieldSpan.third }}>
                            <TextField
                                fullWidth
                                type="date"
                                label="Data registro"
                                value={form.data}
                                onChange={(event) => updateForm('data', event.target.value)}
                                InputLabelProps={{ shrink: true }}
                                disabled={!canEditSelected}
                            />
                        </Box>
                        <Box sx={{ gridColumn: fieldSpan.third }}>
                            <TextField
                                fullWidth
                                required
                                type="date"
                                label="Data de vencimento"
                                value={form.dataVencimento}
                                onChange={(event) => updateForm('dataVencimento', event.target.value)}
                                InputLabelProps={{ shrink: true }}
                                disabled={!canEditSelected}
                                helperText="Preenchimento manual"
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
                                disabled={!canEditOriginalValue}
                                helperText={canEditOriginalValue
                                    ? 'Liberado pelo status selecionado'
                                    : 'Valor original bloqueado; selecione Negociação ou Promessa de pagamento'}
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
                        {isPaidStatus(form.status) && (
                            <Box sx={{ gridColumn: fieldSpan.third }}>
                                <TextField
                                    fullWidth
                                    required
                                    type="number"
                                    label="Valor pago"
                                    value={form.valorPago}
                                    onChange={(event) => updateForm('valorPago', event.target.value)}
                                    inputProps={{ step: '0.01', min: '0.01' }}
                                    disabled={!canSaveSelected}
                                    helperText="Pode ser diferente do valor original"
                                />
                            </Box>
                        )}
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

                    {rbxClient && (
                        <Alert severity={rbxClient.contratos.length ? 'success' : 'warning'} sx={{ mt: 2 }}>
                            {rbxClient.contratos.length
                                ? 'Selecione primeiro o contrato e depois um dos boletos em aberto vinculados a ele.'
                                : 'O cliente nao possui contratos com boletos em aberto no RBX.'}
                        </Alert>
                    )}

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

            <Dialog open={deleteOpen} onClose={closeDeleteDialog} maxWidth="sm" fullWidth>
                <DialogTitle>Excluir cobranca paga</DialogTitle>
                <DialogContent>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Essa acao nao apaga o registro do banco. A cobranca sera marcada como excluida e o motivo ficara salvo no historico.
                    </Typography>
                    {deleteTarget && (
                        <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.5, mb: 2 }}>
                            <Typography fontWeight={800}>{deleteTarget.protocol}</Typography>
                            <Typography variant="body2">{deleteTarget.client || 'Cliente nao informado'}</Typography>
                            <Typography variant="caption" color="text.secondary">
                                Codigo {deleteTarget.clientCode || '-'} - Valor {formatCurrency(deleteTarget.value)}
                            </Typography>
                        </Paper>
                    )}
                    <TextField
                        fullWidth
                        required
                        multiline
                        minRows={4}
                        label="Motivo da exclusao"
                        value={deleteReason}
                        onChange={(event) => setDeleteReason(event.target.value)}
                        helperText="Obrigatorio. Sera salvo com usuario, data e hora."
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={closeDeleteDialog}>Cancelar</Button>
                    <Button color="error" variant="contained" onClick={handleLogicalDelete} disabled={saving || !deleteReason.trim()}>
                        {saving ? 'Excluindo...' : 'Excluir cobranca'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Cobrancas;
