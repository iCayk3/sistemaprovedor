import { useEffect, useState, useCallback } from 'react';
import { styled } from '@mui/material/styles';
import FormularioRegistro from '../../Componentes/FormularioRegistro';
import Api from '../../Services/Api';
import * as React from 'react';
import { GridActionsCellItem } from '@mui/x-data-grid';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import TabelaExibicao from '../../Componentes/TabelaExibicao';
import dayjs from 'dayjs';

const MainEstilizado = styled('main')(() => ({
    // Layout personalizado aqui, se necessário
}));

const UseApi = Api();

const Inicio = () => {

    const [refreshTable, setRefreshTable] = useState(true);
    const [data, setData] = useState([]);
    const [procedi, setProcedi] = useState([]);
    const [alertMessage, setAlertMessage] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await UseApi(`registros/top15`);
                const procediment = await UseApi('procedimento')
                setData(response);
                setProcedi(procediment)
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

    const exibiralerta = (event) => {
        setAlertMessage(event);
    };

    function DeletarRegistro({ deleteUser, ...props }) {
        const [open, setOpen] = React.useState(false);

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
                            Está prestes a excluir um registro de serviço. Deseja continuar?
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
            try {
                await UseApi(`registros/${id}`, 'DELETE');
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
        { field: 'cliente', headerName: 'Código', width: 80 },
        { field: 'login', headerName: 'Login', width: 80 },
        { field: 'olt', headerName: 'OLT', width: 140 },
        { field: 'cto', headerName: 'CTO', width: 160 },
        { field: 'porta', headerName: 'PORTA', width: 70 },
        { field: 'equipe', headerName: 'Equipe técnica', width: 200 },
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
        { field: 'procedimento', headerName: 'Procedimento', width: 180 },
        { field: 'mac', headerName: 'Mac', width: 180 },
        { field: 'ctoAntiga', headerName: 'CTO Antiga', width: 120 },
        { field: 'localidade', headerName: 'Localidade', width: 130 },
        { field: 'observacao', headerName: 'Observação', width: 200 }
    ];

    return (
        <MainEstilizado>
            <section className='grid-item'>
                <FormularioRegistro
                    onFormSubmit={handleFormSubmit}
                    procedimentos={procedi}
                    onclose={() => exibiralerta(false)}
                />
            </section>
            <section className='grid-item'>
                <h2>Últimos registros</h2>
                <TabelaExibicao rows={data} columns={colunas} />
            </section>
        </MainEstilizado>
    );
};

export default Inicio;
