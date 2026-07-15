import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, Fab, FormControl, IconButton, Paper, Stack, TextField, Typography } from "@mui/material"
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
import { GridActionsCellItem } from "@mui/x-data-grid";

const UseApi = Api()

const today = new Date().toISOString().slice(0, 10);

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
    const isTracking = mode === 'acompanhamento';

    useEffect(() => {
        setAtividades([{ id: null, nome: '', evento: '', eventoInput: '', data: today, valor: '' }]);
    }, [segmento]);

    const adicionarAtividade = () => {
        const today = new Date().toISOString().slice(0, 10);
        setAtividades([...atividades, { id: null, nome: '', evento: '', eventoInput: '', data: today, valor: '' }]);
    };

    const removerAtividade = (index) => {
        setAtividades(atividades.filter((_, i) => i !== index));
    };

    const atualizarCampo = (index, campo, valor) => {
        const novas = [...atividades];
        novas[index][campo] = valor;
        setAtividades(novas);
    };

    const enviarDados = async () => {
        const payload = atividades.map(({ nome, evento, data, valor }) => ({
            cliente: nome,
            evento: evento.label,
            data,
            segmento,
            valor: segmento === 'COBRANCA' && valor !== '' ? Number(String(valor).replace(',', '.')) : null,
            status: segmento === 'LEAD' ? 'ABERTO' : null,
        }));

        try {
            await UseApi(`atividades`, 'POST', payload);
            handleFormSubmit();
        } catch (err) {
            console.error("Erro :" + err)
        } finally {
            setAtividades([{ id: null, nome: '', evento: '', eventoInput: '', data: today, valor: '' }])
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
                if (isTracking && segmento === 'LEAD' && params.row.status !== 'CONVERTIDO') {
                    return [
                        <GridActionsCellItem
                            label="Converter em venda"
                            showInMenu
                            icon={<CheckCircleIcon />}
                            onClick={() => abrirConversao(params.row)}
                        />
                    ];
                }

                if (isTracking) {
                    return [];
                }

                return [
                    <DeletarRegistro
                        label="Delete"
                        showInMenu
                        icon={<DeleteIcon />}
                        deleteUser={deleteRegistro(params.id)}
                        closeMenuOnClick={false}
                    />
                ];
            }
        },
        { field: 'cliente', headerName: config.targetLabel, width: 500 },
        { field: 'evento', headerName: config.eventLabel, width: 250 },
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
                valueFormatter: (value) => {
                    if (value === null || value === undefined || value === '') return '';
                    return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                },
            },
            { field: 'convertidoPor', headerName: 'Convertido por', width: 160 },
        ] : []),
        ...(config.showValue ? [{
            field: 'valor',
            headerName: 'Valor',
            width: 140,
            valueFormatter: (value) => {
                if (value === null || value === undefined || value === '') return '';
                return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            },
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

                {!isTracking && atividades.map((item, index) => (
                    <Stack key={index} direction={{ xs: 'column', md: 'row' }} gap={2} alignItems={{ xs: 'stretch', md: 'center' }}>
                        <IconButton color="error" onClick={() => removerAtividade(index)}>
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

                        <Box sx={{ flex: 1 }}>
                            <TextoInput
                                labelProp={config.targetLabel}
                                valor={item.nome}
                                aoAlterado={(valor) => atualizarCampo(index, 'nome', valor.target.value)}
                                sx={{ width: '100%' }}
                            />
                        </Box>

                        <Box sx={{ flex: 1 }}>
                            <BasicDatePicker
                                aoAlterado={(value) => {
                                    if (value !== null) {
                                        atualizarCampo(index, 'data', value.toISOString().slice(0, 10));
                                    }
                                }}
                                label={"Selecione a data"}
                                valor={dayjs(item.data)}
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
