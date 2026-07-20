import { Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, Fab, FormControl, IconButton, InputAdornment, Paper, Stack, TextField, Typography } from "@mui/material"
import FieldAutoComplet from "../../Componentes/FieldAutoComplet"
import TextoInput from "../../Componentes/TextoInput"
import { useCallback, useEffect, useState } from "react";
import Api from "../../Services/Api";
import AddIcon from "@mui/icons-material/Add";
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ClearIcon from '@mui/icons-material/Clear';
import BasicDatePicker from "../../Componentes/BasicDatePicker";
import dayjs from "dayjs";
import TabelaExibicao from "../../Componentes/TabelaExibicao";
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
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
    const [formError, setFormError] = useState('');
    const isTracking = mode === 'acompanhamento';
    const isActivity = segmento === 'ATIVIDADE';

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
        const fetchData = async () => {
            try {
                const response = await UseApi(`atividades/registro/mensal?segmento=${segmento}`);
                setData(response);
            } catch (error) {
                console.error('Erro ao buscar dados:', error);
            } finally {
                setRefreshTable(false);
            }
        };

        if (refreshTable) fetchData();
    }, [refreshTable, segmento]);

    const handleFormSubmit = () => {
        setRefreshTable(true);
    };

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
    };

    const converterLead = async () => {
        if (!conversionLead || !conversionCode) {
            setConversionError('Informe o codigo do cliente.');
            return;
        }

        try {
            await UseApi(`atividades/${conversionLead.id}/converter-lead`, 'PATCH', {
                codigoCliente: Number(conversionCode),
            });
            setConversionLead(null);
            setConversionCode('');
            handleFormSubmit();
        } catch (error) {
            setConversionError(error.message || 'Erro ao converter lead.');
        }
    };

    const colunas = [
        {
            field: 'options',
            width: 10,
            type: 'actions',
            getActions: (params) => {
                const canConvertLead = segmento === 'LEAD' && params.row.status !== 'CONVERTIDO';
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
                renderCell: (params) => (
                    <Chip
                        size="small"
                        color={params.value === 'CONVERTIDO' ? 'success' : 'warning'}
                        label={params.value || 'ABERTO'}
                    />
                ),
            },
            { field: 'codigoCliente', headerName: 'Codigo cliente', width: 130 },
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
                    <Typography variant="h4" fontWeight={800}>{isTracking ? `Acompanhamento de ${config.subtitle.toLowerCase()}` : config.title}</Typography>
                    <Typography color="text.secondary">
                        {isTracking ? 'Fila operacional para acompanhamento e conversao de leads.' : `${config.subtitle} do comercial no sistema principal.`}
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
            <TabelaExibicao rows={data} columns={colunas} />
            <Dialog open={Boolean(conversionLead)} onClose={() => setConversionLead(null)} maxWidth="sm" fullWidth>
                <DialogTitle>Converter lead em venda</DialogTitle>
                <DialogContent>
                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                        Informe o codigo do cliente na base RBX. O sistema buscara o nome, grupo, plano e valor do contrato mais recente com valor.
                    </Typography>
                    <TextField
                        fullWidth
                        type="number"
                        label="Codigo do cliente"
                        value={conversionCode}
                        onChange={(event) => setConversionCode(event.target.value)}
                        error={Boolean(conversionError)}
                        helperText={conversionError || conversionLead?.cliente || ''}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConversionLead(null)}>Cancelar</Button>
                    <Button variant="contained" onClick={converterLead}>Converter</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default AtividadesComercial;
