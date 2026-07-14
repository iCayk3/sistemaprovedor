import ClearIcon from "@mui/icons-material/Clear";
import EditIcon from "@mui/icons-material/DriveFileRenameOutline";
import {
    Alert,
    Box,
    Button,
    Chip,
    IconButton,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { DialogAction } from "../../Componentes/DialogAction";
import TextoInput from "../../Componentes/TextoInput";
import Api from "../../Services/Api";

const api = Api();

const SettingsRegistros = () => {
    const [procedimento, setProcedimento] = useState("");
    const [cor, setCor] = useState("#4f46e5");
    const [procedimentos, setProcedimentos] = useState([]);
    const [refresh, setRefresh] = useState(true);
    const [editData, setEditData] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    useEffect(() => {
        (async () => {
            setError("");
            try {
                const dados = await api("procedimento");
                setProcedimentos(Array.isArray(dados) ? dados : []);
            } catch (err) {
                console.error("Erro ao buscar procedimentos:", err);
                setError(err.message || "Erro ao carregar procedimentos.");
            }
        })();
    }, [refresh]);

    const filteredProcedimentos = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return procedimentos;
        return procedimentos.filter((item) => String(item.label || "").toLowerCase().includes(query));
    }, [procedimentos, search]);

    const cadastrarProcedimento = async (e) => {
        e.preventDefault();
        if (!procedimento.trim()) return;
        setError("");
        try {
            await api("procedimento", "POST", {
                procedimento: procedimento.toUpperCase(),
                cor,
            });
            setProcedimento("");
            setCor("#4f46e5");
            setRefresh((r) => !r);
        } catch (err) {
            console.error("Erro ao cadastrar:", err);
            setError(err.message || "Erro ao cadastrar procedimento.");
        }
    };

    const editarProcedimento = async () => {
        if (!editData) return;
        setError("");
        try {
            await api(`procedimento/${editData.id}`, "PUT", {
                procedimento: editData.label.toUpperCase(),
                cor: editData.cor,
            });
            setEditData(null);
            setRefresh((r) => !r);
        } catch (err) {
            console.error("Erro ao editar:", err);
            setError(err.message || "Erro ao editar procedimento.");
        }
    };

    const excluirProcedimento = async () => {
        setError("");
        try {
            await api(`procedimento/${deleteId}`, "DELETE");
            setDeleteId(null);
            setRefresh((r) => !r);
        } catch (err) {
            console.error("Erro ao excluir:", err);
            setError(err.message || "Erro ao excluir procedimento.");
        }
    };

    return (
        <Box>
            <Paper variant="outlined" sx={{ p: 2.5, mb: 2, borderRadius: 2 }}>
                <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={2}>
                    <Box>
                        <Typography variant="h4" fontWeight={800}>Configuracoes registros</Typography>
                        <Typography color="text.secondary">
                            Cadastre e organize os procedimentos usados nos registros tecnicos.
                        </Typography>
                    </Box>
                    <TextField
                        size="small"
                        label="Buscar procedimento"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        sx={{ minWidth: { xs: "100%", md: 320 } }}
                    />
                </Stack>
            </Paper>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Paper component="form" variant="outlined" onSubmit={cadastrarProcedimento} sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                <Typography variant="h6" fontWeight={800}>Novo procedimento</Typography>
                <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
                    Defina o nome e a cor que serao usados nos filtros e graficos.
                </Typography>
                <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }}>
                    <TextField
                        label="Procedimento"
                        value={procedimento}
                        onChange={(event) => setProcedimento(event.target.value.toUpperCase())}
                        required
                        fullWidth
                    />
                    <TextField
                        label="Cor"
                        type="color"
                        value={cor}
                        onChange={(event) => setCor(event.target.value)}
                        required
                        sx={{ width: { xs: "100%", md: 180 } }}
                        InputLabelProps={{ shrink: true }}
                    />
                    <Button type="submit" variant="contained" sx={{ minWidth: 140 }}>
                        Cadastrar
                    </Button>
                </Stack>
            </Paper>

            <Paper variant="outlined" sx={{ borderRadius: 2 }}>
                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={2} sx={{ p: 2 }}>
                    <Box>
                        <Typography variant="h6" fontWeight={800}>Procedimentos</Typography>
                        <Typography color="text.secondary" variant="body2">
                            {filteredProcedimentos.length} de {procedimentos.length} procedimentos exibidos.
                        </Typography>
                    </Box>
                    <Chip label={`${procedimentos.length} cadastrados`} variant="outlined" />
                </Stack>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Procedimento</TableCell>
                                <TableCell>Cor</TableCell>
                                <TableCell align="right">Acoes</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredProcedimentos.map((item) => (
                                <TableRow key={item.id} hover>
                                    <TableCell>
                                        <Typography fontWeight={800}>{item.label}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <Box sx={{ width: 14, height: 14, borderRadius: "50%", bgcolor: item.cor, border: "1px solid", borderColor: "divider" }} />
                                            <Typography variant="body2" color="text.secondary">{item.cor}</Typography>
                                        </Stack>
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton size="small" onClick={() => setEditData({ ...item })}>
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton size="small" color="error" onClick={() => setDeleteId(item.id)}>
                                            <ClearIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!filteredProcedimentos.length && (
                                <TableRow>
                                    <TableCell colSpan={3} align="center">Nenhum procedimento encontrado.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {editData && (
                <DialogAction
                    abrir
                    entradas
                    titulo="Editar procedimento"
                    contexto={
                        <Stack spacing={2} sx={{ pt: 2, minWidth: 360 }}>
                            <TextoInput
                                labelProp="Procedimento"
                                aoAlterado={(e) => setEditData((prev) => ({ ...prev, label: e.target.value }))}
                                valor={editData.label}
                                obrigatorio
                                sx={{ width: "100%" }}
                            />
                            <TextoInput
                                labelProp="Cor"
                                aoAlterado={(e) => setEditData((prev) => ({ ...prev, cor: e.target.value }))}
                                valor={editData.cor}
                                obrigatorio
                                tipo="color"
                                sx={{ width: "100%" }}
                            />
                        </Stack>
                    }
                    aoChamar={editarProcedimento}
                    aoFechar={() => setEditData(null)}
                    nomeAcao="Editar"
                />
            )}

            {deleteId && (
                <DialogAction
                    abrir
                    titulo="Excluir procedimento"
                    contexto="Tem certeza que deseja excluir o procedimento?"
                    aoChamar={excluirProcedimento}
                    aoFechar={() => setDeleteId(null)}
                    nomeAcao="Excluir"
                />
            )}
        </Box>
    );
};

export default SettingsRegistros;
