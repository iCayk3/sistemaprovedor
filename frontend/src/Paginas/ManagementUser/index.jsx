import EditRoundedIcon from "@mui/icons-material/EditRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    IconButton,
    MenuItem,
    Paper,
    Select,
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
import Api from "../../Services/Api";

const UseApi = Api();

const statusOptions = ["TODOS", "PENDENTE", "ATIVO", "BLOQUEADO", "INATIVO"];
const rolesDisponiveis = [
    "ADMIN",
    "TECNICO",
    "COMERCIAL",
    "FINANCEIRO",
    "TECNICO_COMERCIAL",
    "TECNICO_FINANCEIRO",
    "COMERCIAL_FINANCEIRO",
    "COBRANCA",
    "GUEST",
];

const statusColors = {
    ATIVO: "success",
    PENDENTE: "warning",
    BLOQUEADO: "error",
    INATIVO: "default",
};

const ManagementUser = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [refresh, setRefresh] = useState(false);
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState(null);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("TODOS");
    const [editingRoleId, setEditingRoleId] = useState(null);
    const [selectedRole, setSelectedRole] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError("");
            try {
                const response = await UseApi("usuario");
                setUsuarios(Array.isArray(response) ? response : []);
            } catch (requestError) {
                console.error("Erro ao buscar usuarios:", requestError);
                setError(requestError.message || "Erro ao carregar usuarios.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [refresh]);

    const counters = useMemo(() => {
        return statusOptions.reduce((acc, status) => {
            if (status === "TODOS") {
                acc[status] = usuarios.length;
            } else {
                acc[status] = usuarios.filter((user) => user.status === status).length;
            }
            return acc;
        }, {});
    }, [usuarios]);

    const filteredUsers = useMemo(() => {
        const query = search.trim().toLowerCase();
        return usuarios
            .filter((user) => statusFilter === "TODOS" || user.status === statusFilter)
            .filter((user) => {
                if (!query) return true;
                return [user.usuario, user.role, user.status]
                    .some((value) => String(value || "").toLowerCase().includes(query));
            })
            .sort((a, b) => String(a.usuario).localeCompare(String(b.usuario)));
    }, [usuarios, search, statusFilter]);

    const alterarStatus = async (id, status) => {
        setSavingId(id);
        setError("");
        try {
            await UseApi("usuario/statuschange", "PUT", { id, status });
            setRefresh((current) => !current);
        } catch (requestError) {
            console.error("Erro ao alterar status:", requestError);
            setError(requestError.message || "Erro ao alterar status do usuario.");
        } finally {
            setSavingId(null);
        }
    };

    const alterarPermissao = async (id, role) => {
        setSavingId(id);
        setError("");
        try {
            await UseApi("usuario/levelchange", "PUT", { id, role });
            setEditingRoleId(null);
            setRefresh((current) => !current);
        } catch (requestError) {
            console.error("Erro ao alterar permissao:", requestError);
            setError(requestError.message || "Erro ao alterar permissao do usuario.");
        } finally {
            setSavingId(null);
        }
    };

    const startRoleEdit = (user) => {
        setEditingRoleId(user.id);
        setSelectedRole(user.role || "GUEST");
    };

    const actionButtons = (user) => {
        if (user.status === "ATIVO") {
            return (
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button size="small" variant="outlined" color="warning" disabled={savingId === user.id} onClick={() => alterarStatus(user.id, "BLOQUEADO")}>
                        Bloquear
                    </Button>
                    <Button size="small" variant="outlined" color="error" disabled={savingId === user.id} onClick={() => alterarStatus(user.id, "INATIVO")}>
                        Inativar
                    </Button>
                </Stack>
            );
        }

        return (
            <Button size="small" variant="contained" disabled={savingId === user.id} onClick={() => alterarStatus(user.id, "ATIVO")}>
                Ativar
            </Button>
        );
    };

    if (loading) {
        return (
            <Stack alignItems="center" py={6}>
                <CircularProgress />
            </Stack>
        );
    }

    return (
        <Box>
            <Paper variant="outlined" sx={{ p: 2.5, mb: 2, borderRadius: 2 }}>
                <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={2}>
                    <Box>
                        <Typography variant="h4" fontWeight={800}>Gerenciar usuarios</Typography>
                        <Typography color="text.secondary">
                            Controle de permissao e situacao dos acessos ao sistema.
                        </Typography>
                    </Box>
                    <TextField
                        size="small"
                        label="Buscar usuario"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        sx={{ minWidth: { xs: "100%", md: 320 } }}
                    />
                </Stack>
            </Paper>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Box
                sx={{
                    display: "grid",
                    gap: 1.5,
                    gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(5, minmax(0, 1fr))" },
                    mb: 2,
                }}
            >
                {statusOptions.map((status) => (
                    <Paper
                        key={status}
                        variant="outlined"
                        onClick={() => setStatusFilter(status)}
                        sx={{
                            p: 2,
                            borderRadius: 2,
                            cursor: "pointer",
                            borderColor: statusFilter === status ? "primary.main" : "divider",
                            bgcolor: statusFilter === status ? "action.selected" : "background.paper",
                        }}
                    >
                        <Typography variant="caption" color="text.secondary">{status === "TODOS" ? "Usuarios" : status}</Typography>
                        <Typography variant="h5" fontWeight={800}>{counters[status] || 0}</Typography>
                    </Paper>
                ))}
            </Box>

            <Paper variant="outlined" sx={{ borderRadius: 2 }}>
                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} gap={2} sx={{ p: 2 }}>
                    <Box>
                        <Typography variant="h6" fontWeight={800}>Usuarios</Typography>
                        <Typography variant="body2" color="text.secondary">
                            {filteredUsers.length} de {usuarios.length} usuarios exibidos.
                        </Typography>
                    </Box>
                    <TextField
                        select
                        size="small"
                        label="Status"
                        value={statusFilter}
                        onChange={(event) => setStatusFilter(event.target.value)}
                        sx={{ minWidth: 220 }}
                    >
                        {statusOptions.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
                    </TextField>
                </Stack>

                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Usuario</TableCell>
                                <TableCell>Permissao</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell align="right">Acoes</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredUsers.map((user) => (
                                <TableRow key={user.id} hover>
                                    <TableCell>
                                        <Typography fontWeight={800}>{user.usuario}</Typography>
                                        <Typography variant="caption" color="text.secondary">ID {user.id}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        {editingRoleId === user.id ? (
                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                <Select
                                                    value={selectedRole}
                                                    onChange={(event) => setSelectedRole(event.target.value)}
                                                    size="small"
                                                >
                                                    {rolesDisponiveis.map((role) => (
                                                        <MenuItem key={role} value={role}>{role}</MenuItem>
                                                    ))}
                                                </Select>
                                                <IconButton size="small" color="primary" disabled={savingId === user.id} onClick={() => alterarPermissao(user.id, selectedRole)}>
                                                    <SaveRoundedIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton size="small" onClick={() => setEditingRoleId(null)}>
                                                    <CloseRoundedIcon fontSize="small" />
                                                </IconButton>
                                            </Stack>
                                        ) : (
                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                <Chip size="small" variant="outlined" label={user.role || "GUEST"} />
                                                <IconButton size="small" onClick={() => startRoleEdit(user)}>
                                                    <EditRoundedIcon fontSize="small" />
                                                </IconButton>
                                            </Stack>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Chip size="small" color={statusColors[user.status] || "default"} label={user.status} />
                                    </TableCell>
                                    <TableCell align="right">{actionButtons(user)}</TableCell>
                                </TableRow>
                            ))}
                            {!filteredUsers.length && (
                                <TableRow>
                                    <TableCell colSpan={4} align="center">
                                        Nenhum usuario encontrado com os filtros atuais.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
};

export default ManagementUser;
