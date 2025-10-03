import styled from "styled-components";
import Api from "../../Services/Api";
import { useEffect, useState } from "react";
import TextoInput from "../../Componentes/TextoInput";
import {
    Button,
    IconButton,
    List,
    ListItem,
    ListItemText,
    Typography
} from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import EditIcon from "@mui/icons-material/DriveFileRenameOutline";
import { DialogAction } from "../../Componentes/DialogAction";

const FormularioStyled = styled.form`
    .sub-area {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 32px;
        margin-top: 32px;
    }
`;

const ProcedimentosContainer = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 24px;
    justify-content: space-between;
`;

const ProcedimentoBox = styled.div`
    display: flex;
    align-items: center;
    padding: 12px 16px;
    border-left: 1px solid;
    border-right: 1px solid;
    min-width: 220px;
    width: 25%;
    display: flex;
    justify-content: space-between;
`;

const CorIndicador = styled.span`
    width: 12px;
    height: 12px;
    border-radius: 50%;
    margin-left: 12px;
`;

const api = Api();

const SettingsAtividades = () => {

    const [evento, setEvento] = useState("");
    const [procedimentos, setProcedimentos] = useState([]);
    const [refresh, setRefresh] = useState(true);
    const [editData, setEditData] = useState(null);
    const [deleteId, setDeleteId] = useState(null);

    useEffect(() => {
        (async () => {
            try {
                const dados = await api("evento");
                setProcedimentos(dados);
            } catch (err) {
                console.error("Erro ao buscar procedimentos:", err);
            }
        })();
    }, [refresh]);

    const cadastrarEvento = async (e) => {
        e.preventDefault();
        try {
            await api("evento", "POST", {
                evento: evento.toUpperCase(),
            });
            setEvento("");
            setRefresh((r) => !r);
        } catch (err) {
            console.error("Erro ao cadastrar:", err);
        }
    };

    const editarEvento = async () => {
        if (!editData) return;
        try {
            await api(`evento/${editData.id}`, "PUT", {
                evento: editData.label.toUpperCase(),
            });
            setEditData(null);
            setRefresh((r) => !r);
        } catch (err) {
            console.error("Erro ao editar:", err);
        }
    };

    const excluirEvento = async () => {
        try {
            await api(`evento/${deleteId}`, "DELETE");
            setDeleteId(null);
            setRefresh((r) => !r);
        } catch (err) {
            console.error("Erro ao excluir:", err);
        }
    };

    return (
        <>
            <FormularioStyled onSubmit={cadastrarEvento}>
                <div style={{ display: "flex", gap: "64px", justifyContent: "space-between" }}>
                    <div style={{ width: "100%" }}>
                        <Typography variant="h4">Cadastro de evento</Typography>
                        <TextoInput
                            labelProp="Evento"
                            aoAlterado={(e) => setEvento(e.target.value.toUpperCase())}
                            valor={evento}
                            obrigatorio
                            sx={{ width: '100%' }}
                        />
                    </div>
                </div>
                <Button type="submit" variant="outlined" sx={{ mt: 4 }}>
                    Cadastrar
                </Button>
            </FormularioStyled>

            <div>
                <Typography variant="h4" sx={{ mt: 4 }}>
                    Eventos
                </Typography>
                <ProcedimentosContainer>
                    {procedimentos.map((item) => (
                        <ProcedimentoBox key={item.id}>
                            <Typography variant="body1">{item.label}</Typography>   
                            <IconButton onClick={() => setEditData({ ...item })} sx={{ ml: 1 }}>
                                <EditIcon />
                            </IconButton>
                            <IconButton color="error" onClick={() => setDeleteId(item.id)} sx={{ ml: 1 }}>
                                <ClearIcon />
                            </IconButton>
                        </ProcedimentoBox>
                    ))}
                </ProcedimentosContainer>
            </div>

            {editData && (
                <DialogAction
                    abrir
                    entradas
                    titulo="Editar evento"
                    contexto={
                        <div style={{ display: "flex", gap: "32px", flexDirection: 'column', height: '200px' }}>
                            <TextoInput
                                labelProp="Evento"
                                aoAlterado={(e) =>
                                    setEditData((prev) => ({ ...prev, label: e.target.value }))
                                }
                                valor={editData.label}
                                obrigatorio
                                sx={{ width: '100%', marginTop: 2 }}
                            />
                        </div>

                    }
                    aoChamar={editarEvento}
                    aoFechar={() => setEditData(null)}
                    nomeAcao="Editar"
                />
            )}

            {
                deleteId && (
                    <DialogAction
                        abrir
                        titulo="Excluir evento"
                        contexto="Tem certeza que deseja excluir o evento?"
                        aoChamar={excluirEvento}
                        aoFechar={() => setDeleteId(null)}
                        nomeAcao="Excluir"
                    />
                )
            }
        </>
    )
}

export default SettingsAtividades