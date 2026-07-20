import AddCircleRoundedIcon from '@mui/icons-material/AddCircleRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import TimelineRoundedIcon from '@mui/icons-material/TimelineRounded';
import { BarChart, PieChart } from '@mui/x-charts';
import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Alert,
    Divider,
    IconButton,
    CircularProgress,
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
    Tabs,
    Tab,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import ChartValueList from '../../Componentes/ChartValueList';
import ExportDashboardPdfButton from '../../Componentes/ExportDashboardPdfButton';
import Api from '../../Services/Api';
import {
    dashboardChartSx,
    dashboardHeaderSx,
    dashboardMetricSx,
    dashboardMutedTextSx,
    dashboardPalette,
    dashboardPanelSx,
    dashboardShellSx,
    dashboardSubtleTextSx,
} from '../../Utils/DashboardTheme';

const UseApi = Api();
const optionsStorageKey = 'sistemaprovedor-noc-options-v1';
const defaultOptions = {
    sources: ['Operadoras e transporte', 'Rompimentos e sinistros', 'Links dedicados'],
    eventTypes: ['ROMPIMENTO', 'ATENUACAO', 'PANE ELETRICA', 'QUEIMA DE EQUIPAMENTO', 'OPERADORA', 'LINK DEDICADO'],
    problemStatuses: ['Aberto', 'Em andamento', 'Pausado', 'Resolvido'],
    slaByEventType: {
        ROMPIMENTO: '24:00',
        ATENUACAO: '48:00',
        'PANE ELETRICA': '8:00',
        'QUEIMA DE EQUIPAMENTO': '24:00',
        OPERADORA: '24:00',
        'LINK DEDICADO': '4:00',
    },
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

const configGridSx = {
    display: 'grid',
    gap: 2,
    gridTemplateColumns: {
        xs: '1fr',
        lg: 'repeat(3, minmax(0, 1fr))',
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
    half: { xs: 'span 1', sm: 'span 1', md: 'span 3' },
    third: { xs: 'span 1', sm: 'span 1', md: 'span 2' },
    full: { xs: 'span 1', sm: 'span 2', md: 'span 6' },
};

const emptyForm = {
    source: 'Rompimentos e sinistros',
    eventType: 'ROMPIMENTO',
    technician: '',
    client: '',
    city: '',
    neighborhood: '',
    start: new Date().toISOString().slice(0, 16),
    end: '',
    problemStatus: 'Aberto',
    notes: '',
};

const emptyUpdateForm = {
    problemStatus: 'Aberto',
    end: '',
    updateNote: '',
};

function readOptions() {
    try {
        const saved = JSON.parse(localStorage.getItem(optionsStorageKey) || '{}');
        const eventTypes = mergeOptions(saved.eventTypes, defaultOptions.eventTypes);
        return {
            sources: mergeOptions(saved.sources, defaultOptions.sources),
            eventTypes,
            problemStatuses: mergeOptions(saved.problemStatuses, defaultOptions.problemStatuses),
            slaByEventType: eventTypes.reduce((acc, item) => ({
                ...acc,
                [item]: normalizeSlaDuration(saved.slaByEventType?.[item] ?? defaultOptions.slaByEventType[item] ?? '24:00'),
            }), {}),
        };
    } catch {
        return defaultOptions;
    }
}

function mergeOptions(saved = [], defaults = []) {
    return Array.from(new Set([...(Array.isArray(saved) ? saved : []), ...defaults].filter(Boolean)));
}

function diffHours(start, end) {
    const startedAt = new Date(start).getTime();
    const endedAt = end ? new Date(end).getTime() : Date.now();
    return Math.max(0, (endedAt - startedAt) / 36e5);
}

function formatHours(hours) {
    if (!Number.isFinite(hours)) return '0h';
    if (hours < 24) return `${hours.toFixed(1).replace('.', ',')}h`;
    return `${(hours / 24).toFixed(1).replace('.', ',')}d`;
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

function chartItemsFromCounts(counts) {
    return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([label, value], index) => ({
            id: label,
            label,
            value,
            color: dashboardPalette[index % dashboardPalette.length],
        }));
}

function numberToSlaDuration(hours) {
    const totalMinutes = Math.max(1, Math.round(Number(hours || 24) * 60));
    return `${Math.floor(totalMinutes / 60)}:${String(totalMinutes % 60).padStart(2, '0')}`;
}

function normalizeSlaDuration(value) {
    if (typeof value === 'number') return numberToSlaDuration(value);

    const raw = String(value ?? '').trim();
    if (!raw) return '24:00';
    if (/^\d+([,.]\d+)?$/.test(raw)) return numberToSlaDuration(Number(raw.replace(',', '.')));

    const [hourPart = '0', minutePart = '0'] = raw.split(':');
    const hours = Math.max(0, Number.parseInt(hourPart, 10) || 0);
    const minutes = Math.min(59, Math.max(0, Number.parseInt(minutePart, 10) || 0));
    return `${hours}:${String(minutes).padStart(2, '0')}`;
}

function parseSlaToHours(value) {
    const [hours, minutes] = normalizeSlaDuration(value).split(':').map(Number);
    return hours + (minutes / 60);
}

function getEventSlaHours(eventType, options) {
    return parseSlaToHours(options.slaByEventType?.[eventType] || '24:00');
}

function normalizeEvent(event) {
    return {
        id: event.id,
        protocol: event.protocolo,
        source: event.origem,
        eventType: event.tipoEvento,
        technician: event.tecnico,
        client: event.cliente,
        city: event.cidade,
        neighborhood: event.bairro,
        start: event.inicio,
        end: event.fim,
        problemStatus: event.statusProblema,
        notes: event.observacoes,
        history: Array.isArray(event.historico)
            ? event.historico.map((item) => ({
                id: item.id,
                previousStatus: item.statusAnterior,
                nextStatus: item.statusNovo,
                previousEnd: item.fimAnterior,
                nextEnd: item.fimNovo,
                notes: item.observacao,
                user: item.usuario,
                createdAt: item.criadoEm,
            }))
            : [],
    };
}

const AcpEventos = ({ readOnly = false }) => {
    const [events, setEvents] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [updateForm, setUpdateForm] = useState(emptyUpdateForm);
    const [open, setOpen] = useState(false);
    const [updateOpen, setUpdateOpen] = useState(false);
    const [tab, setTab] = useState('eventos');
    const [statusFilter, setStatusFilter] = useState('Todos');
    const [options, setOptions] = useState(() => readOptions());
    const [optionDrafts, setOptionDrafts] = useState({});
    const [editingOption, setEditingOption] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadEvents = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await UseApi('noc-eventos');
            setEvents(Array.isArray(response) ? response.map(normalizeEvent) : []);
        } catch (requestError) {
            setError(requestError.message || 'Erro ao carregar eventos.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadEvents();
    }, []);

    const filteredEvents = useMemo(() => {
        return events
            .map((event) => ({
                ...event,
                durationHours: diffHours(event.start, event.end),
                slaHours: getEventSlaHours(event.eventType, options),
            }))
            .filter((event) => statusFilter === 'Todos' || event.problemStatus === statusFilter)
            .sort((a, b) => new Date(b.start) - new Date(a.start));
    }, [events, statusFilter, options]);

    const metrics = useMemo(() => {
        const openEvents = events.filter((event) => !event.end);
        const closed = events.filter((event) => event.end);
        const critical = events.filter((event) => diffHours(event.start, event.end) > getEventSlaHours(event.eventType, options));
        const withinTarget = closed.filter((event) => diffHours(event.start, event.end) <= getEventSlaHours(event.eventType, options));
        return {
            total: events.length,
            open: openEvents.length,
            closed: closed.length,
            critical: critical.length,
            compliance: closed.length ? Math.round((withinTarget.length / closed.length) * 100) : 0,
        };
    }, [events, options]);

    const dashboardData = useMemo(() => {
        const enriched = filteredEvents.map((event) => ({
            ...event,
            slaExpired: event.durationHours > event.slaHours,
        }));
        const slaCounts = {
            'Dentro do SLA': enriched.filter((event) => !event.slaExpired).length,
            'SLA vencido': enriched.filter((event) => event.slaExpired).length,
        };
        const criticalEvents = enriched
            .filter((event) => event.slaExpired && !event.end)
            .sort((a, b) => b.durationHours - a.durationHours)
            .slice(0, 6);

        return {
            statusPie: chartItemsFromCounts(countBy(enriched, (event) => event.problemStatus)),
            slaPie: chartItemsFromCounts(slaCounts),
            typeBars: chartItemsFromCounts(countBy(enriched, (event) => event.eventType)).slice(0, 8),
            sourceBars: chartItemsFromCounts(countBy(enriched, (event) => event.source)).slice(0, 8),
            criticalEvents,
        };
    }, [filteredEvents]);

    const updateCreateForm = (field, value) => setForm((current) => ({ ...current, [field]: value }));
    const updateTrackingForm = (field, value) => setUpdateForm((current) => ({ ...current, [field]: value }));

    const updateOptions = (nextOptions) => {
        setOptions(nextOptions);
        localStorage.setItem(optionsStorageKey, JSON.stringify(nextOptions));
    };

    const addOption = (key) => {
        const value = optionDrafts[key]?.trim();
        if (!value) return;
        const nextOptions = {
            ...options,
            [key]: Array.from(new Set([...(options[key] || []), value])),
        };
        if (key === 'eventTypes') {
            nextOptions.slaByEventType = {
                ...options.slaByEventType,
                [value]: options.slaByEventType?.[value] || '24:00',
            };
        }
        updateOptions(nextOptions);
        setOptionDrafts((current) => ({ ...current, [key]: '' }));
    };

    const removeOption = (key, value) => {
        const nextOptions = {
            ...options,
            [key]: (options[key] || []).filter((item) => item !== value),
        };
        if (key === 'eventTypes') {
            const { [value]: _removed, ...nextSla } = options.slaByEventType || {};
            nextOptions.slaByEventType = nextSla;
        }
        updateOptions(nextOptions);
    };

    const startEditOption = (key, value) => {
        setEditingOption({ key, value, nextValue: value });
    };

    const cancelEditOption = () => setEditingOption(null);

    const saveEditOption = () => {
        if (!editingOption) return;

        const { key, value, nextValue } = editingOption;
        const normalizedValue = nextValue.trim();
        if (!normalizedValue || normalizedValue === value) {
            setEditingOption(null);
            return;
        }

        const nextList = (options[key] || []).map((item) => (item === value ? normalizedValue : item));
        const nextOptions = {
            ...options,
            [key]: Array.from(new Set(nextList)),
        };

        if (key === 'eventTypes') {
            const { [value]: previousSla, ...nextSla } = options.slaByEventType || {};
            nextOptions.slaByEventType = {
                ...nextSla,
                [normalizedValue]: previousSla || '24:00',
            };
        }

        updateOptions(nextOptions);
        setEditingOption(null);
    };

    const updateEventSla = (eventType, value) => {
        updateOptions({
            ...options,
            slaByEventType: {
                ...options.slaByEventType,
                [eventType]: value,
            },
        });
    };

    const normalizeEventSla = (eventType) => {
        updateOptions({
            ...options,
            slaByEventType: {
                ...options.slaByEventType,
                [eventType]: normalizeSlaDuration(options.slaByEventType?.[eventType]),
            },
        });
    };

    const handleSubmit = async () => {
        setError('');
        try {
            const response = await UseApi('noc-eventos', 'POST', {
                origem: form.source,
                tipoEvento: form.eventType,
                tecnico: form.technician,
                cliente: form.client,
                cidade: form.city,
                bairro: form.neighborhood,
                inicio: form.start || null,
                fim: form.end || null,
                statusProblema: form.problemStatus,
                observacoes: form.notes,
            });
            setEvents((current) => [normalizeEvent(response), ...current]);
            setForm({ ...emptyForm, start: new Date().toISOString().slice(0, 16) });
            setOpen(false);
        } catch (requestError) {
            setError(requestError.message || 'Erro ao salvar evento.');
        }
    };

    const openUpdateDialog = (event) => {
        setSelectedEvent(event);
        setUpdateForm({
            problemStatus: event.problemStatus || 'Aberto',
            end: event.end ? event.end.slice(0, 16) : '',
            updateNote: '',
        });
        setUpdateOpen(true);
    };

    const handleUpdate = async () => {
        setError('');
        if (!updateForm.updateNote.trim()) {
            setError('Informe o que foi feito no evento.');
            return;
        }
        try {
            const response = await UseApi(`noc-eventos/${selectedEvent.id}`, 'PUT', {
                statusProblema: updateForm.problemStatus,
                fim: updateForm.end || null,
                observacao: updateForm.updateNote,
            });
            const normalized = normalizeEvent(response);
            setEvents((current) => current.map((event) => (event.id === normalized.id ? normalized : event)));
            setUpdateOpen(false);
            setSelectedEvent(null);
        } catch (requestError) {
            setError(requestError.message || 'Erro ao atualizar evento.');
        }
    };

    const removeEvent = async (id) => {
        setError('');
        try {
            await UseApi(`noc-eventos/${id}`, 'DELETE');
            setEvents((current) => current.filter((event) => event.id !== id));
        } catch (requestError) {
            setError(requestError.message || 'Erro ao excluir evento.');
        }
    };

    return (
        <Box
            id="dashboard-acp-eventos-export"
            sx={{
                py: 2,
                ...(tab === 'eventos' ? dashboardShellSx : {}),
            }}
        >
            <Paper
                variant="outlined"
                sx={{
                    p: tab === 'eventos' ? 1.8 : 2.5,
                    mb: 2,
                    borderRadius: tab === 'eventos' ? 1 : 2,
                    ...(tab === 'eventos' ? dashboardHeaderSx : { bgcolor: 'background.paper' }),
                }}
            >
            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
                <Box>
                    <Typography variant="h5" fontWeight={800}>{readOnly ? 'Acompanhamento ACP Eventos' : 'ACP Eventos'}</Typography>
                    <Typography color={tab === 'eventos' ? '#e8f8ff' : 'text.secondary'}>
                        {readOnly
                            ? 'Acompanhamento dos eventos do NOC em tempo real, sem alteracao de registros.'
                            : 'Registro e acompanhamento de eventos do NOC dentro do sistema principal.'}
                    </Typography>
                </Box>
                <Stack direction={{ xs: 'column', sm: 'row' }} gap={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
                    <ExportDashboardPdfButton
                        targetId="dashboard-acp-eventos-export"
                        title="Dashboard ACP Eventos"
                        fileName="dashboard-acp-eventos"
                    />
                    {!readOnly && <Button variant="contained" startIcon={<AddCircleRoundedIcon />} onClick={() => setOpen(true)}>
                        Novo evento
                    </Button>}
                </Stack>
            </Stack>
            {!readOnly && <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mt: 2 }}>
                <Tab value="eventos" label="Eventos" />
                <Tab value="configuracoes" label="Configuracoes" />
            </Tabs>}
            </Paper>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {tab === 'eventos' && (
            <>
            <Box sx={{ ...pageGridSx, mb: 2 }}>
                {[
                    ['Eventos', metrics.total, 'registros no sistema'],
                    ['Abertos', metrics.open, `${metrics.closed} encerrados`],
                    ['Criticos', metrics.critical, 'acima de 72h'],
                    ['Dentro da meta', `${metrics.compliance}%`, 'SLA por evento'],
                ].map(([label, value, detail]) => (
                    <Paper
                        variant="outlined"
                        sx={{
                            p: 2,
                            ...(tab === 'eventos' ? dashboardMetricSx : { borderRadius: 2 }),
                        }}
                        key={label}
                    >
                        <Stack direction="row" alignItems="center" spacing={1.2}>
                            <TimelineRoundedIcon color="primary" />
                            <Box>
                                <Typography sx={tab === 'eventos' ? dashboardSubtleTextSx : undefined} color={tab === 'eventos' ? undefined : 'text.secondary'} variant="body2" fontWeight={tab === 'eventos' ? 800 : 400}>{label}</Typography>
                                <Typography variant="h5" fontWeight={800}>{value}</Typography>
                                <Typography sx={tab === 'eventos' ? dashboardMutedTextSx : undefined} color={tab === 'eventos' ? undefined : 'text.secondary'} variant="caption">{detail}</Typography>
                            </Box>
                        </Stack>
                    </Paper>
                ))}
            </Box>

            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: '1fr', mb: 2 }}>
                <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' } }}>
                    <Paper variant="outlined" sx={{ ...dashboardPanelSx, p: 2 }}>
                        <Typography variant="h6" fontWeight={800}>Eventos por status</Typography>
                        <Typography sx={{ ...dashboardSubtleTextSx, mb: 1 }} variant="body2">Distribuicao da fila filtrada.</Typography>
                        {dashboardData.statusPie.length ? (
                            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 260px' }, alignItems: 'center' }}>
                                <PieChart
                                    height={260}
                                    series={[{ data: dashboardData.statusPie, innerRadius: 48, paddingAngle: 2 }]}
                                    slotProps={{ legend: { hidden: true } }}
                                    sx={dashboardChartSx}
                                />
                                <ChartValueList items={dashboardData.statusPie} showPercent={false} />
                            </Box>
                        ) : (
                            <Stack alignItems="center" justifyContent="center" minHeight={220}>
                                <Typography sx={dashboardMutedTextSx}>Sem dados para exibir.</Typography>
                            </Stack>
                        )}
                    </Paper>

                    <Paper variant="outlined" sx={{ ...dashboardPanelSx, p: 2 }}>
                        <Typography variant="h6" fontWeight={800}>SLA da fila</Typography>
                        <Typography sx={{ ...dashboardSubtleTextSx, mb: 1 }} variant="body2">Eventos dentro da meta contra eventos vencidos.</Typography>
                        {dashboardData.slaPie.some((item) => item.value > 0) ? (
                            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 260px' }, alignItems: 'center' }}>
                                <PieChart
                                    height={260}
                                    series={[{ data: dashboardData.slaPie, innerRadius: 48, paddingAngle: 2 }]}
                                    slotProps={{ legend: { hidden: true } }}
                                    sx={dashboardChartSx}
                                />
                                <ChartValueList items={dashboardData.slaPie} showPercent={false} />
                            </Box>
                        ) : (
                            <Stack alignItems="center" justifyContent="center" minHeight={220}>
                                <Typography sx={dashboardMutedTextSx}>Sem dados para exibir.</Typography>
                            </Stack>
                        )}
                    </Paper>
                </Box>

                <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' } }}>
                    <Paper variant="outlined" sx={{ ...dashboardPanelSx, p: 2 }}>
                        <Typography variant="h6" fontWeight={800}>Eventos por tipo</Typography>
                        <Typography sx={{ ...dashboardSubtleTextSx, mb: 1 }} variant="body2">Tipos que mais aparecem na fila filtrada.</Typography>
                        {dashboardData.typeBars.length ? (
                            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 240px' }, alignItems: 'center' }}>
                                <BarChart
                                    height={280}
                                    xAxis={[{ scaleType: 'band', data: dashboardData.typeBars.map((item) => item.label) }]}
                                    series={[{ data: dashboardData.typeBars.map((item) => item.value), label: 'Eventos', color: '#0f4c81' }]}
                                    margin={{ left: 35, right: 10, top: 25, bottom: 80 }}
                                    sx={dashboardChartSx}
                                />
                                <ChartValueList items={dashboardData.typeBars} showPercent={false} />
                            </Box>
                        ) : (
                            <Stack alignItems="center" justifyContent="center" minHeight={220}>
                                <Typography sx={dashboardMutedTextSx}>Sem dados para exibir.</Typography>
                            </Stack>
                        )}
                    </Paper>

                    <Paper variant="outlined" sx={{ ...dashboardPanelSx, p: 2 }}>
                        <Typography variant="h6" fontWeight={800}>Eventos por origem</Typography>
                        <Typography sx={{ ...dashboardSubtleTextSx, mb: 1 }} variant="body2">Origem do acionamento dos eventos.</Typography>
                        {dashboardData.sourceBars.length ? (
                            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 240px' }, alignItems: 'center' }}>
                                <BarChart
                                    height={280}
                                    xAxis={[{ scaleType: 'band', data: dashboardData.sourceBars.map((item) => item.label) }]}
                                    series={[{ data: dashboardData.sourceBars.map((item) => item.value), label: 'Eventos', color: '#0f4c81' }]}
                                    margin={{ left: 35, right: 10, top: 25, bottom: 80 }}
                                    sx={dashboardChartSx}
                                />
                                <ChartValueList items={dashboardData.sourceBars} showPercent={false} />
                            </Box>
                        ) : (
                            <Stack alignItems="center" justifyContent="center" minHeight={220}>
                                <Typography sx={dashboardMutedTextSx}>Sem dados para exibir.</Typography>
                            </Stack>
                        )}
                    </Paper>
                </Box>

                <Paper variant="outlined" sx={{ ...dashboardPanelSx, p: 2 }}>
                    <Typography variant="h6" fontWeight={800}>Eventos criticos em aberto</Typography>
                    <Typography sx={{ ...dashboardSubtleTextSx, mb: 1 }} variant="body2">Eventos vencidos por SLA, ordenados pela maior duracao.</Typography>
                    <Stack spacing={1}>
                        {dashboardData.criticalEvents.length ? dashboardData.criticalEvents.map((event) => (
                            <Box
                                key={event.id}
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: { xs: '1fr', md: '160px minmax(0, 1fr) 150px 120px' },
                                    gap: 1,
                                    alignItems: 'center',
                                    border: '1px solid rgba(23, 226, 232, 0.25)',
                                    borderRadius: 1,
                                    p: 1,
                                }}
                            >
                                <Typography fontWeight={800}>{event.protocol}</Typography>
                                <Typography sx={{ overflowWrap: 'anywhere' }}>{event.eventType} - {event.client || event.source || 'Nao informado'}</Typography>
                                <Typography sx={dashboardMutedTextSx}>{formatHours(event.durationHours)} / SLA {formatHours(event.slaHours)}</Typography>
                                <Chip size="small" color="error" label={event.problemStatus} />
                            </Box>
                        )) : (
                            <Typography sx={dashboardMutedTextSx}>Nenhum evento critico em aberto.</Typography>
                        )}
                    </Stack>
                </Paper>
            </Box>

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2} mb={2}>
                    <Box>
                        <Typography variant="h6" fontWeight={800}>Fila operacional</Typography>
                        <Typography color="text.secondary" variant="body2">{filteredEvents.length} eventos encontrados</Typography>
                    </Box>
                    <TextField
                        select
                        size="small"
                        label="Status"
                        value={statusFilter}
                        onChange={(event) => setStatusFilter(event.target.value)}
                        sx={{ minWidth: 220 }}
                    >
                        <MenuItem value="Todos">Todos</MenuItem>
                        {options.problemStatuses.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
                    </TextField>
                </Stack>
                <TableContainer>
                    {loading ? (
                        <Stack alignItems="center" py={5}><CircularProgress /></Stack>
                    ) : (
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Protocolo</TableCell>
                                <TableCell>Tipo</TableCell>
                                <TableCell>Area/cliente</TableCell>
                                <TableCell>Cidade</TableCell>
                                <TableCell>Duracao</TableCell>
                                <TableCell>SLA</TableCell>
                                <TableCell>Status</TableCell>
                                {!readOnly && <TableCell align="right">Acoes</TableCell>}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredEvents.map((event) => (
                                <TableRow key={event.id} hover>
                                    <TableCell>{event.protocol}</TableCell>
                                    <TableCell>{event.eventType}</TableCell>
                                    <TableCell>
                                        <Typography fontWeight={700} fontSize="inherit">{event.client || 'Nao informado'}</Typography>
                                        <Typography color="text.secondary" variant="caption">{event.notes || event.source}</Typography>
                                    </TableCell>
                                    <TableCell>{[event.city, event.neighborhood].filter(Boolean).join(' / ') || 'Nao informado'}</TableCell>
                                    <TableCell>{formatHours(event.durationHours)}</TableCell>
                                    <TableCell>{formatHours(event.slaHours)}</TableCell>
                                    <TableCell>
                                        <Chip
                                            size="small"
                                            color={event.problemStatus === 'Resolvido' ? 'success' : event.durationHours > event.slaHours ? 'error' : 'warning'}
                                            label={event.problemStatus}
                                        />
                                    </TableCell>
                                    {!readOnly && <TableCell align="right">
                                        <IconButton size="small" color="primary" onClick={() => openUpdateDialog(event)}>
                                            <EditRoundedIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton size="small" color="error" onClick={() => removeEvent(event.id)}>
                                            <DeleteRoundedIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>}
                                </TableRow>
                            ))}
                            {!filteredEvents.length && (
                                <TableRow>
                                    <TableCell colSpan={readOnly ? 7 : 8} align="center">Nenhum evento cadastrado.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    )}
                </TableContainer>
            </Paper>
            </>
            )}

            {tab === 'configuracoes' && (
                <Box sx={configGridSx}>
                    {[
                        ['sources', 'Origens', 'Nova origem'],
                        ['problemStatuses', 'Status do problema', 'Novo status'],
                    ].map(([key, title, placeholder]) => (
                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: '100%' }} key={key}>
                            <Typography variant="h6" fontWeight={800}>{title}</Typography>
                            <Typography variant="body2" color="text.secondary" mb={2}>
                                Opcoes usadas nos formularios de eventos.
                            </Typography>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} mb={2}>
                                <TextField
                                    size="small"
                                    fullWidth
                                    placeholder={placeholder}
                                    value={optionDrafts[key] || ''}
                                    onChange={(event) => setOptionDrafts((current) => ({ ...current, [key]: event.target.value }))}
                                />
                                <Button variant="contained" onClick={() => addOption(key)}>Adicionar</Button>
                            </Stack>
                            <Divider sx={{ mb: 1.5 }} />
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Opcao</TableCell>
                                            <TableCell align="right">Acao</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {(options[key] || []).map((item) => (
                                            <TableRow key={item} hover>
                                                <TableCell>
                                                    {editingOption?.key === key && editingOption?.value === item ? (
                                                        <TextField
                                                            size="small"
                                                            fullWidth
                                                            value={editingOption.nextValue}
                                                            onChange={(event) => setEditingOption((current) => ({
                                                                ...current,
                                                                nextValue: event.target.value,
                                                            }))}
                                                            onKeyDown={(event) => {
                                                                if (event.key === 'Enter') saveEditOption();
                                                                if (event.key === 'Escape') cancelEditOption();
                                                            }}
                                                            autoFocus
                                                        />
                                                    ) : item}
                                                </TableCell>
                                                <TableCell align="right">
                                                    {editingOption?.key === key && editingOption?.value === item ? (
                                                        <>
                                                            <IconButton size="small" color="primary" onClick={saveEditOption}>
                                                                <SaveRoundedIcon fontSize="small" />
                                                            </IconButton>
                                                            <IconButton size="small" onClick={cancelEditOption}>
                                                                <CloseRoundedIcon fontSize="small" />
                                                            </IconButton>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <IconButton size="small" color="primary" onClick={() => startEditOption(key, item)}>
                                                                <EditRoundedIcon fontSize="small" />
                                                            </IconButton>
                                                            <IconButton size="small" color="error" onClick={() => removeOption(key, item)}>
                                                                <DeleteRoundedIcon fontSize="small" />
                                                            </IconButton>
                                                        </>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {!(options[key] || []).length && (
                                            <TableRow>
                                                <TableCell colSpan={2} align="center">Nenhuma opcao cadastrada.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    ))}
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: '100%' }}>
                        <Typography variant="h6" fontWeight={800}>Tipos de evento e SLA</Typography>
                        <Typography variant="body2" color="text.secondary" mb={2}>
                            Defina o prazo maximo de atendimento para cada tipo de evento.
                        </Typography>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} mb={2}>
                            <TextField
                                size="small"
                                fullWidth
                                placeholder="Novo tipo"
                                value={optionDrafts.eventTypes || ''}
                                onChange={(event) => setOptionDrafts((current) => ({ ...current, eventTypes: event.target.value.toUpperCase() }))}
                            />
                            <Button variant="contained" onClick={() => addOption('eventTypes')}>Adicionar</Button>
                        </Stack>
                        <Divider sx={{ mb: 1.5 }} />
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Tipo</TableCell>
                                        <TableCell>SLA (h:mm)</TableCell>
                                        <TableCell align="right">Acao</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {options.eventTypes.map((item) => (
                                        <TableRow key={item} hover>
                                            <TableCell>
                                                {editingOption?.key === 'eventTypes' && editingOption?.value === item ? (
                                                    <TextField
                                                        size="small"
                                                        fullWidth
                                                        value={editingOption.nextValue}
                                                        onChange={(event) => setEditingOption((current) => ({
                                                            ...current,
                                                            nextValue: event.target.value.toUpperCase(),
                                                        }))}
                                                        onKeyDown={(event) => {
                                                            if (event.key === 'Enter') saveEditOption();
                                                            if (event.key === 'Escape') cancelEditOption();
                                                        }}
                                                        autoFocus
                                                    />
                                                ) : item}
                                            </TableCell>
                                            <TableCell sx={{ width: 180 }}>
                                                <TextField
                                                    size="small"
                                                    value={options.slaByEventType?.[item] || '24:00'}
                                                    onChange={(event) => updateEventSla(item, event.target.value)}
                                                    onBlur={() => normalizeEventSla(item)}
                                                    placeholder="1:20"
                                                    helperText="Ex.: 1:20"
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                {editingOption?.key === 'eventTypes' && editingOption?.value === item ? (
                                                    <>
                                                        <IconButton size="small" color="primary" onClick={saveEditOption}>
                                                            <SaveRoundedIcon fontSize="small" />
                                                        </IconButton>
                                                        <IconButton size="small" onClick={cancelEditOption}>
                                                            <CloseRoundedIcon fontSize="small" />
                                                        </IconButton>
                                                    </>
                                                ) : (
                                                    <>
                                                        <IconButton size="small" color="primary" onClick={() => startEditOption('eventTypes', item)}>
                                                            <EditRoundedIcon fontSize="small" />
                                                        </IconButton>
                                                        <IconButton size="small" color="error" onClick={() => removeOption('eventTypes', item)}>
                                                            <DeleteRoundedIcon fontSize="small" />
                                                        </IconButton>
                                                    </>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Box>
            )}

            <Dialog
                open={open}
                onClose={() => setOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        width: 'min(920px, calc(100vw - 32px))',
                        maxHeight: 'calc(100vh - 32px)',
                    },
                }}
            >
                <DialogTitle>Novo evento NOC</DialogTitle>
                <DialogContent sx={{ overflowX: 'hidden' }}>
                    <Box sx={{ ...formGridSx, pt: 1 }}>
                        <Box sx={{ gridColumn: fieldSpan.half }}>
                            <TextField select fullWidth label="Origem" value={form.source} onChange={(event) => updateCreateForm('source', event.target.value)}>
                                {options.sources.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                            </TextField>
                        </Box>
                        <Box sx={{ gridColumn: fieldSpan.half }}>
                            <TextField select fullWidth label="Tipo" value={form.eventType} onChange={(event) => updateCreateForm('eventType', event.target.value)}>
                                {options.eventTypes.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                            </TextField>
                        </Box>
                        <Box sx={{ gridColumn: fieldSpan.half }}>
                            <TextField fullWidth label="Tecnico/atendente" value={form.technician} onChange={(event) => updateCreateForm('technician', event.target.value)} />
                        </Box>
                        <Box sx={{ gridColumn: fieldSpan.half }}>
                            <TextField fullWidth label="Cliente/area afetada" value={form.client} onChange={(event) => updateCreateForm('client', event.target.value)} />
                        </Box>
                        <Box sx={{ gridColumn: fieldSpan.half }}>
                            <TextField fullWidth label="Cidade" value={form.city} onChange={(event) => updateCreateForm('city', event.target.value)} />
                        </Box>
                        <Box sx={{ gridColumn: fieldSpan.half }}>
                            <TextField fullWidth label="Bairro" value={form.neighborhood} onChange={(event) => updateCreateForm('neighborhood', event.target.value)} />
                        </Box>
                        <Box sx={{ gridColumn: fieldSpan.third }}>
                            <TextField fullWidth type="datetime-local" label="Inicio" value={form.start} onChange={(event) => updateCreateForm('start', event.target.value)} InputLabelProps={{ shrink: true }} />
                        </Box>
                        <Box sx={{ gridColumn: fieldSpan.third }}>
                            <TextField fullWidth type="datetime-local" label="Final" value={form.end} onChange={(event) => updateCreateForm('end', event.target.value)} InputLabelProps={{ shrink: true }} />
                        </Box>
                        <Box sx={{ gridColumn: fieldSpan.third }}>
                            <TextField select fullWidth label="Status" value={form.problemStatus} onChange={(event) => updateCreateForm('problemStatus', event.target.value)}>
                                {options.problemStatuses.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                            </TextField>
                        </Box>
                        <Box sx={{ gridColumn: fieldSpan.full }}>
                            <TextField fullWidth multiline minRows={3} label="Problema / observacoes" value={form.notes} onChange={(event) => updateCreateForm('notes', event.target.value)} />
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button variant="contained" onClick={handleSubmit}>Salvar evento</Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={updateOpen}
                onClose={() => setUpdateOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        width: 'min(860px, calc(100vw - 32px))',
                        maxHeight: 'calc(100vh - 32px)',
                    },
                }}
            >
                <DialogTitle>Atualizar evento {selectedEvent?.protocol}</DialogTitle>
                <DialogContent sx={{ overflowX: 'hidden' }}>
                    <Box sx={{ ...formGridSx, pt: 1 }}>
                        <Box sx={{ gridColumn: fieldSpan.third }}>
                            <TextField
                                select
                                fullWidth
                                label="Status"
                                value={updateForm.problemStatus}
                                onChange={(event) => updateTrackingForm('problemStatus', event.target.value)}
                            >
                                {options.problemStatuses.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
                            </TextField>
                        </Box>
                        <Box sx={{ gridColumn: fieldSpan.third }}>
                            <TextField
                                fullWidth
                                type="datetime-local"
                                label="Final"
                                value={updateForm.end}
                                onChange={(event) => updateTrackingForm('end', event.target.value)}
                                InputLabelProps={{ shrink: true }}
                                helperText="Preencha quando o evento for encerrado."
                            />
                        </Box>
                        <Box sx={{ gridColumn: fieldSpan.full }}>
                            <TextField
                                fullWidth
                                required
                                multiline
                                minRows={3}
                                label={`O que foi feito (${updateForm.problemStatus})`}
                                value={updateForm.updateNote}
                                onChange={(event) => updateTrackingForm('updateNote', event.target.value)}
                                helperText="Esse texto sera salvo no historico do evento."
                            />
                        </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle1" fontWeight={800}>Historico de atualizacoes</Typography>
                    <Stack spacing={1.2} sx={{ mt: 1.5 }}>
                        {selectedEvent?.history?.length ? selectedEvent.history.map((item) => (
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
                                            Final: {item.nextEnd ? new Date(item.nextEnd).toLocaleString('pt-BR') : '-'}
                                        </Typography>
                                        <Typography color="text.secondary" variant="caption">
                                            {[item.user, item.createdAt ? new Date(item.createdAt).toLocaleString('pt-BR') : null].filter(Boolean).join(' - ')}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Box>
                        )) : (
                            <Typography color="text.secondary" variant="body2">
                                Nenhuma atualizacao registrada.
                            </Typography>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setUpdateOpen(false)}>Cancelar</Button>
                    <Button variant="contained" onClick={handleUpdate} disabled={!updateForm.updateNote.trim()}>
                        Salvar atualizacao
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AcpEventos;
