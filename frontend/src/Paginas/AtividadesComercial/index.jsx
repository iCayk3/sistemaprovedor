import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, Fab, FormControl, IconButton, InputAdornment, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material"
import FieldAutoComplet from "../../Componentes/FieldAutoComplet"
import TextoInput from "../../Componentes/TextoInput"
import { useCallback, useEffect, useMemo, useState } from "react";
import Api from "../../Services/Api";
import AddIcon from "@mui/icons-material/Add";
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ClearIcon from '@mui/icons-material/Clear';
import BasicDatePicker from "../../Componentes/BasicDatePicker";
import dayjs from "dayjs";
import TabelaExibicao from "../../Componentes/TabelaExibicao";
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { GridActionsCellItem } from "@mui/x-data-grid";

const UseApi = Api()

const today = new Date().toISOString().slice(0, 10);

const emptyActivity = () => ({
    id: null,
    nome: '',
    evento: '',
    eventoInput: '',
    data: today,
    valor: '',
    codigoCliente: '',
    grupoCliente: '',
    plano: '',
    valorPlano: '',
    clienteBuscado: false,
    clienteErro: '',
    clienteLoading: false,
});

function formatCurrency(value) {
    if (value === null || value === undefined || value === '') return '';
    return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function normalizeFilterValue(value, fallback = 'Nao informado') {
    return String(value || fallback).trim() || fallback;
}

const segmentConfig = {
    ATIVIDADE: {
        title: 'Registrar atividade',
        subtitle: 'Atividades',
        eventLabel: 'Evento',
        targetLabel: 'Cliente',
        endpoint: 'evento?segmento=ATIVIDADE',
        action: 'Registrar atividade',
    },
    LEAD: {
        title: 'Cadastro de lead',
        subtitle: 'Leads',
        eventLabel: 'Origem / etapa',
        targetLabel: 'Lead / contato',
        endpoint: 'evento?segmento=LEAD',
        action: 'Cadastrar lead',
    },
    COBRANCA: {
        title: 'Cadastro de cobranca',
        subtitle: 'Cobrancas',
        eventLabel: 'Acao de cobranca',
        targetLabel: 'Cliente / contrato',
        endpoint: 'evento?segmento=COBRANCA',
        action: 'Registrar cobranca',
        showValue: true,
    },
};

const AtividadesComercial = ({ segmento = 'ATIVIDADE', mode = 'cadastro' }) => {
    const config = segmentConfig[segmento] || segmentConfig.ATIVIDADE;
    const [atividades, setAtividades] = useState([]);
    const [data, setData] = useState([]);
    const [refreshTable, setRefreshTable] = useState(true);
    const [conversionLead, setConversionLead] = useState(null);
    const [conversionCode, setConversionCode] = useState('');
    const [conversionError, setConversionError] = useState('');
    const [conversionContracts, setConversionContracts] = useState([]);
    const [conversionContract, setConversionContract] = useState('');
    const [conversionLoading, setConversionLoading] = useState(false);
    const [notCompletedLead, setNotCompletedLead] = useState(null);
    const [notCompletedReason, setNotCompletedReason] = useState('');
    const [notCompletedNote, setNotCompletedNote] = useState('');
    const [notCompletedError, setNotCompletedError] = useState('');
    const [leadAlerts, setLeadAlerts] = useState([]);
    const [formError, setFormError] = useState('');
    const [leadSearch, setLeadSearch] = useState('');
    const [leadStatusFilter, setLeadStatusFilter] = useState('Todos');
    const [leadEventFilter, setLeadEventFilter] = useState('Todos');
    const [leadUserFilter, setLeadUserFilter] = useState('Todos');
    const [leadGroupFilter, setLeadGroupFilter] = useState('Todos');
    const [trackingMonth, setTrackingMonth] = useState(today.slice(0, 7));
    const [trackingMonths, setTrackingMonths] = useState([]);
    const [trackingMonthReady, setTrackingMonthReady] = useState(false);
    const isTracking = mode === 'acompanhamento';
    const isActivity = segmento === 'ATIVIDADE';
    const showLeadFilters = isTracking && segmento === 'LEAD';

    useEffect(() => {
        setAtividades([emptyActivity()]);
        setFormError('');
    }, [segmento]);

    const adicionarAtividade = () => {
        setAtividades([...atividades, emptyActivity()]);
    };

    const removerAtividade = (index) => {
        setAtividades(atividades.filter((_, i) => i !== index));
    };

    const atualizarCampo = (index, campo, valor) => {
        const novas = [...atividades];
        novas[index][campo] = valor;
        setAtividades(novas);
    };

    const atualizarAtividade = (index, campos) => {
        setAtividades((atuais) => atuais.map((item, itemIndex) => (
            itemIndex === index ? { ...item, ...campos } : item
        )));
    };

    const buscarClienteAtividade = async (index) => {
        const codigo = atividades[index]?.codigoCliente;
        if (!codigo) {
            atualizarAtividade(index, { clienteErro: 'Informe o codigo do cliente.' });
            return;
        }

        atualizarAtividade(index, { clienteLoading: true, clienteErro: '', clienteBuscado: false });
        try {
            const response = await UseApi(`atividades/rbx/clientes/${codigo}`);
            atualizarAtividade(index, {
                nome: response.cliente || '',
                grupoCliente: response.grupoCliente || '',
                plano: response.plano || '',
                valorPlano: response.valorPlano ?? '',
                valor: response.valorPlano ?? '',
                clienteBuscado: true,
                clienteErro: '',
            });
        } catch (error) {
            atualizarAtividade(index, {
                nome: '',
                grupoCliente: '',
                plano: '',
                valorPlano: '',
                valor: '',
                clienteBuscado: false,
                clienteErro: error.message || 'Nao foi possivel buscar o cliente no RBX.',
            });
        } finally {
            atualizarAtividade(index, { clienteLoading: false });
        }
    };

    const enviarDados = async () => {
        setFormError('');

        if (isActivity && atividades.some((item) => !item.clienteBuscado || !item.nome || !item.codigoCliente)) {
            setFormError('Busque e valide o codigo do cliente no RBX antes de registrar a atividade.');
            return;
        }

        const payload = atividades.map(({ nome, evento, data, valor, codigoCliente, grupoCliente, plano, valorPlano }) => ({
            cliente: nome,
            evento: evento.label,
            data,
            segmento,
            valor: (segmento === 'COBRANCA' || segmento === 'ATIVIDADE') && valor !== '' ? Number(String(valor).replace(',', '.')) : null,
            status: segmento === 'LEAD' ? 'ABERTO' : null,
            codigoCliente: codigoCliente ? Number(codigoCliente) : null,
            grupoCliente: grupoCliente || null,
            plano: plano || null,
            valorPlano: valorPlano !== '' ? Number(String(valorPlano).replace(',', '.')) : null,
        }));

        try {
            await UseApi(`atividades`, 'POST', payload);
            handleFormSubmit();
            setAtividades([emptyActivity()])
        } catch (err) {
            console.error("Erro :" + err)
            setFormError(err.message || 'Erro ao registrar atividade.');
        }

    };
    useEffect(() => {
        if (!isTracking || segmento !== 'LEAD') {
            setTrackingMonthReady(true);
            return;
        }

        const fetchTrackingMonths = async () => {
            try {
                const response = await UseApi('atividades/leads/pendentes/competencias');
                const months = Array.isArray(response) ? response : [];
                setTrackingMonths(months);
                if (months.length > 0) {
                    setTrackingMonth((current) => months.includes(current) ? current : months[0]);
                }
            } catch (error) {
                console.error('Erro ao buscar competencias com leads pendentes:', error);
            } finally {
                setTrackingMonthReady(true);
            }
        };

        fetchTrackingMonths();
    }, [isTracking, segmento]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const endpoint = isTracking && segmento === 'LEAD'
                    ? `atividades/leads/pendentes?data=${trackingMonth}-01`
                    : `atividades/registro/mensal?segmento=${segmento}`;
                const response = await UseApi(endpoint);
                setData(response);
                if (segmento === 'LEAD') {
                    setLeadAlerts(await UseApi('atividades/alertas'));
                }
            } catch (error) {
                console.error('Erro ao buscar dados:', error);
            } finally {
                setRefreshTable(false);
            }
        };

        if (refreshTable && trackingMonthReady) fetchData();
    }, [isTracking, refreshTable, segmento, trackingMonth, trackingMonthReady]);

    const handleFormSubmit = () => {
        setRefreshTable(true);
    };

    const leadFilterOptions = useMemo(() => {
        const unique = (selector) => Array.from(new Set(data.map(selector).map(normalizeFilterValue))).sort();
        return {
            status: unique((item) => item.status || 'ABERTO'),
            eventos: unique((item) => item.evento),
            usuarios: unique((item) => item.convertidoPor || item.usuario),
            grupos: unique((item) => item.grupoCliente),
        };
    }, [data]);

    const filteredData = useMemo(() => {
        if (!showLeadFilters) {
            return data;
        }

        const search = leadSearch.trim().toLowerCase();
        return data.filter((item) => {
            const status = normalizeFilterValue(item.status || 'ABERTO');
            const evento = normalizeFilterValue(item.evento);
            const usuario = normalizeFilterValue(item.convertidoPor || item.usuario);
            const grupo = normalizeFilterValue(item.grupoCliente);

            if (leadStatusFilter !== 'Todos' && status !== leadStatusFilter) return false;
            if (leadEventFilter !== 'Todos' && evento !== leadEventFilter) return false;
            if (leadUserFilter !== 'Todos' && usuario !== leadUserFilter) return false;
            if (leadGroupFilter !== 'Todos' && grupo !== leadGroupFilter) return false;

            if (!search) return true;
            return [
                item.cliente,
                item.evento,
                item.status,
                item.codigoCliente,
                item.grupoCliente,
                item.plano,
                item.usuario,
                item.convertidoPor,
            ].some((value) => String(value || '').toLowerCase().includes(search));
        });
    }, [data, leadEventFilter, leadGroupFilter, leadSearch, leadStatusFilter, leadUserFilter, showLeadFilters]);

    function DeletarRegistro({ deleteUser, ...props }) {
        const [open, setOpen] = useState(false);

        return (
            <>
                <GridActionsCellItem {...props} onClick={() => setOpen(true)} />
                <Dialog
                    open={open}
                    onClose={() => setOpen(false)}
                >
                    <DialogTitle>Deletar esse registro?</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Está prestes a excluir um registro de atividade. Deseja continuar?
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpen(false)}>Cancelar</Button>
                        <Button
                            onClick={() => {
                                setOpen(false);
                                deleteUser();
                            }}
                            color="warning"
                            autoFocus
                        >
                            Deletar
                        </Button>
                    </DialogActions>
                </Dialog>
            </>
        );
    }

    const deleteRegistro = useCallback(
        (id) => async () => {

            const form = {id : id}

            try {
                console.log(form)
                await UseApi(`atividades`, 'DELETE', form);
                handleFormSubmit(); // Atualiza tabela
            } catch (error) {
                console.error("Erro ao excluir registro:", error);
            }
        },
        []
    );

    const abrirConversao = (lead) => {
        setConversionLead(lead);
        setConversionCode(lead.codigoCliente || '');
        setConversionError('');
        setConversionContracts([]);
        setConversionContract('');
    };

    const buscarContratosConversao = async () => {
        if (!conversionCode) {
            setConversionError('Informe o codigo do cliente.');
            return;
        }
        setConversionLoading(true);
        setConversionError('');
        setConversionContracts([]);
        setConversionContract('');
        try {
            const response = await UseApi(`atividades/rbx/clientes/${Number(conversionCode)}/contratos`);
            const contracts = Array.isArray(response) ? response : [];
            setConversionContracts(contracts);
            if (contracts.length === 1) setConversionContract(contracts[0].numero);
        } catch (error) {
            setConversionError(error.message || 'Erro ao buscar contratos do cliente.');
        } finally {
            setConversionLoading(false);
        }
    };

    const converterLead = async () => {
        if (!conversionLead || !conversionCode || !conversionContract) {
            setConversionError('Busque o cliente e selecione o contrato que sera convertido.');
            return;
        }

        try {
            await UseApi(`atividades/${conversionLead.id}/converter-lead`, 'PATCH', {
                codigoCliente: Number(conversionCode),
                numeroContrato: conversionContract,
            });
            setConversionLead(null);
            setConversionCode('');
            setConversionContracts([]);
            setConversionContract('');
            handleFormSubmit();
        } catch (error) {
            setConversionError(error.message || 'Erro ao converter lead.');
        }
    };

    const registrarNaoConclusao = async () => {
        if (!notCompletedReason) {
            setNotCompletedError('Selecione o motivo da nao conclusao.');
            return;
        }
        if (notCompletedReason === 'OUTRO' && !notCompletedNote.trim()) {
            setNotCompletedError('Descreva o motivo da nao conclusao.');
            return;
        }
        try {
            await UseApi(`atividades/${notCompletedLead.id}/venda-nao-concluida`, 'PATCH', {
                motivo: notCompletedReason,
                observacao: notCompletedNote,
            });
            setNotCompletedLead(null);
            setNotCompletedReason('');
            setNotCompletedNote('');
            setNotCompletedError('');
            handleFormSubmit();
        } catch (error) {
            setNotCompletedError(error.message || 'Erro ao registrar a venda nao concluida.');
        }
    };

    const statusPresentation = {
        ABERTO: { label: 'Lead aberto', color: 'warning' },
        AGUARDANDO_INSTALACAO: { label: 'Aguardando instalacao', color: 'info' },
        CONVERTIDO: { label: 'Cliente ativo', color: 'success' },
    };

    const colunas = [
        {
            field: 'options',
            width: 10,
            type: 'actions',
            getActions: (params) => {
                const canConvertLead = segmento === 'LEAD' && (!params.row.status || params.row.status === 'ABERTO');
                const canMarkNotCompleted = segmento === 'LEAD'
                    && Boolean(params.row.codigoCliente)
                    && ['AGUARDANDO_INSTALACAO', 'CONVERTIDO'].includes(params.row.status);
                const actions = [];

                if (canConvertLead) {
                    actions.push(
                        <GridActionsCellItem
                            label="Converter em venda"
                            showInMenu
                            icon={<CheckCircleIcon />}
                            onClick={() => abrirConversao(params.row)}
                        />
                    );
                }

                if (canMarkNotCompleted) {
                    actions.push(
                        <GridActionsCellItem
                            label="Venda nao concluida"
                            showInMenu
                            icon={<WarningAmberRoundedIcon />}
                            onClick={() => {
                                setNotCompletedLead(params.row);
                                setNotCompletedReason('');
                                setNotCompletedNote('');
                                setNotCompletedError('');
                            }}
                        />
                    );
                }

                if (isTracking) {
                    return actions;
                }

                actions.push(
                    <DeletarRegistro
                        label="Delete"
                        showInMenu
                        icon={<DeleteIcon />}
                        deleteUser={deleteRegistro(params.id)}
                        closeMenuOnClick={false}
                    />
                );

                return actions;
            }
        },
        { field: 'cliente', headerName: config.targetLabel, width: 500 },
        { field: 'evento', headerName: config.eventLabel, width: 250 },
        ...(segmento === 'ATIVIDADE' ? [
            { field: 'codigoCliente', headerName: 'Codigo cliente', width: 130 },
            { field: 'grupoCliente', headerName: 'Grupo', width: 140 },
            { field: 'plano', headerName: 'Plano', width: 180 },
            {
                field: 'valorPlano',
                headerName: 'Valor plano',
                width: 140,
                valueFormatter: formatCurrency,
            },
        ] : []),
        ...(segmento === 'LEAD' ? [
            {
                field: 'status',
                headerName: 'Status',
                width: 140,
                renderCell: (params) => {
                    const isAttention = params.row.requerAtencao;
                    const colorKey = statusPresentation[params.value]?.color;
                    const color = isAttention
                        ? 'error.main'
                        : colorKey === 'success'
                        ? 'success.main'
                        : colorKey === 'warning'
                        ? 'warning.main'
                        : colorKey === 'error'
                        ? 'error.main'
                        : 'text.primary';
                    return (
                        <Typography variant="body2" fontWeight={700} sx={{ color }}>
                            {isAttention ? 'Revisar situacao' : (statusPresentation[params.value]?.label || params.value || 'Lead aberto')}
                        </Typography>
                    );
                },
            },
            { field: 'codigoCliente', headerName: 'Codigo cliente', width: 130 },
            { field: 'numeroContratoRbx', headerName: 'Contrato RBX', width: 140 },
            { field: 'grupoCliente', headerName: 'Grupo', width: 130 },
            { field: 'plano', headerName: 'Plano', width: 180 },
            {
                field: 'valorPlano',
                headerName: 'Valor plano',
                width: 140,
                valueFormatter: formatCurrency,
            },
            { field: 'convertidoPor', headerName: 'Convertido por', width: 160 },
        ] : []),
        ...(config.showValue ? [{
            field: 'valor',
            headerName: 'Valor',
            width: 140,
            valueFormatter: formatCurrency,
        }] : []),
        { field: 'usuario', headerName: 'Usuario', width: 200 },
        {
            field: 'data',
            headerName: 'Data',
            width: 120,
            valueFormatter: (params) => {
                const raw = params;
                if (!raw) return '';
                const data = new Date(`${raw}T00:00:00`);
                return data.toLocaleDateString('pt-BR');
            }

        },
    ];

    return (
        <>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
            <FormControl sx={{ width: '100%', display: 'flex', gap: 2 }}>
                <Box>
                    <Typography variant="h4" fontWeight={800}>{isTracking ? 'Acompanhamento mensal de leads' : config.title}</Typography>
                    <Typography color="text.secondary">
                        {isTracking ? 'Leads cadastrados na competencia selecionada que ainda aguardam conversao.' : `${config.subtitle} do comercial no sistema principal.`}
                    </Typography>
                </Box>

                {formError && <Alert severity="error">{formError}</Alert>}

                {!isTracking && atividades.map((item, index) => (
                    <Stack key={index} direction={{ xs: 'column', md: 'row' }} gap={2} alignItems={{ xs: 'stretch', md: 'flex-start' }} flexWrap="wrap">
                        <IconButton color="error" onClick={() => removerAtividade(index)} sx={{ mt: { md: 1 } }}>
                            <ClearIcon />
                        </IconButton>

                        <Box sx={{ flex: 1 }}>
                            <FieldAutoComplet
                                endpoint={config.endpoint}
                                obrigatorio
                                label={config.eventLabel}
                                aoAlterado={(valor) => atualizarCampo(index, 'evento', valor)}
                                onInputValueChange={(valor) => atualizarCampo(index, 'eventoInput', valor)}
                                valor={item.evento}
                                inputValue={item.eventoInput}
                                sx={{ width: '100%' }}
                            />
                        </Box>

                        {isActivity ? (
                            <>
                                <Box sx={{ flex: 1, minWidth: 220 }}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Codigo do cliente"
                                        value={item.codigoCliente}
                                        onChange={(event) => atualizarAtividade(index, {
                                            codigoCliente: event.target.value,
                                            nome: '',
                                            grupoCliente: '',
                                            plano: '',
                                            valorPlano: '',
                                            valor: '',
                                            clienteBuscado: false,
                                            clienteErro: '',
                                        })}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter') {
                                                event.preventDefault();
                                                buscarClienteAtividade(index);
                                            }
                                        }}
                                        error={Boolean(item.clienteErro)}
                                        helperText={item.clienteErro || 'Busque no RBX para preencher os dados.'}
                                        FormHelperTextProps={{ sx: { minHeight: 40, mx: 0, mt: 0.75 } }}
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        edge="end"
                                                        onClick={() => buscarClienteAtividade(index)}
                                                        disabled={item.clienteLoading}
                                                    >
                                                        {item.clienteLoading ? <CircularProgress size={20} /> : <SearchRoundedIcon />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Box>
                                <Box sx={{ flex: 1.4, minWidth: 260 }}>
                                    <TextField fullWidth disabled label={config.targetLabel} value={item.nome} />
                                </Box>
                                <Box sx={{ flex: 1, minWidth: 160 }}>
                                    <TextField fullWidth disabled label="Grupo" value={item.grupoCliente} />
                                </Box>
                                <Box sx={{ flex: 1, minWidth: 180 }}>
                                    <TextField fullWidth disabled label="Plano" value={item.plano} />
                                </Box>
                                <Box sx={{ flex: 1, minWidth: 150 }}>
                                    <TextField fullWidth disabled label="Valor do plano" value={formatCurrency(item.valorPlano)} />
                                </Box>
                            </>
                        ) : (
                            <Box sx={{ flex: 1 }}>
                                <TextoInput
                                    labelProp={config.targetLabel}
                                    valor={item.nome}
                                    aoAlterado={(valor) => atualizarCampo(index, 'nome', valor.target.value)}
                                    sx={{ width: '100%' }}
                                />
                            </Box>
                        )}

                        <Box sx={{ flex: 1, minWidth: 220 }}>
                            <BasicDatePicker
                                aoAlterado={(value) => {
                                    if (value !== null) {
                                        atualizarCampo(index, 'data', value.toISOString().slice(0, 10));
                                    }
                                }}
                                label={"Selecione a data"}
                                valor={dayjs(item.data)}
                                sx={{ pt: 0 }}
                            />
                        </Box>
                        {config.showValue && (
                            <Box sx={{ flex: 1 }}>
                                <TextoInput
                                    labelProp="Valor"
                                    valor={item.valor}
                                    aoAlterado={(valor) => atualizarCampo(index, 'valor', valor.target.value)}
                                    sx={{ width: '100%' }}
                                    tipo="number"
                                />
                            </Box>
                        )}
                    </Stack>
                ))}

                {!isTracking && (
                    <Fab size="small" color="primary" onClick={adicionarAtividade} sx={{ marginTop: 1 }}>
                        <AddIcon />
                    </Fab>
                )}

                {!isTracking && (
                    <Button variant="contained" color="primary" onClick={enviarDados} sx={{ marginTop: 2 }}>
                        {config.action} <PersonAddIcon sx={{ marginLeft: 2 }} />
                    </Button>
                )}
            </FormControl>
            </Paper>

            <Divider sx={{ marginTop: 2, marginBottom: 2 }} />
            {segmento === 'LEAD' && leadAlerts.length > 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    <Typography fontWeight={700}>
                        {leadAlerts.length} venda(s) precisam de revisao
                    </Typography>
                    <Typography variant="body2">
                        O RBX indica cancelamento ou inatividade para: {leadAlerts.slice(0, 4).map((item) => item.cliente).join(', ')}
                        {leadAlerts.length > 4 ? ` e mais ${leadAlerts.length - 4}` : ''}. Use a acao “Venda nao concluida” e informe o motivo para devolver o registro ao funil.
                    </Typography>
                </Alert>
            )}
            {showLeadFilters && (
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2 }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} gap={1.5} alignItems={{ xs: 'stretch', md: 'center' }}>
                        <Box sx={{ minWidth: 190 }}>
                            <TextField
                                select={trackingMonths.length > 0}
                                fullWidth
                                size="small"
                                type={trackingMonths.length > 0 ? undefined : 'month'}
                                label="Mes de cadastro"
                                value={trackingMonth}
                                onChange={(event) => {
                                    setTrackingMonth(event.target.value || today.slice(0, 7));
                                    setLeadSearch('');
                                    setLeadStatusFilter('Todos');
                                }}
                                InputLabelProps={{ shrink: true }}
                            >
                                {trackingMonths.map((month) => (
                                    <MenuItem key={month} value={month}>
                                        {new Date(`${month}-01T00:00:00`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Box>
                        <Box sx={{ flex: 1.5, minWidth: 240 }}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Buscar lead"
                                placeholder="Cliente, codigo, plano ou usuario"
                                value={leadSearch}
                                onChange={(event) => setLeadSearch(event.target.value)}
                            />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 160 }}>
                            <TextField
                                select
                                fullWidth
                                size="small"
                                label="Status"
                                value={leadStatusFilter}
                                onChange={(event) => setLeadStatusFilter(event.target.value)}
                            >
                                <MenuItem value="Todos">Todos</MenuItem>
                                {leadFilterOptions.status.map((option) => (
                                    <MenuItem key={option} value={option}>{option}</MenuItem>
                                ))}
                            </TextField>
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 180 }}>
                            <TextField
                                select
                                fullWidth
                                size="small"
                                label={config.eventLabel}
                                value={leadEventFilter}
                                onChange={(event) => setLeadEventFilter(event.target.value)}
                            >
                                <MenuItem value="Todos">Todas</MenuItem>
                                {leadFilterOptions.eventos.map((option) => (
                                    <MenuItem key={option} value={option}>{option}</MenuItem>
                                ))}
                            </TextField>
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 160 }}>
                            <TextField
                                select
                                fullWidth
                                size="small"
                                label="Usuario"
                                value={leadUserFilter}
                                onChange={(event) => setLeadUserFilter(event.target.value)}
                            >
                                <MenuItem value="Todos">Todos</MenuItem>
                                {leadFilterOptions.usuarios.map((option) => (
                                    <MenuItem key={option} value={option}>{option}</MenuItem>
                                ))}
                            </TextField>
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 150 }}>
                            <TextField
                                select
                                fullWidth
                                size="small"
                                label="Grupo"
                                value={leadGroupFilter}
                                onChange={(event) => setLeadGroupFilter(event.target.value)}
                            >
                                <MenuItem value="Todos">Todos</MenuItem>
                                {leadFilterOptions.grupos.map((option) => (
                                    <MenuItem key={option} value={option}>{option}</MenuItem>
                                ))}
                            </TextField>
                        </Box>
                        <Button
                            variant="outlined"
                            onClick={() => {
                                setLeadSearch('');
                                setLeadStatusFilter('Todos');
                                setLeadEventFilter('Todos');
                                setLeadUserFilter('Todos');
                                setLeadGroupFilter('Todos');
                            }}
                            sx={{ minWidth: 120 }}
                        >
                            Limpar
                        </Button>
                    </Stack>
                    <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>
                        {filteredData.length} lead(s) pendente(s) de conversao em {new Date(`${trackingMonth}-01T00:00:00`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}.
                    </Typography>
                </Paper>
            )}
            <TabelaExibicao rows={filteredData} columns={colunas} />
            <Dialog open={Boolean(conversionLead)} onClose={() => setConversionLead(null)} maxWidth="sm" fullWidth>
                <DialogTitle>Converter lead em venda</DialogTitle>
                <DialogContent>
                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                        Informe o codigo do cliente na base RBX e busque os contratos. Se for um ponto adicional, selecione especificamente o contrato correspondente antes de converter.
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5} alignItems="flex-start">
                        <TextField
                            fullWidth
                            type="number"
                            label="Codigo do cliente"
                            value={conversionCode}
                            onChange={(event) => {
                                setConversionCode(event.target.value);
                                setConversionContracts([]);
                                setConversionContract('');
                                setConversionError('');
                            }}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    event.preventDefault();
                                    buscarContratosConversao();
                                }
                            }}
                            error={Boolean(conversionError)}
                            helperText={conversionError || conversionLead?.cliente || ''}
                        />
                        <Button
                            variant="outlined"
                            onClick={buscarContratosConversao}
                            disabled={conversionLoading}
                            startIcon={conversionLoading ? <CircularProgress size={16} /> : <SearchRoundedIcon />}
                            sx={{ minWidth: 180, height: 56 }}
                        >
                            Buscar contratos
                        </Button>
                    </Stack>
                    {conversionContracts.length > 0 && (
                        <TextField
                            select
                            fullWidth
                            label="Contrato que sera convertido"
                            value={conversionContract}
                            onChange={(event) => setConversionContract(event.target.value)}
                            sx={{ mt: 2 }}
                        >
                            {conversionContracts.map((contract) => (
                                <MenuItem key={contract.numero} value={contract.numero}>
                                    Contrato {contract.numero} — {contract.plano || 'Plano nao informado'} — {formatCurrency(contract.valor)}{contract.situacao ? ` — ${contract.situacao}` : ''}
                                </MenuItem>
                            ))}
                        </TextField>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConversionLead(null)}>Cancelar</Button>
                    <Button variant="contained" onClick={converterLead} disabled={!conversionContract || conversionLoading}>Converter contrato selecionado</Button>
                </DialogActions>
            </Dialog>
            <Dialog open={Boolean(notCompletedLead)} onClose={() => setNotCompletedLead(null)} maxWidth="sm" fullWidth>
                <DialogTitle>Registrar venda nao concluida</DialogTitle>
                <DialogContent>
                    <Alert severity="info" sx={{ mb: 2 }}>
                        O cliente voltara a ser um lead aberto. O codigo e a situacao consultada no RBX serao preservados para auditoria e relatorios.
                    </Alert>
                    <TextField
                        select
                        fullWidth
                        label="Motivo"
                        value={notCompletedReason}
                        onChange={(event) => setNotCompletedReason(event.target.value)}
                        sx={{ mb: 2 }}
                    >
                        <MenuItem value="DESISTENCIA_CLIENTE">Desistencia do cliente</MenuItem>
                        <MenuItem value="SEM_VIABILIDADE_TECNICA">Sem viabilidade tecnica</MenuItem>
                        <MenuItem value="ENDERECO_INCORRETO">Endereco incorreto</MenuItem>
                        <MenuItem value="SEM_CONTATO">Sem contato</MenuItem>
                        <MenuItem value="PENDENCIA_DOCUMENTAL">Pendencia documental</MenuItem>
                        <MenuItem value="DIVERGENCIA_COMERCIAL">Divergencia comercial</MenuItem>
                        <MenuItem value="OUTRO">Outro</MenuItem>
                    </TextField>
                    <TextField
                        fullWidth
                        multiline
                        minRows={3}
                        label="Observacao"
                        value={notCompletedNote}
                        onChange={(event) => setNotCompletedNote(event.target.value)}
                        error={Boolean(notCompletedError)}
                        helperText={notCompletedError || 'Obrigatoria quando o motivo for Outro.'}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setNotCompletedLead(null)}>Cancelar</Button>
                    <Button color="warning" variant="contained" onClick={registrarNaoConclusao}>Confirmar e reabrir lead</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default AtividadesComercial;
