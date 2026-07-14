import { Box, Button, Paper, Typography, IconButton, Select, MenuItem } from "@mui/material"
import EditIcon from '@mui/icons-material/Edit';
import { useState } from "react";

const UserGroup = ({ usuarios, onChagen, statu, onRoleChange }) => {
    const [editingRoleId, setEditingRoleId] = useState(null);
    const [selectedRole, setSelectedRole] = useState("");

    const rolesDisponiveis = ['ADMIN', 'TECNICO', 'COMERCIAL', 'FINANCEIRO', 'GUEST'];

    const handleEditClick = (id, roleAtual) => {
        setEditingRoleId(id);
        setSelectedRole(roleAtual);
    };

    const handleSaveRole = (id) => {
        onRoleChange(id, selectedRole);
        setEditingRoleId(null);
    };

    return (
        usuarios.length > 0 && <section>
            <Typography variant="h5" gutterBottom sx={{ marginTop: 2 }}>usuarios {statu}</Typography>
            <Box sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: {
                    xs: '1fr',
                    md: 'repeat(2, minmax(0, 1fr))',
                    xl: 'repeat(4, minmax(0, 1fr))',
                },
            }}>
                {usuarios.map((dados) => (
                    <Paper elevation={3} sx={{ padding: 4, maxWidth: 400, width: '100%' }} key={dados.id}>
                        <Typography variant="h5" gutterBottom>usuario: {dados.usuario}</Typography>

                        {editingRoleId === dados.id ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <Select
                                    value={selectedRole}
                                    onChange={(e) => setSelectedRole(e.target.value)}
                                    size="small"
                                >
                                    {rolesDisponiveis.map((role) => (
                                        <MenuItem key={role} value={role}>{role}</MenuItem>
                                    ))}
                                </Select>
                                <Button variant="contained" size="small" onClick={() => handleSaveRole(dados.id)}>
                                    Salvar
                                </Button>
                                <Button variant="outlined" size="small" onClick={() => setEditingRoleId(null)}>
                                    Cancelar
                                </Button>
                            </Box>
                        ) : (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <Typography variant="h6">permissao: {dados.role}</Typography>
                                <IconButton onClick={() => handleEditClick(dados.id, dados.role)} size="large">
                                    <EditIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        )}

                        {dados.status === 'ATIVO' ? (
                            <>
                                <Typography variant="h5" gutterBottom>STATUS: {dados.status}</Typography>
                                <Typography variant="subtitle1" gutterBottom>Clica abaixo para alterar o status</Typography>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <Button
                                        variant="outlined"
                                        color="info"
                                        size="small"
                                        fullWidth
                                        sx={{ my: 2 }}
                                        onClick={() => onChagen(dados.id, 'BLOQUEADO')}
                                    >
                                        BLOQUEAR
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        color="info"
                                        size="small"
                                        fullWidth
                                        sx={{ my: 2 }}
                                        onClick={() => onChagen(dados.id, 'INATIVO')}
                                    >
                                        INATIVAR
                                    </Button>
                                </Box>
                            </>
                        ) : (
                            <>
                                <Typography variant="subtitle1" gutterBottom>Clica abaixo para alterar o status</Typography>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <Button
                                        variant="outlined"
                                        color="info"
                                        size="small"
                                        fullWidth
                                        sx={{ my: 2 }}
                                        onClick={() => onChagen(dados.id, 'ATIVO')}
                                    >
                                        ATIVAR
                                    </Button>
                                </Box>
                            </>
                        )}
                    </Paper>
                ))}
            </Box>
        </section>
    );
};

export default UserGroup;
