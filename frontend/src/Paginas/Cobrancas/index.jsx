import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    Paper,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import AddCircleRoundedIcon from '@mui/icons-material/AddCircleRounded';
import Api from '../../Services/Api';
import ExportDashboardPdfButton from '../../Componentes/ExportDashboardPdfButton';
import { useNotification } from '../../Componentes/NotificationProvider';
import {
    dashboardHeaderSx,
    dashboardInputSx,
    dashboardPalette,
    dashboardShellSx,
} from '../../Utils/DashboardTheme';
import {
    allowsOriginalValueChange,
    compactChartEntries,
    countBy,
    currentMonthIso,
    defaultActionOptions,
    defaultStatusOptions,
    emptyForm,
    formatConfiguredOption,
    isClosedStatus,
    isFinalStatus,
    isPaidStatus,
    isPromiseStatus,
    isSameMonth,
    needsSevenDayReminder,
    normalizeCharge,
    normalizeClientCode,
    normalizeLabel,
    normalizeRbxClient,
    sumBy,
    todayIso,
    toForm,
} from './cobrancasUtils';
import CobrancaDeleteDialog from './CobrancaDeleteDialog';
import CobrancaFormDialog from './CobrancaFormDialog';
import CobrancasDashboardCharts from './CobrancasDashboardCharts';
import CobrancasTable from './CobrancasTable';
import FilaInadimplentesTable from './FilaInadimplentesTable';

const UseApi = Api();

const Cobrancas = ({ readOnly = false, mode }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { showSuccess, showError, showWarning } = useNotification();

    const [statusOptions, setStatusOptions] = useState(defaultStatusOptions);
    const [actionOptions, setActionOptions] = useState(defaultActionOptions);
    const viewMode = mode || (readOnly ? 'dashboard' : 'cadastro');
    const isDashboard = viewMode === 'dashboard';
    const isTracking = viewMode === 'acompanhamento';
    const isAutomaticQueue = viewMode === 'automaticas' || location.pathname.includes('/fila-automatica');
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
    const [delinquentPage, setDelinquentPage] = useState(0);
    const [delinquentRowsPerPage, setDelinquentRowsPerPage] = useState(10);
    const [trackingNote, setTrackingNote] = useState('');
    const [open, setOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteReason, setDeleteReason] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [rbxLoading, setRbxLoading] = useState(false);
    const [error, setError] = useState('');

    const loadCharges = useCallback(async () => {
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
            setError(requestError.message || 'Erro ao carregar cobranças.');
        } finally {
            setLoading(false);
        }
    }, [isPaidList, isTracking, isAutomaticQueue, isRegister]);

    useEffect(() => {
        loadCharges();
    }, [loadCharges]);

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
                console.error('Erro ao carregar configurações de cobrança:', requestError);
            }
        };
        loadConfiguredOptions();
    }, []);

    const userOptions = useMemo(() => {
        return Array.from(new Set(charges.map((charge) => normalizeLabel(charge.lastUser)).filter(Boolean))).sort();
    }, [charges]);

    const groupOptions = useMemo(() => {
        return Array.from(new Set(charges.map((charge) => normalizeLabel(charge.clientGroup)).filter(Boolean))).sort();
    }, [charges]);

    const actionFilterOptions = useMemo(() => {
        return Array.from(new Set([...actionOptions, ...charges.map((c) => normalizeLabel(c.action)).filter(Boolean)])).sort();
    }, [actionOptions, charges]);

    const findChargeInProgressByContract = (clientCode, contractNumber, currentChargeId) => {
        const normalizedCode = normalizeClientCode(clientCode);
        const normalizedContract = String(contractNumber || '').trim();
        if (!normalizedCode || !normalizedContract) return null;

        return charges.find((charge) => {
            if (currentChargeId && charge.id === currentChargeId) return false;
            return normalizeClientCode(charge.clientCode) === normalizedCode
                && String(charge.contractNumber || '').trim() === normalizedContract
                && !isFinalStatus(charge.status)
                && !charge.excluded;
        }) || null;
    };

    const filteredCharges = useMemo(() => {
        const term = searchFilter.trim().toLowerCase();
        return charges.filter((charge) => {
            if (isDashboard && dashboardMonth && !isSameMonth(charge.date, dashboardMonth)) return false;
            if (term) {
                const matchesProtocol = String(charge.protocol || '').toLowerCase().includes(term);
                const matchesClient = String(charge.client || '').toLowerCase().includes(term);
                const matchesCode = String(charge.clientCode || '').toLowerCase().includes(term);
                if (!matchesProtocol && !matchesClient && !matchesCode) return false;
            }
            if (statusFilter === 'Em aberto' && isFinalStatus(charge.status)) return false;
            if (statusFilter === 'Finalizadas' && !isFinalStatus(charge.status)) return false;
            if (statusFilter === 'Promessas hoje' && (!isPromiseStatus(charge.status) || charge.promiseDate !== todayIso())) return false;
            if (statusFilter === 'Promessas vencidas' && (!isPromiseStatus(charge.status) || !charge.promiseDate || charge.promiseDate >= todayIso())) return false;
            if (statusFilter === 'Sem atualização há 7 dias' && !needsSevenDayReminder(charge)) return false;
            if (!['Todos', 'Em aberto', 'Finalizadas', 'Promessas hoje', 'Promessas vencidas', 'Sem atualização há 7 dias'].includes(statusFilter)
                && charge.status !== statusFilter) {
                return false;
            }
            if (userFilter !== 'Todos' && normalizeLabel(charge.lastUser) !== userFilter) return false;
            if (actionFilter !== 'Todos' && normalizeLabel(charge.action) !== actionFilter) return false;
            if (groupFilter !== 'Todos' && normalizeLabel(charge.clientGroup) !== groupFilter) return false;
            return true;
        });
    }, [charges, isDashboard, dashboardMonth, searchFilter, statusFilter, userFilter, actionFilter, groupFilter]);

    useEffect(() => {
        setPage(0);
    }, [searchFilter, statusFilter, userFilter, actionFilter, groupFilter, dashboardMonth]);

    useEffect(() => {
        const lastPage = Math.max(0, Math.ceil(filteredCharges.length / rowsPerPage) - 1);
        if (page > lastPage) setPage(lastPage);
    }, [filteredCharges.length, page, rowsPerPage]);

    useEffect(() => {
        const lastPage = Math.max(0, Math.ceil(delinquentQueue.length / delinquentRowsPerPage) - 1);
        if (delinquentPage > lastPage) setDelinquentPage(lastPage);
    }, [delinquentQueue.length, delinquentPage, delinquentRowsPerPage]);

    const paginatedCharges = useMemo(() => {
        const start = page * rowsPerPage;
        return filteredCharges.slice(start, start + rowsPerPage);
    }, [filteredCharges, page, rowsPerPage]);

    const paginatedDelinquentQueue = useMemo(() => {
        const start = delinquentPage * delinquentRowsPerPage;
        return delinquentQueue.slice(start, start + delinquentRowsPerPage);
    }, [delinquentQueue, delinquentPage, delinquentRowsPerPage]);

    const metrics = useMemo(() => {
        const source = isDashboard ? filteredCharges : charges;
        const total = source.length;
        const abertas = source.filter((c) => !isFinalStatus(c.status) && !c.excluded).length;
        const pagas = source.filter((c) => isPaidStatus(c.status) && !c.excluded).length;
        const pagasMes = source.filter((c) => isPaidStatus(c.status) && !c.excluded && isSameMonth(c.date, dashboardMonth)).length;
        const valorAberto = source.filter((c) => !isFinalStatus(c.status) && !c.excluded).reduce((acc, c) => acc + c.value, 0);
        const valorPago = source.filter((c) => isPaidStatus(c.status) && !c.excluded).reduce((acc, c) => acc + (c.paidValue ?? c.value), 0);
        const valorPagoMes = source.filter((c) => isPaidStatus(c.status) && !c.excluded && isSameMonth(c.date, dashboardMonth)).reduce((acc, c) => acc + (c.paidValue ?? c.value), 0);
        const promessasHoje = source.filter((c) => isPromiseStatus(c.status) && !c.excluded && c.promiseDate === todayIso()).length;
        const promessasVencidas = source.filter((c) => isPromiseStatus(c.status) && !c.excluded && c.promiseDate && c.promiseDate < todayIso()).length;
        const valorTotal = source.filter((c) => !c.excluded).reduce((acc, c) => acc + c.value, 0);

        return {
            total,
            abertas,
            pagas,
            pagasMes,
            valorAberto,
            valorPago,
            valorPagoMes,
            promessasHoje,
            promessasVencidas,
            valorTotal,
        };
    }, [charges, filteredCharges, isDashboard, dashboardMonth]);

    const chartData = useMemo(() => {
        const activeCharges = filteredCharges.filter((c) => !c.excluded);
        const statusMap = countBy(activeCharges, (c) => c.status);
        const statusPie = compactChartEntries(Object.entries(statusMap)).map(([label, value], id) => ({
            id,
            label,
            value,
            color: dashboardPalette[id % dashboardPalette.length],
        }));

        const abertasCount = activeCharges.filter((c) => !isFinalStatus(c.status)).length;
        const pagasCount = activeCharges.filter((c) => isPaidStatus(c.status)).length;
        const fechadasCount = activeCharges.filter((c) => isClosedStatus(c.status)).length;
        const auditStatusPie = [
            { id: 0, label: 'Em aberto', value: abertasCount, color: '#f39c12' },
            { id: 1, label: 'Pagas', value: pagasCount, color: '#27ae60' },
            { id: 2, label: 'Fechadas', value: fechadasCount, color: '#7f8c8d' },
        ].filter((item) => item.value > 0);

        const abertasValue = activeCharges.filter((c) => !isFinalStatus(c.status)).reduce((acc, c) => acc + c.value, 0);
        const pagasValue = activeCharges.filter((c) => isPaidStatus(c.status)).reduce((acc, c) => acc + (c.paidValue ?? c.value), 0);
        const auditValuePie = [
            { id: 0, label: 'Valor em aberto', value: abertasValue, color: '#e67e22' },
            { id: 1, label: 'Valor pago', value: pagasValue, color: '#2ecc71' },
        ].filter((item) => item.value > 0);

        const userValueMap = sumBy(activeCharges, (c) => c.lastUser, (c) => c.value);
        const userValuePie = compactChartEntries(Object.entries(userValueMap)).map(([label, value], id) => ({
            id,
            label,
            value,
            color: dashboardPalette[id % dashboardPalette.length],
        }));

        const groupValueMap = sumBy(activeCharges, (c) => c.clientGroup, (c) => c.value);
        const groupValuePie = compactChartEntries(Object.entries(groupValueMap)).map(([label, value], id) => ({
            id,
            label,
            value,
            color: dashboardPalette[id % dashboardPalette.length],
        }));

        const userLabels = Array.from(new Set(activeCharges.map((c) => normalizeLabel(c.lastUser)).filter(Boolean))).sort();
        const topStatuses = Object.keys(statusMap).slice(0, 4);
        const statusByUserSeries = topStatuses.map((status, index) => ({
            data: userLabels.map((user) => activeCharges.filter((c) => normalizeLabel(c.lastUser) === user && c.status === status).length),
            label: status,
            color: dashboardPalette[index % dashboardPalette.length],
            stack: 'total',
        }));
        const statusByUserTotals = userLabels.map((user) => [
            user,
            activeCharges.filter((c) => normalizeLabel(c.lastUser) === user).length,
        ]);

        const individualRows = userLabels.map((user) => {
            const openedCharges = activeCharges.filter((c) => normalizeLabel(c.createdBy || c.lastUser) === user && !isFinalStatus(c.status));
            const paidBySameUser = activeCharges.filter((c) => isPaidStatus(c.status)
                && normalizeLabel(c.createdBy) === user
                && normalizeLabel(c.lastUser) === user);

            return {
                user,
                openedCount: openedCharges.length,
                openedValue: openedCharges.reduce((acc, c) => acc + c.value, 0),
                paidCount: paidBySameUser.length,
                paidValue: paidBySameUser.reduce((acc, c) => acc + (c.paidValue ?? c.value), 0),
            };
        });

        return {
            statusPie,
            auditStatusPie,
            auditValuePie,
            userValuePie,
            groupValuePie,
            userLabels,
            statusByUserSeries,
            statusByUserTotals,
            individualRows,
        };
    }, [filteredCharges]);

    const updateForm = (field, value) => {
        setForm((current) => ({ ...current, [field]: value }));
    };

    const openNewCharge = () => {
        setSelected(null);
        setRbxClient(null);
        setValidatedClientCode('');
        setTrackingNote('');
        setError('');
        setForm(emptyForm);
        setOpen(true);
    };

    const openCharge = async (charge) => {
        setSelected(charge);
        setTrackingNote('');
        setError('');
        setForm(toForm(charge));
        setValidatedClientCode(charge.clientCode || '');
        setOpen(true);

        if (charge.clientCode) {
            setRbxLoading(true);
            try {
                const response = await UseApi(`cobrancas/rbx/clientes/${charge.clientCode}`);
                setRbxClient(normalizeRbxClient(response));
            } catch {
                setRbxClient(null);
            } finally {
                setRbxLoading(false);
            }
        } else {
            setRbxClient(null);
        }
    };

    const searchRbxClient = async (codeOverride) => {
        const explicitCode = typeof codeOverride === 'string' || typeof codeOverride === 'number' ? codeOverride : null;
        const code = normalizeClientCode(explicitCode || form.codigoCliente || selected?.clientCode);
        if (!code) {
            setError('Informe o código do cliente para buscar no RBX.');
            showWarning('Informe o código do cliente para buscar no RBX.');
            return;
        }
        setRbxLoading(true);
        setError('');
        try {
            const response = await UseApi(`cobrancas/rbx/clientes/${code}`);
            const normalizedClient = normalizeRbxClient(response);
            if (!normalizedClient?.nome) {
                throw new Error('Código de cliente não encontrado no RBX.');
            }
            showSuccess(`Cliente ${normalizedClient.nome} localizado no RBX!`);
            setRbxClient(normalizedClient);
            setValidatedClientCode(code);
            if (normalizedClient?.nome || normalizedClient?.grupo) {
                setForm((current) => ({
                    ...current,
                    codigoCliente: code,
                    cliente: normalizedClient?.nome || current.cliente,
                    grupoCliente: normalizedClient?.grupo || current.grupoCliente,
                    numeroContrato: '',
                    boletoSelecionado: '',
                    dataVencimento: '',
                    valor: '',
                }));
            }
        } catch (requestError) {
            const msg = requestError.message || 'Erro ao buscar cliente no RBX.';
            setError(msg);
            showError(msg);
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
            codigoCliente: item.codigoCliente || '',
            cliente: item.cliente || '',
            grupoCliente: item.grupoCliente || '',
            dataVencimento: item.vencimentoMaisAntigo || '',
            valor: item.valorVencido ? String(item.valorVencido) : '',
        });
        setError('');
        setOpen(true);
        if (item.codigoCliente) {
            searchRbxClient(item.codigoCliente);
        }
    };

    const saveCharge = async () => {
        if (!selected && isRegister) {
            if (!validatedClientCode || normalizeClientCode(form.codigoCliente) !== validatedClientCode || !form.cliente) {
                setError('Valide o código do cliente no RBX antes de salvar a cobrança.');
                showWarning('Valide o código do cliente no RBX antes de salvar a cobrança.');
                return;
            }
            if (!form.numeroContrato) {
                setError('Selecione o contrato do cliente.');
                showWarning('Selecione o contrato do cliente.');
                return;
            }
            if (!form.dataVencimento) {
                setError('Informe a data de vencimento.');
                showWarning('Informe a data de vencimento.');
                return;
            }
            const existing = findChargeInProgressByContract(form.codigoCliente, form.numeroContrato, null);
            if (existing) {
                setError(`Já existe uma cobrança em andamento para o contrato ${form.numeroContrato}: ${existing.protocol} (${existing.status}).`);
                showError(`Já existe uma cobrança em andamento para este contrato (${existing.protocol}).`);
                return;
            }
        }

        if (isPromiseStatus(form.status) && !form.dataPromessa) {
            setError('A data da promessa é obrigatória para o status Promessa de pagamento.');
            showWarning('Informe a data da promessa de pagamento.');
            return;
        }

        if (isPaidStatus(form.status) && !form.valorPago) {
            setError('Informe o valor pago.');
            showWarning('Informe o valor pago.');
            return;
        }

        setSaving(true);
        setError('');
        try {
            const payload = {
                acao: form.acao,
                codigoCliente: form.codigoCliente,
                numeroContrato: form.numeroContrato,
                documentoTitulo: form.boletoSelecionado || null,
                cliente: form.cliente,
                grupoCliente: form.grupoCliente,
                data: form.data,
                dataVencimento: form.dataVencimento,
                dataPromessa: form.dataPromessa || null,
                valor: Number(form.valor || 0),
                valorPago: form.valorPago ? Number(form.valorPago) : null,
                status: form.status,
                observacao: form.observacao,
                notaAcompanhamento: isTracking ? trackingNote : null,
            };

            const response = selected
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
            showSuccess(selected ? 'Cobrança atualizada com sucesso!' : 'Cobrança cadastrada com sucesso!');
        } catch (requestError) {
            const msg = requestError.message || 'Erro ao salvar cobrança.';
            setError(msg);
            showError(msg);
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
            setError('Informe o motivo da exclusão.');
            showWarning('Informe o motivo da exclusão.');
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
            showSuccess('Cobrança excluída com sucesso!');
        } catch (requestError) {
            const msg = requestError.message || 'Erro ao excluir cobrança.';
            setError(msg);
            showError(msg);
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
            showSuccess('Atendimento capturado com sucesso!');
            if (isAutomaticQueue) navigate('/financeiro/cobranca/acompanhamento');
        } catch (requestError) {
            const msg = requestError.message || 'Erro ao capturar atendimento.';
            setError(msg);
            showError(msg);
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
        || (!selected && isRegister && (!validatedClientCode || normalizeClientCode(form.codigoCliente) !== validatedClientCode || !form.cliente));

    const pageTitle = isDashboard
        ? 'Dashboard de Cobrança'
        : isTracking
            ? 'Acompanhamento de Cobrança'
            : isAutomaticQueue
                ? 'Fila Automática de Cobrança'
                : isPaidList
                    ? 'Auditoria de Cobranças Pagas'
                    : 'Cadastro de Cobrança';

    const pageSubtitle = isDashboard
        ? 'Acompanhamento executivo de cobranças, promessas e liquidações.'
        : isTracking
            ? 'Histórico operacional e evolução de cada atendimento.'
            : isAutomaticQueue
                ? 'Cobranças geradas pelo sistema aguardando atendimento.'
                : isPaidList
                    ? 'Cobranças que foram baixadas e histórico de exclusões.'
                    : 'Inicie um atendimento a partir da fila ou informe o código do cliente.';

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2.5,
                p: { xs: 1.5, sm: 2.5 },
                ...(isDashboard ? dashboardShellSx : {}),
            }}
        >
            <Paper
                variant="outlined"
                sx={{
                    p: isDashboard ? 1.8 : 2.5,
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 2,
                    borderRadius: isDashboard ? 1 : 2,
                    ...(isDashboard ? dashboardHeaderSx : {}),
                }}
            >
                <Box>
                    <Typography variant="h5" fontWeight={800} color={isDashboard ? '#ffffff' : 'text.primary'}>
                        {pageTitle}
                    </Typography>
                    <Typography color={isDashboard ? '#e8f8ff' : 'text.secondary'}>
                        {pageSubtitle}
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                    {isDashboard && (
                        <TextField
                            size="small"
                            type="month"
                            label="Mês de referência"
                            value={dashboardMonth}
                            onChange={(event) => setDashboardMonth(event.target.value)}
                            InputLabelProps={{ shrink: true }}
                            sx={dashboardInputSx}
                        />
                    )}
                    {isDashboard && (
                        <ExportDashboardPdfButton
                            title="Dashboard de Cobrança"
                            subtitle={`Mês de referência: ${dashboardMonth}`}
                        />
                    )}
                    {isRegister && (
                        <Button
                            variant="contained"
                            startIcon={<AddCircleRoundedIcon />}
                            onClick={openNewCharge}
                            sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
                        >
                            Nova cobrança
                        </Button>
                    )}
                </Stack>
            </Paper>

            {isRegister && (
                <FilaInadimplentesTable
                    delinquentQueue={delinquentQueue}
                    paginatedDelinquentQueue={paginatedDelinquentQueue}
                    delinquentPage={delinquentPage}
                    setDelinquentPage={setDelinquentPage}
                    delinquentRowsPerPage={delinquentRowsPerPage}
                    setDelinquentRowsPerPage={setDelinquentRowsPerPage}
                    onAttend={openFromDelinquentQueue}
                />
            )}

            {isDashboard && (
                <CobrancasDashboardCharts
                    metrics={metrics}
                    chartData={chartData}
                    userFilter={userFilter}
                />
            )}

            <CobrancasTable
                isDashboard={isDashboard}
                isPaidList={isPaidList}
                isAutomaticQueue={isAutomaticQueue}
                isTracking={isTracking}
                isRegister={isRegister}
                filteredCharges={filteredCharges}
                paginatedCharges={paginatedCharges}
                page={page}
                setPage={setPage}
                rowsPerPage={rowsPerPage}
                setRowsPerPage={setRowsPerPage}
                loading={loading}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                searchFilter={searchFilter}
                setSearchFilter={setSearchFilter}
                userFilter={userFilter}
                setUserFilter={setUserFilter}
                actionFilter={actionFilter}
                setActionFilter={setActionFilter}
                groupFilter={groupFilter}
                setGroupFilter={setGroupFilter}
                statusOptions={statusOptions}
                actionFilterOptions={actionFilterOptions}
                userOptions={userOptions}
                groupOptions={groupOptions}
                onSelectCharge={openCharge}
                onOpenDeleteDialog={openDeleteDialog}
                onCaptureCharge={captureCharge}
                saving={saving}
            />

            <CobrancaFormDialog
                open={open}
                onClose={() => setOpen(false)}
                selected={selected}
                form={form}
                updateForm={updateForm}
                setForm={setForm}
                actionOptions={actionOptions}
                statusOptions={statusOptions}
                canEditSelected={canEditSelected}
                canTrackSelected={canTrackSelected}
                canSaveSelected={canSaveSelected}
                canEditOriginalValue={canEditOriginalValue}
                trackingNote={trackingNote}
                setTrackingNote={setTrackingNote}
                saveDisabled={saveDisabled}
                saving={saving}
                onSubmit={saveCharge}
                rbxClient={rbxClient}
                setRbxClient={setRbxClient}
                searchRbxClient={searchRbxClient}
                rbxLoading={rbxLoading}
                validatedClientCode={validatedClientCode}
                setValidatedClientCode={setValidatedClientCode}
                isTracking={isTracking}
                isRegister={isRegister}
                selectedRbxContract={selectedRbxContract}
                findChargeInProgressByContract={findChargeInProgressByContract}
                error={error}
                setError={setError}
            />

            <CobrancaDeleteDialog
                open={deleteOpen}
                onClose={closeDeleteDialog}
                deleteTarget={deleteTarget}
                deleteReason={deleteReason}
                setDeleteReason={setDeleteReason}
                onConfirm={handleLogicalDelete}
                saving={saving}
                error={error}
            />
        </Box>
    );
};

export default Cobrancas;
