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

const SettingsRegistros = () => {
    
    const [procedimento, setProcedimento] = useState("");
    const [cor, setCor] = useState("#000000");
    const [procedimentos, setProcedimentos] = useState([]);
    const [refresh, setRefresh] = useState(true);
    const [editData, setEditData] = useState(null);
    const [deleteId, setDeleteId] = useState(null);

    useEffect(() => {
        (async () => {
            try {
                const dados = await api("procedimento");
                setProcedimentos(dados);
            } catch (err) {
                console.error("Erro ao buscar procedimentos:", err);
            }
        })();
    }, [refresh]);

    const cadastrarProcedimento = async (e) => {
        e.preventDefault();
        try {
            await api("procedimento", "POST", {
                procedimento: procedimento.toUpperCase(),
                cor,
            });
            setProcedimento("");
            setRefresh((r) => !r);
        } catch (err) {
            console.error("Erro ao cadastrar:", err);
        }
    };

    const editarProcedimento = async () => {
        if (!editData) return;
        try {
            await api(`procedimento/${editData.id}`, "PUT", {
                procedimento: editData.label.toUpperCase(),
                cor: editData.cor,
            });
            setEditData(null);
            setRefresh((r) => !r);
        } catch (err) {
            console.error("Erro ao editar:", err);
        }
    };

    const excluirProcedimento = async () => {
        try {
            await api(`procedimento/${deleteId}`, "DELETE");
            setDeleteId(null);
            setRefresh((r) => !r);
        } catch (err) {
            console.error("Erro ao excluir:", err);
        }
    };

    return (
        <>
            <FormularioStyled onSubmit={cadastrarProcedimento}>
                <div style={{ display: "flex", gap: "64px", justifyContent: "space-between" }}>
                    <div style={{ width: "100%" }}>
                        <Typography variant="h4">Cadastro de procedimento</Typography>
                        <TextoInput
                            labelProp="Procedimento"
                            aoAlterado={(e) => setProcedimento(e.target.value.toUpperCase())}
                            valor={procedimento}
                            obrigatorio
                            sx={{ width: '100%' }}
                        />
                    </div>
                    <div style={{ width: "100%" }}>
                        <Typography variant="h4">Escolha uma cor</Typography>
                        <TextoInput
                            labelProp="Cor"
                            aoAlterado={(e) => setCor(e.target.value)}
                            valor={cor}
                            obrigatorio
                            tipo="color"
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
                    Procedimentos
                </Typography>
                <ProcedimentosContainer>
                    {procedimentos.map((item) => (
                        <ProcedimentoBox key={item.id}>
                            <Typography variant="body1">{item.label}</Typography>
                            <CorIndicador style={{ backgroundColor: item.cor }} />
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
                    titulo="Editar Procedimento"
                    contexto={
                        <div style={{ display: "flex", gap: "32px", flexDirection: 'column', height: '200px' }}>
                            <TextoInput
                                labelProp="Procedimento"
                                aoAlterado={(e) =>
                                    setEditData((prev) => ({ ...prev, label: e.target.value }))
                                }
                                valor={editData.label}
                                obrigatorio
                                sx={{ width: '100%', marginTop: 2 }}
                            />
                            <TextoInput
                                labelProp="Cor"
                                aoAlterado={(e) =>
                                    setEditData((prev) => ({ ...prev, cor: e.target.value }))
                                }
                                valor={editData.cor}
                                obrigatorio
                                tipo="color"
                                sx={{ width: '100%' }}
                            />
                        </div>

                    }
                    aoChamar={editarProcedimento}
                    aoFechar={() => setEditData(null)}
                    nomeAcao="Editar"
                />
            )}

            {
                deleteId && (
                    <DialogAction
                        abrir
                        titulo="Excluir Procedimento"
                        contexto="Tem certeza que deseja excluir o procedimento?"
                        aoChamar={excluirProcedimento}
                        aoFechar={() => setDeleteId(null)}
                        nomeAcao="Excluir"
                    />
                )
            }
        </>
    );
};

export default SettingsRegistros;
