import ClearIcon from "@mui/icons-material/Clear";
import EditIcon from "@mui/icons-material/DriveFileRenameOutline";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import {
    Alert,
    Box,
    Button,
    Chip,
    FormControlLabel,
    IconButton,
    MenuItem,
    Paper,
    Stack,
    Switch,
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
    COBRANCA_ACAO: {
        label: "Ações",
        title: "Ações da cobrança",
        field: "Ação",
        helper: "Opções exibidas no campo Ação do cadastro de cobrança.",
        suggestions: ["CONTATO", "SEM RETORNO", "PROMESSA DE PAGAMENTO", "ACORDO", "SEGUNDA VIA ENVIADA", "CONTESTACAO", "NEGATIVACAO", "PAGO"],
    },
    COBRANCA_STATUS: {
        label: "Status",
        title: "Status da cobrança",
        field: "Status",
        helper: "Opções exibidas no campo Status. Os status essenciais ficam protegidos por definirem a situação do atendimento.",
        suggestions: ["COBRANÇA EMITIDA", "PROMESSA DE PAGAMENTO", "SEM RETORNO", "PAGO", "CANCELADO"],
    },
};

const lockedBySegment = {
    COBRANCA_STATUS: new Set(["COBRANÇA EMITIDA", "PROMESSA DE PAGAMENTO", "SEM RETORNO", "PAGO", "CANCELADO"]),
};

const SettingsAtividades = ({ initialSegment = "ATIVIDADE", allowedSegments = ["ATIVIDADE", "LEAD", "COBRANCA"] }) => {
    const [evento, setEvento] = useState("");
    const [encerraAtendimento, setEncerraAtendimento] = useState(false);
    const [procedimentos, setProcedimentos] = useState([]);
    const [refresh, setRefresh] = useState(true);
    const [editData, setEditData] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [segmento, setSegmento] = useState(initialSegment);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [permitirFechamentoPorOutroUsuario, setPermitirFechamentoPorOutroUsuario] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const config = segments[segmento];
    const visibleSegments = allowedSegments.filter((key) => segments[key]);
    const isChargingSettings = visibleSegments.every((item) => item.startsWith("COBRANCA_"));

    useEffect(() => {
        if (!isChargingSettings) return;
        (async () => {
            try {
                const [configuracao, usuario] = await Promise.all([
                    api("cobrancas/configuracao"),
                    api("usuario/me"),
                ]);
                setPermitirFechamentoPorOutroUsuario(Boolean(configuracao?.permitirFechamentoPorOutroUsuario));
                setIsAdmin(usuario?.role === "ADMIN");
            } catch (err) {
                setError(err.message || "Erro ao carregar configuracao de permissao.");
            }
        })();
    }, [isChargingSettings]);

    const alterarPermissaoFechamento = async (habilitado) => {
        setError("");
        try {
            const configuracao = await api("cobrancas/configuracao", "PUT", {
                permitirFechamentoPorOutroUsuario: habilitado,
            });
            setPermitirFechamentoPorOutroUsuario(Boolean(configuracao?.permitirFechamentoPorOutroUsuario));
        } catch (err) {
            setError(err.message || "Erro ao salvar configuracao de permissao.");
        }
    };

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
                encerraAtendimento: segmento === "COBRANCA_STATUS" && encerraAtendimento,
            });
            setEvento("");
            setEncerraAtendimento(false);
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
                encerraAtendimento: segmento === "COBRANCA_STATUS" && Boolean(editData.encerraAtendimento),
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
            await Promise.all(pendentes.map((item) => api("evento", "POST", {
                evento: item,
                segmento,
                encerraAtendimento: segmento === "COBRANCA_STATUS" && ["PAGO", "CANCELADO"].includes(item),
            })));
            setRefresh((r) => !r);
        } catch (err) {
            console.error("Erro ao cadastrar sugestoes:", err);
            setError(err.message || "Erro ao adicionar sugestoes.");
        }
    };

    const isLocked = (item) => lockedBySegment[segmento]?.has(item.label);
    const pageTitle = visibleSegments.every((item) => item.startsWith("COBRANCA_"))
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

            {isChargingSettings && (
                <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                    <Typography variant="h6" fontWeight={800}>Permissão para fechamento</Typography>
                    <Typography color="text.secondary" variant="body2" sx={{ mb: 1 }}>
                        Por padrão, somente quem abriu a cobrança pode fechá-la ou marcá-la como paga. Administradores sempre podem concluir.
                    </Typography>
                    <FormControlLabel
                        control={(
                            <Switch
                                checked={permitirFechamentoPorOutroUsuario}
                                onChange={(event) => alterarPermissaoFechamento(event.target.checked)}
                                disabled={!isAdmin}
                            />
                        )}
                        label="Permitir que outros usuários fechem cobranças"
                    />
                    {!isAdmin && (
                        <Typography color="text.secondary" variant="caption" display="block">
                            Somente administradores podem alterar esta configuração.
                        </Typography>
                    )}
                </Paper>
            )}

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
                    {segmento === "COBRANCA_STATUS" && (
                        <TextField
                            select
                            label="Situação resultante"
                            value={encerraAtendimento ? "FECHADA" : "ABERTA"}
                            onChange={(event) => setEncerraAtendimento(event.target.value === "FECHADA")}
                            sx={{ minWidth: 230 }}
                        >
                            <MenuItem value="ABERTA">Permanece aberta</MenuItem>
                            <MenuItem value="FECHADA">Fecha o atendimento</MenuItem>
                        </TextField>
                    )}
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
                                {segmento === "COBRANCA_STATUS" && <TableCell>Situação resultante</TableCell>}
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
                                    {segmento === "COBRANCA_STATUS" && (
                                        <TableCell>
                                            <Chip
                                                size="small"
                                                color={item.encerraAtendimento ? "default" : "success"}
                                                variant="outlined"
                                                label={item.encerraAtendimento ? "Fecha o atendimento" : "Permanece aberta"}
                                            />
                                        </TableCell>
                                    )}
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
                                    <TableCell colSpan={segmento === "COBRANCA_STATUS" ? 4 : 3} align="center">Nenhuma opcao encontrada.</TableCell>
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
                            {segmento === "COBRANCA_STATUS" && (
                                <TextField
                                    select
                                    label="Situação resultante"
                                    value={editData.encerraAtendimento ? "FECHADA" : "ABERTA"}
                                    onChange={(event) => setEditData((prev) => ({
                                        ...prev,
                                        encerraAtendimento: event.target.value === "FECHADA",
                                    }))}
                                    fullWidth
                                >
                                    <MenuItem value="ABERTA">Permanece aberta</MenuItem>
                                    <MenuItem value="FECHADA">Fecha o atendimento</MenuItem>
                                </TextField>
                            )}
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
