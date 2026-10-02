import { useCallback } from 'react';
import FormularioRegistro from '../../Componentes/FormularioRegistro';
import Api from '../../Services/Api';
import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { GridActionsCellItem } from '@mui/x-data-grid';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import TabelaExibicao from '../../Componentes/TabelaExibicao';

const UseApi = Api();

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
                        color="error"
                        variant="contained"
                        autoFocus
                    >
                        Deletar
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

const Inicio = () => {
    const queryClient = useQueryClient();

    const { data: inicioData, isLoading } = useQuery({
        queryKey: ['inicio', 'dados'],
        queryFn: async () => {
            const [response, procediment] = await Promise.all([
                UseApi('registros/top15'),
                UseApi('procedimento'),
            ]);
            return {
                registros: Array.isArray(response) ? response : [],
                procedimentos: Array.isArray(procediment) ? procediment : [],
            };
        },
    });

    const data = inicioData?.registros || [];
    const procedi = inicioData?.procedimentos || [];

    const handleFormSubmit = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['inicio', 'dados'] });
        queryClient.invalidateQueries({ queryKey: ['overviewRegistros'] });
    }, [queryClient]);

    const deleteRegistro = useCallback(
        (id) => async () => {
            try {
                await UseApi(`registros/${id}`, 'DELETE');
                handleFormSubmit();
            } catch (error) {
                console.error("Erro ao excluir registro:", error);
            }
        },
        [handleFormSubmit]
    );

    const colunas = [
        {
            field: 'options',
            width: 10,
            type: 'actions',
            getActions: (params) => [
                <DeletarRegistro
                    key={params.id}
                    label="Delete"
                    showInMenu
                    icon={<DeleteIcon />}
                    deleteUser={deleteRegistro(params.id)}
                    closeMenuOnClick={false}
                />
            ]
        },
        { field: 'cliente', headerName: 'Código', width: 90 },
        { field: 'login', headerName: 'Login', width: 90 },
        { field: 'olt', headerName: 'OLT', width: 140 },
        { field: 'cto', headerName: 'CTO', width: 160 },
        { field: 'porta', headerName: 'PORTA', width: 80 },
        { field: 'equipe', headerName: 'Equipe técnica', width: 200 },
        {
            field: 'data',
            headerName: 'Data',
            width: 120,
            valueFormatter: (params) => {
                const raw = params;
                if (!raw) return '';
                const dataFormatada = new Date(`${raw}T00:00:00`);
                return dataFormatada.toLocaleDateString('pt-BR');
            }
        },
        { field: 'procedimento', headerName: 'Procedimento', width: 180 },
        { field: 'mac', headerName: 'Mac', width: 180 },
        { field: 'ctoAntiga', headerName: 'CTO Antiga', width: 120 },
        { field: 'localidade', headerName: 'Localidade', width: 130 },
        { field: 'observacao', headerName: 'Observação', width: 200 }
    ];

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
                <FormularioRegistro
                    onFormSubmit={handleFormSubmit}
                    procedimentos={procedi}
                />
            </Box>
            <Box>
                <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>
                    Últimos registros
                </Typography>
                <TabelaExibicao
                    rows={data}
                    columns={colunas}
                    loading={isLoading}
                />
            </Box>
        </Box>
    );
};

export default Inicio;
