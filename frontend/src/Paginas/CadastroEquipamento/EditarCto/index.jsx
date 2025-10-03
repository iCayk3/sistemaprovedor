import {
    Typography, TextField
} from "@mui/material";
import { useCallback, useState } from "react";
import FieldAutoComplet from "../../../Componentes/FieldAutoComplet";
import Api from "../../../Services/Api";
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { GridActionsCellItem } from "@mui/x-data-grid";
import { DialogAction } from "../../../Componentes/DialogAction";
import TabelaExibicao from "../../../Componentes/TabelaExibicao";

const UseApi = Api();

const EditarCto = () => {
    const [olt, setOlt] = useState('');
    const [oltInput, setOltInput] = useState('');
    const [ctos, setCtos] = useState([]);
    const [editData, setEditData] = useState(null);
    const [confirmDialogData, setConfirmDialogData] = useState(null);

    const carregarCtos = useCallback(async (e) => {
        setOlt(e);
        try {
            const response = await UseApi(`olt/${e.id}/cto`);
            setCtos(response || []);
        } catch (error) {
            console.error("Erro ao carregar CTOs:", error);
        }
    }, []);

    const exibirDialog = (id) => {
        setConfirmDialogData(id);
    };

    const deleteCto = useCallback(
        async (id) => {
            try {
                await UseApi(`olt/cto/${id}`, 'DELETE');
                if (olt && olt.id) {
                    await carregarCtos(olt);
                }
            } catch (error) {
                console.error("Erro ao excluir registro:", error);
            }
        },
        [carregarCtos, olt]
    );

    const handleEditSave = async () => {
        if (!editData) return;

        try {
            await UseApi(`olt/cto/${editData.id}`, 'PUT', editData);
            setCtos(prev =>
                prev.map(cto => cto.id === editData.id ? editData : cto)
            );
            setEditData(null);
        } catch (error) {
            console.error("Erro ao editar registro:", error);
        }
    };

    const colunas = [
        {
            field: 'actions',
            type: 'actions',
            width: 50,
            getActions: (params) => [
                <GridActionsCellItem
                    key="edit"
                    icon={<EditIcon />}
                    label="Editar"
                    onClick={() => setEditData(params.row)}
                    showInMenu
                />,
                <GridActionsCellItem
                    key="delete"
                    icon={<DeleteIcon />}
                    label="Excluir"
                    onClick={() => exibirDialog(params.id)}
                    showInMenu
                />
            ]
        },
        { field: 'id', headerName: 'ID', width: 60 },
        { field: 'label', headerName: 'CTO', width: 550 },
        { field: 'portas', headerName: 'Portas', width: 140 },
        { field: 'lat', headerName: 'Latitude', width: 140 },
        { field: 'longi', headerName: 'Longitude', width: 140 },
    ];

    return (
        <>
            <Typography component="h1" sx={{ marginBottom: 2 }}>
                Selecione a OLT
            </Typography>
            <FieldAutoComplet
                endpoint="olt"
                label="OLT"
                aoAlterado={carregarCtos}
                onInputValueChange={setOltInput}
                valor={olt}
                inputValue={oltInput}
            />
            <TabelaExibicao
                rows={ctos}
                columns={colunas}
                sx={{ marginTop: 2 }}
            />

            {editData && (
                <DialogAction
                    abrir
                    entradas
                    titulo={"Editar CTO"}
                    contexto={
                        <>
                            <TextField
                                margin="dense"
                                label="CTO"
                                fullWidth
                                value={editData.label}
                                onChange={e => setEditData({ ...editData, label: e.target.value })}
                            />
                            <TextField
                                type="number"
                                margin="dense"
                                label="Portas"
                                fullWidth
                                value={editData.portas}
                                onChange={e => setEditData({ ...editData, portas: e.target.value })}
                            />
                            <TextField
                                margin="dense"
                                label="Latitude"
                                fullWidth
                                type="number"
                                inputProps={{ step: "any", min: -90, max: 90 }}
                                value={editData.lat}
                                onChange={(e) => {
                                    const value = parseFloat(e.target.value);
                                    if (!isNaN(value) && value >= -90 && value <= 90) {
                                        setEditData({ ...editData, lat: value });
                                    } else if (e.target.value === "") {
                                        setEditData({ ...editData, lat: "" });
                                    }
                                }}
                                error={editData.lat !== "" && (editData.lat < -90 || editData.lat > 90)}
                                helperText="Latitude entre -90 e 90"
                            />

                            <TextField
                                margin="dense"
                                label="Longitude"
                                fullWidth
                                type="number"
                                inputProps={{ step: "any", min: -180, max: 180 }}
                                value={editData.longi}
                                onChange={(e) => {
                                    const value = parseFloat(e.target.value);
                                    if (!isNaN(value) && value >= -180 && value <= 180) {
                                        setEditData({ ...editData, longi: value });
                                    } else if (e.target.value === "") {
                                        setEditData({ ...editData, longi: "" });
                                    }
                                }}
                                error={editData.longi !== "" && (editData.longi < -180 || editData.longi > 180)}
                                helperText="Longitude entre -180 e 180"
                            />
                        </>
                    }
                    aoChamar={handleEditSave}
                    aoFechar={() => setEditData(null)}
                    nomeAcao={"Salvar"}
                />
            )}

            {confirmDialogData !== null && (
                <DialogAction
                    abrir={true}
                    aoChamar={async () => {
                        await deleteCto(confirmDialogData);
                        setConfirmDialogData(null);
                    }}
                    aoFechar={() => setConfirmDialogData(null)}
                    titulo="Deletar CTO"
                    contexto="Você tem certeza que quer deletar essa CTO?"
                    nomeAcao="Deletar"
                    icon={null}
                />
            )}
        </>
    );
};

export default EditarCto;
