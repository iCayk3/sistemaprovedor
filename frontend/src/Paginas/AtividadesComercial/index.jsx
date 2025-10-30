import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, Fab, FormControl, IconButton, Typography } from "@mui/material"
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
import { GridActionsCellItem } from "@mui/x-data-grid";

const UseApi = Api()

const today = new Date().toISOString().slice(0, 10);

const AtividadesComercial = () => {
    const [atividades, setAtividades] = useState([]);
    const [data, setData] = useState([]);
    const [refreshTable, setRefreshTable] = useState(true);

    useEffect(() => {
        setAtividades([{ id: null, nome: '', evento: '', eventoInput: '', data: today }]);
    }, []);

    const adicionarAtividade = () => {
        const today = new Date().toISOString().slice(0, 10);
        setAtividades([...atividades, { id: null, nome: '', evento: '', eventoInput: '', data: today }]);
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
        const payload = atividades.map(({ nome, evento, data }) => ({
            cliente: nome,
            evento: evento.label,
            data
        }));

        try {
            await UseApi(`atividades`, 'POST', payload);
            handleFormSubmit();
        } catch (err) {
            console.error("Erro :" + err)
        } finally {
            setAtividades([{ id: null, nome: '', evento: '', eventoInput: '', data: today }])
        }

    };
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await UseApi(`atividades/registro/mensal`);
                setData(response);
            } catch (error) {
                console.error('Erro ao buscar dados:', error);
            } finally {
                setRefreshTable(false);
            }
        };

        if (refreshTable) fetchData();
    }, [refreshTable]);

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

    const colunas = [
        {
            field: 'options',
            width: 10,
            type: 'actions',
            getActions: (params) => [
                <DeletarRegistro
                    label="Delete"
                    showInMenu
                    icon={<DeleteIcon />}
                    deleteUser={deleteRegistro(params.id)}
                    closeMenuOnClick={false}
                />
            ]
        },
        { field: 'cliente', headerName: 'Cliente', width: 500 },
        { field: 'evento', headerName: 'Evento', width: 250 },
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
            <FormControl sx={{ width: '100%', display: 'flex', gap: 2 }}>
                <Typography variant="h4">Registrar atividade</Typography>
                <Typography variant="h6">Atividades</Typography>

                {atividades.map((item, index) => (
                    <Box key={index} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <IconButton color="error" onClick={() => removerAtividade(index)}>
                            <ClearIcon />
                        </IconButton>

                        <Box sx={{ flex: 1 }}>
                            <FieldAutoComplet
                                endpoint={`evento`}
                                obrigatorio
                                label={"Evento"}
                                aoAlterado={(valor) => atualizarCampo(index, 'evento', valor)}
                                onInputValueChange={(valor) => atualizarCampo(index, 'eventoInput', valor)}
                                valor={item.evento}
                                inputValue={item.eventoInput}
                                sx={{ width: '100%' }}
                            />
                        </Box>

                        <Box sx={{ flex: 1 }}>
                            <TextoInput
                                labelProp={`Cliente`}
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
                    </Box>
                ))}

                <Fab size="small" color="primary" onClick={adicionarAtividade} sx={{ marginTop: 1 }}>
                    <AddIcon />
                </Fab>

                <Button variant="contained" color="primary" onClick={enviarDados} sx={{ marginTop: 2 }}>
                    Registrar atividade <PersonAddIcon sx={{ marginLeft: 2 }} />
                </Button>
            </FormControl>

            <Divider sx={{ marginTop: 2, marginBottom: 2 }} />
            <TabelaExibicao rows={data} columns={colunas} />
        </>
    );
};

export default AtividadesComercial;
