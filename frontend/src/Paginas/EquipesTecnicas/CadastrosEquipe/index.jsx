import AddIcon from "@mui/icons-material/Add";
import ClearIcon from "@mui/icons-material/Clear";
import Groups3Icon from "@mui/icons-material/Groups3";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import {
    Alert,
    Box,
    Button,
    IconButton,
    Paper,
    Stack,
    Typography,
} from "@mui/material";
import { useState } from "react";
import FieldAutoComplet from "../../../Componentes/FieldAutoComplet";
import TextoInput from "../../../Componentes/TextoInput";
import Api from "../../../Services/Api";

const UseApi = Api();

const emptyTechnician = { id: null, nome: "" };

const TechnicianRows = ({ rows, disabled = false, onAdd, onRemove, onChange, labelPrefix }) => (
    <Stack spacing={1.2}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle1" fontWeight={800}>Tecnicos</Typography>
            <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={onAdd} disabled={disabled}>
                Adicionar
            </Button>
        </Stack>
        {rows.map((tecnico, index) => (
            <Stack
                key={index}
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{
                    p: 1,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                }}
            >
                <Typography color="text.secondary" sx={{ width: 28, textAlign: "center" }}>
                    {index + 1}
                </Typography>
                <TextoInput
                    labelProp={`${labelPrefix} ${index + 1}`}
                    valor={tecnico.nome}
                    aoAlterado={(valor) => onChange(index, valor)}
                    sx={{ width: "100%" }}
                    desabilitar={disabled}
                />
                <IconButton
                    color="error"
                    onClick={() => onRemove(index)}
                    aria-label="Remover tecnico"
                    disabled={disabled || rows.length === 1}
                >
                    <ClearIcon />
                </IconButton>
            </Stack>
        ))}
    </Stack>
);

const CadastrosEquipes = ({ atualizar }) => {
    const [nomeEquipe, setNomeEquipe] = useState("");
    const [tecnicos, setTecnicos] = useState([emptyTechnician]);
    const [tecnicosAtualizar, setTecnicosAtualizar] = useState([emptyTechnician]);
    const [tecnicoInput0, setTecnicoInput0] = useState("");
    const [tecnico0, setTecnico0] = useState("");
    const [error, setError] = useState("");

    const adicionarTecnico = ({ atualizar: atualizarEquipe } = {}) => {
        if (atualizarEquipe) {
            setTecnicosAtualizar((current) => [...current, emptyTechnician]);
            return;
        }
        setTecnicos((current) => [...current, emptyTechnician]);
    };

    const atualizarTecnico = (index, valor, atualizarEquipe) => {
        const nextValue = valor.target.value;
        if (atualizarEquipe) {
            setTecnicosAtualizar((current) => current.map((item, itemIndex) => (
                itemIndex === index ? { ...item, nome: nextValue } : item
            )));
            return;
        }
        setTecnicos((current) => current.map((item, itemIndex) => (
            itemIndex === index ? { ...item, nome: nextValue } : item
        )));
    };

    const removerTecnico = (index, atualizarEquipe) => {
        if (atualizarEquipe) {
            setTecnicosAtualizar((current) => current.filter((_, itemIndex) => itemIndex !== index));
            return;
        }
        setTecnicos((current) => current.filter((_, itemIndex) => itemIndex !== index));
    };

    const atualizarPagina = () => {
        atualizar((prev) => !prev);
    };

    const enviarDados = async ({ atualizar: atualizarEquipe } = {}) => {
        setError("");
        const payload = {
            nomeEquipe: atualizarEquipe ? tecnico0.id : nomeEquipe,
            tecnicos: atualizarEquipe ? tecnicosAtualizar : tecnicos,
        };

        try {
            if (!atualizarEquipe) {
                await UseApi("tecnico/equipes", "POST", payload);
                setNomeEquipe("");
                setTecnicos([emptyTechnician]);
                atualizarPagina();
                return;
            }

            await UseApi("tecnico", "POST", payload);
            setTecnico0("");
            setTecnicoInput0("");
            setTecnicosAtualizar([emptyTechnician]);
            atualizarPagina();
        } catch (requestError) {
            console.error("Erro ao salvar cadastro:", requestError);
            setError(requestError.message || "Erro ao salvar cadastro.");
        }
    };

    return (
        <Box>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Box
                sx={{
                    display: "grid",
                    gap: 2,
                    gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" },
                }}
            >
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                    <Stack spacing={2}>
                        <Box>
                            <Typography variant="h5" fontWeight={800}>Cadastro de equipe</Typography>
                            <Typography color="text.secondary">
                                Crie uma equipe ja associando seus tecnicos.
                            </Typography>
                        </Box>
                        <TextoInput
                            labelProp="Nome da equipe"
                            obrigatorio
                            valor={nomeEquipe}
                            aoAlterado={(e) => setNomeEquipe(e.target.value)}
                            sx={{ width: "100%" }}
                        />
                        <TechnicianRows
                            rows={tecnicos}
                            labelPrefix="Nome do tecnico"
                            onAdd={() => adicionarTecnico()}
                            onRemove={(index) => removerTecnico(index)}
                            onChange={(index, valor) => atualizarTecnico(index, valor)}
                        />
                        <Button
                            variant="contained"
                            startIcon={<Groups3Icon />}
                            onClick={() => enviarDados()}
                            disabled={!nomeEquipe.trim()}
                            sx={{ alignSelf: "stretch" }}
                        >
                            Cadastrar equipe
                        </Button>
                    </Stack>
                </Paper>

                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                    <Stack spacing={2}>
                        <Box>
                            <Typography variant="h5" fontWeight={800}>Cadastro de tecnico</Typography>
                            <Typography color="text.secondary">
                                Adicione novos tecnicos a uma equipe existente.
                            </Typography>
                        </Box>
                        <FieldAutoComplet
                            endpoint="tecnico/equipes"
                            obrigatorio
                            nome="Equipe"
                            aoAlterado={setTecnico0}
                            onInputValueChange={setTecnicoInput0}
                            valor={tecnico0}
                            inputValue={tecnicoInput0}
                        />
                        <TechnicianRows
                            rows={tecnicosAtualizar}
                            disabled={!tecnico0}
                            labelPrefix="Nome do tecnico"
                            onAdd={() => adicionarTecnico({ atualizar: true })}
                            onRemove={(index) => removerTecnico(index, true)}
                            onChange={(index, valor) => atualizarTecnico(index, valor, true)}
                        />
                        {!tecnico0 && (
                            <Alert severity="info">
                                Selecione uma equipe para liberar o cadastro de tecnicos.
                            </Alert>
                        )}
                        <Button
                            variant="contained"
                            startIcon={<PersonAddIcon />}
                            onClick={() => enviarDados({ atualizar: true })}
                            disabled={!tecnico0}
                            sx={{ alignSelf: "stretch" }}
                        >
                            Cadastrar tecnico
                        </Button>
                    </Stack>
                </Paper>
            </Box>
        </Box>
    );
};

export default CadastrosEquipes;
