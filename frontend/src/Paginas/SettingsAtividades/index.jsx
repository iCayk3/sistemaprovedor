import ClearIcon from "@mui/icons-material/Clear";
import EditIcon from "@mui/icons-material/DriveFileRenameOutline";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import {
    Alert,
    Box,
    Button,
    Chip,
    IconButton,
    MenuItem,
    Paper,
    Stack,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tabs,
    TextField,
    Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { DialogAction } from "../../Componentes/DialogAction";
import TextoInput from "../../Componentes/TextoInput";
import Api from "../../Services/Api";

const api = Api();

const segments = {
    ATIVIDADE: {
        label: "Atividades",
        title: "Cadastro de evento",
        field: "Evento",
        helper: "Tipos usados no registro de atividades comerciais.",
        suggestions: ["LIGACAO", "WHATSAPP", "VISITA", "VENDA", "CANCELAMENTO"],
    },
    LEAD: {
        label: "Leads",
        title: "Cadastro de lead",
        field: "Origem / etapa",
        helper: "Cadastre origens e etapas para acompanhar leads.",
        suggestions: ["INDICACAO", "WHATSAPP", "INSTAGRAM", "SITE", "EM NEGOCIACAO", "CONVERTIDO", "PERDIDO"],
    },
    COBRANCA: {
        label: "Cobrancas",
        title: "Cadastro de cobranca",
        field: "Acao / status",
        helper: "Itens criticos da cobranca ficam bloqueados para manter o fluxo operacional consistente.",
        suggestions: ["ABERTO", "EM NEGOCIACAO", "PROMESSA DE PAGAMENTO", "FECHADO", "CONTATO REALIZADO", "SEM RETORNO", "ACORDO", "SEGUNDA VIA ENVIADA", "CONTESTACAO", "NEGATIVACAO", "PAGO"],
    },
};

const lockedBySegment = {
    COBRANCA: new Set(["ABERTO", "EM NEGOCIACAO", "PROMESSA DE PAGAMENTO", "FECHADO"]),
};

const SettingsAtividades = ({ initialSegment = "ATIVIDADE", allowedSegments = ["ATIVIDADE", "LEAD", "COBRANCA"] }) => {
    const [evento, setEvento] = useState("");
    const [procedimentos, setProcedimentos] = useState([]);
    const [refresh, setRefresh] = useState(true);
    const [editData, setEditData] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [segmento, setSegmento] = useState(initialSegment);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const config = segments[segmento];
    const visibleSegments = allowedSegments.filter((key) => segments[key]);

    useEffect(() => {
        if (!visibleSegments.includes(segmento)) {
            setSegmento(visibleSegments[0] || "ATIVIDADE");
        }
    }, [segmento, visibleSegments]);

    useEffect(() => {
        (async () => {
            setError("");
            try {
                const dados = await api(`evento?segmento=${segmento}`);
                setProcedimentos(Array.isArray(dados) ? dados : []);
            } catch (err) {
                console.error("Erro ao buscar procedimentos:", err);
                setError(err.message || "Erro ao carregar opcoes.");
            }
        })();
    }, [refresh, segmento]);

    const filteredItems = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return procedimentos;
        return procedimentos.filter((item) => String(item.label || "").toLowerCase().includes(query));
    }, [procedimentos, search]);

    const cadastrarEvento = async (e) => {
        e.preventDefault();
        if (!evento.trim()) return;
        setError("");
        try {
            await api("evento", "POST", {
                evento: evento.toUpperCase(),
                segmento,
            });
            setEvento("");
            setRefresh((r) => !r);
        } catch (err) {
            console.error("Erro ao cadastrar:", err);
            setError(err.message || "Erro ao cadastrar opcao.");
        }
    };

    const editarEvento = async () => {
        if (!editData) return;
        setError("");
        try {
            await api(`evento/${editData.id}`, "PUT", {
                evento: editData.label.toUpperCase(),
                segmento,
            });
            setEditData(null);
            setRefresh((r) => !r);
        } catch (err) {
            console.error("Erro ao editar:", err);
            setError(err.message || "Erro ao editar opcao.");
        }
    };

    const excluirEvento = async () => {
        setError("");
        try {
            await api(`evento/${deleteId}`, "DELETE");
            setDeleteId(null);
            setRefresh((r) => !r);
        } catch (err) {
            console.error("Erro ao excluir:", err);
            setError(err.message || "Erro ao excluir opcao.");
        }
    };

    const adicionarSugestoes = async () => {
        const existentes = new Set(procedimentos.map((item) => item.label));
        const pendentes = config.suggestions.filter((item) => !existentes.has(item));
        if (!pendentes.length) return;
        setError("");
        try {
            await Promise.all(pendentes.map((item) => api("evento", "POST", { evento: item, segmento })));
            setRefresh((r) => !r);
        } catch (err) {
            console.error("Erro ao cadastrar sugestoes:", err);
            setError(err.message || "Erro ao adicionar sugestoes.");
        }
    };

    const isLocked = (item) => lockedBySegment[segmento]?.has(item.label);
    const pageTitle = visibleSegments.length === 1 && visibleSegments[0] === "COBRANCA"
        ? "Configuracoes de cobranca"
        : "Configuracoes comerciais";

    return (
        <Box>
            <Paper variant="outlined" sx={{ p: 2.5, mb: 2, borderRadius: 2 }}>
                <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={2}>
                    <Box>
                        <Typography variant="h4" fontWeight={800}>{pageTitle}</Typography>
                        <Typography color="text.secondary">
                            Cadastre e mantenha as opcoes usadas pelos formularios e dashboards.
                        </Typography>
                    </Box>
                    <TextField
                        size="small"
                        label="Buscar opcao"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        sx={{ minWidth: { xs: "100%", md: 320 } }}
                    />
                </Stack>
                {visibleSegments.length > 1 && (
                    <Tabs value={segmento} onChange={(_, value) => setSegmento(value)} sx={{ mt: 2 }}>
                        {visibleSegments.map((key) => (
                            <Tab key={key} value={key} label={segments[key].label} />
                        ))}
                    </Tabs>
                )}
            </Paper>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Paper component="form" variant="outlined" onSubmit={cadastrarEvento} sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                <Typography variant="h6" fontWeight={800}>{config.title}</Typography>
                <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>{config.helper}</Typography>
                <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }}>
                    <TextField
                        label={config.field}
                        value={evento}
                        onChange={(event) => setEvento(event.target.value.toUpperCase())}
                        required
                        fullWidth
                    />
                    <Button type="submit" variant="contained" sx={{ minWidth: 140 }}>
                        Cadastrar
                    </Button>
                    <Button type="button" variant="outlined" onClick={adicionarSugestoes} sx={{ minWidth: 180 }}>
                        Adicionar sugestoes
                    </Button>
                </Stack>
            </Paper>

            <Paper variant="outlined" sx={{ borderRadius: 2 }}>
                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={2} sx={{ p: 2 }}>
                    <Box>
                        <Typography variant="h6" fontWeight={800}>{config.label}</Typography>
                        <Typography color="text.secondary" variant="body2">
                            {filteredItems.length} de {procedimentos.length} opcoes exibidas.
                        </Typography>
                    </Box>
                    <TextField
                        select
                        size="small"
                        label="Segmento"
                        value={segmento}
                        onChange={(event) => setSegmento(event.target.value)}
                        disabled={visibleSegments.length === 1}
                        sx={{ minWidth: 220 }}
                    >
                        {visibleSegments.map((key) => (
                            <MenuItem key={key} value={key}>{segments[key].label}</MenuItem>
                        ))}
                    </TextField>
                </Stack>

                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Opcao</TableCell>
                                <TableCell>Tipo</TableCell>
                                <TableCell align="right">Acoes</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredItems.map((item) => (
                                <TableRow key={item.id} hover>
                                    <TableCell>
                                        <Typography fontWeight={800}>{item.label}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        {isLocked(item) ? (
                                            <Chip size="small" icon={<LockRoundedIcon />} color="warning" variant="outlined" label="Obrigatorio" />
                                        ) : (
                                            <Chip size="small" variant="outlined" label="Customizavel" />
                                        )}
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            size="small"
                                            onClick={() => setEditData({ ...item })}
                                            disabled={isLocked(item)}
                                        >
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => setDeleteId(item.id)}
                                            disabled={isLocked(item)}
                                        >
                                            <ClearIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!filteredItems.length && (
                                <TableRow>
                                    <TableCell colSpan={3} align="center">Nenhuma opcao encontrada.</TableCell>
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
                    titulo="Editar opcao"
                    contexto={
                        <Stack spacing={2} sx={{ pt: 2, minWidth: 360 }}>
                            <TextoInput
                                labelProp={config.field}
                                aoAlterado={(e) => setEditData((prev) => ({ ...prev, label: e.target.value }))}
                                valor={editData.label}
                                obrigatorio
                                sx={{ width: "100%" }}
                            />
                        </Stack>
                    }
                    aoChamar={editarEvento}
                    aoFechar={() => setEditData(null)}
                    nomeAcao="Editar"
                />
            )}

            {deleteId && (
                <DialogAction
                    abrir
                    titulo="Excluir opcao"
                    contexto="Tem certeza que deseja excluir esta opcao?"
                    aoChamar={excluirEvento}
                    aoFechar={() => setDeleteId(null)}
                    nomeAcao="Excluir"
                />
            )}
        </Box>
    );
};

export default SettingsAtividades;
