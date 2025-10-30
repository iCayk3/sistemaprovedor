import * as React from 'react';
import Api from '../../Services/Api';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Typography } from '@mui/material';
import TabelaExibicao from '../../Componentes/TabelaExibicao';
import { GridActionsCellItem } from '@mui/x-data-grid';
import DeleteIcon from '@mui/icons-material/Delete';
import DoneIcon from '@mui/icons-material/Done';

const UseApi = Api()

function DeletarRegistro({ deleteUser, ...props }) {
    const [open, setOpen] = React.useState(false);

    return (
        <>
            <GridActionsCellItem {...props} onClick={() => setOpen(true)} />
            <Dialog
                open={open}
                onClose={() => setOpen(false)}
            >
                <DialogTitle>Aprovar requisição?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        A senha do usuario sera alterada, tem certeza?
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
                        Aprovar
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}



const PendentPass = () => {

    const [data, setData] = React.useState([])
    const [refreshTable, setRefreshTable] = React.useState(false)

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await UseApi(`usuario/pendentes/redefinicoes`)
                console.log(response)
                console.log(response.status)
                setData(response)
            } catch (error) {
                console.error(error?.status);
            }
        }

        fetchData()
    }, [refreshTable])

    const deleteRegistro = React.useCallback(
        (id) => async () => {

            const form = { id: id }

            try {
                console.log(form)
                await UseApi(`usuario/redefinirsenha`, 'PUT', form);
                handleFormSubmit(); // Atualiza tabela
            } catch (error) {
                console.error("Erro ao aprovar requisição:", error);
            }
        },
        []
    );

    const handleFormSubmit = () => {
        setRefreshTable(true);
    };

    const colunas = [
        {
            field: 'options',
            width: 10,
            type: 'actions',
            getActions: (params) => [
                <DeletarRegistro
                    label="Aprovar"
                    showInMenu
                    icon={<DoneIcon />}
                    deleteUser={deleteRegistro(params.id)}
                    closeMenuOnClick={false}
                />
            ]
        },
        { field: 'id', headerName: 'ID', width: 2 },
        { field: 'status', headerName: 'Status', width: 250 },
        { field: 'usuario', headerName: 'Usuario', width: 300 },
    ];

    return (
        <>
            <TabelaExibicao rows={data} columns={colunas} />
        </>
    )
}

export default PendentPass