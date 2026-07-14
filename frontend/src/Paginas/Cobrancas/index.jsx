import AddCircleRoundedIcon from '@mui/icons-material/AddCircleRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import TimelineRoundedIcon from '@mui/icons-material/TimelineRounded';
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

const emptyForm = {
    acao: 'Contato',
    codigoCliente: '',
    cliente: '',
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
        date: charge.data,
        promiseDate: charge.dataPromessa,
        value: Number(charge.valor || 0),
        status: charge.status || 'Aberto',
        notes: charge.observacao,
        createdAt: charge.criadoEm,
        updatedAt: charge.atualizadoEm,
        closedAt: charge.fechadoEm,
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

function isPromiseStatus(status) {
    return String(status || '').trim().toUpperCase() === 'PROMESSA DE PAGAMENTO';
}

function todayIso() {
    return new Date().toISOString().slice(0, 10);
}

function readClientField(cliente, lowerKey, upperKey) {
    return cliente?.[lowerKey] ?? cliente?.[upperKey] ?? '';
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

const ClienteRbxPanel = ({ cliente }) => {
    if (!cliente) return null;

    return (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mt: 2 }}>
            <Typography variant="subtitle1" fontWeight={800}>Dados do cliente RBX</Typography>
            <Box
                sx={{
                    display: 'grid',
                    gap: 1,
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(5, minmax(0, 1fr))' },
                    mt: 1,
                }}
            >
                {[
                    ['Codigo', cliente.codigo],
                    ['Nome', cliente.nome],
                    ['CPF/CNPJ', cliente.cpfCnpj],
                    ['Sigla', cliente.sigla],
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
    const [statusFilter, setStatusFilter] = useState(isTracking ? 'Em aberto' : 'Todos');
    const [searchFilter, setSearchFilter] = useState('');
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

    const metrics = useMemo(() => {
        const abertas = charges.filter((charge) => !isFinalStatus(charge.status));
        const pagas = charges.filter((charge) => String(charge.status || '').toUpperCase() === 'PAGO');
        const promessasHoje = charges.filter((charge) => isPromiseStatus(charge.status) && charge.promiseDate === todayIso());
        const promessasVencidas = charges.filter((charge) => isPromiseStatus(charge.status) && charge.promiseDate && charge.promiseDate < todayIso());
        const valorAberto = abertas.reduce((total, charge) => total + charge.value, 0);
        const valorPago = pagas.reduce((total, charge) => total + charge.value, 0);

        return {
            total: charges.length,
            abertas: abertas.length,
            pagas: pagas.length,
            promessasHoje: promessasHoje.length,
            promessasVencidas: promessasVencidas.length,
            valorAberto,
            valorPago,
        };
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
            .filter((charge) => {
                if (!search) return true;
                return [
                    charge.protocol,
                    charge.client,
                    charge.clientCode,
                    charge.action,
                    charge.status,
                ].some((value) => String(value || '').toLowerCase().includes(search));
            })
            .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    }, [charges, statusFilter, searchFilter]);

    const updateForm = (field, value) => setForm((current) => ({ ...current, [field]: value }));

    const openNew = () => {
        setSelected(null);
        setRbxClient(null);
        setTrackingNote('');
        setForm({ ...emptyForm, data: new Date().toISOString().slice(0, 10) });
        setOpen(true);
    };

    const openCharge = (charge) => {
        setSelected(charge);
        setRbxClient(null);
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
        setRbxLoading(true);
        setError('');
        try {
            const response = await UseApi(`cobrancas/rbx/clientes/${code}`);
            const normalizedClient = normalizeRbxClient(response);
            setRbxClient(normalizedClient);
            if (isRegister && normalizedClient?.nome) {
                setForm((current) => ({ ...current, cliente: normalizedClient.nome }));
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
            const payload = {
                acao: form.acao,
                codigoCliente: form.codigoCliente ? Number(form.codigoCliente) : null,
                cliente: form.cliente,
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
        <Box sx={{ py: 2 }}>
            <Paper variant="outlined" sx={{ p: 2.5, mb: 2, borderRadius: 2 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
                    <Box>
                        <Typography variant="h5" fontWeight={800}>
                            {pageTitle}
                        </Typography>
                        <Typography color="text.secondary">{pageSubtitle}</Typography>
                    </Box>
                    {isRegister && (
                        <Button variant="contained" startIcon={<AddCircleRoundedIcon />} onClick={openNew}>
                            Nova cobranca
                        </Button>
                    )}
                </Stack>
            </Paper>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
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
                    ['Promessas hoje', metrics.promessasHoje, `${metrics.promessasVencidas} vencidas`],
                    ['Pagas', metrics.pagas, formatCurrency(metrics.valorPago)],
                ].map(([label, value, detail]) => (
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }} key={label}>
                        <Stack direction="row" alignItems="center" spacing={1.2}>
                            <TimelineRoundedIcon color="primary" />
                            <Box>
                                <Typography color="text.secondary" variant="body2">{label}</Typography>
                                <Typography variant="h5" fontWeight={800}>{value}</Typography>
                                <Typography color="text.secondary" variant="caption">{detail}</Typography>
                            </Box>
                        </Stack>
                    </Paper>
                ))}
            </Box>

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
                                    <TableCell>Acao</TableCell>
                                    <TableCell>Data</TableCell>
                                    <TableCell>Valor</TableCell>
                                    <TableCell>Status</TableCell>
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
                                        <TableCell align="right">
                                            <IconButton size="small" onClick={() => openCharge(charge)}>
                                                {isDashboard || !charge.editable ? <InfoOutlinedIcon fontSize="small" /> : <EditRoundedIcon fontSize="small" />}
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {!filteredCharges.length && (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center">Nenhuma cobranca cadastrada.</TableCell>
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
                                    setRbxClient(null);
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
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Atualizado em</Typography>
                                    <Typography fontWeight={700}>
                                        {selected.updatedAt ? new Date(selected.updatedAt).toLocaleString('pt-BR') : '-'}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Fechado em</Typography>
                                    <Typography fontWeight={700}>
                                        {selected.closedAt ? new Date(selected.closedAt).toLocaleString('pt-BR') : '-'}
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
