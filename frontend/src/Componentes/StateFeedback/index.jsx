import { Box, Button, Paper, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";

const configMap = {
    denied: {
        icon: <LockOutlinedIcon sx={{ fontSize: 56, color: 'warning.main' }} />,
        titleDefault: 'Acesso Não Autorizado',
        descDefault: 'Seu perfil de usuário não possui as permissões necessárias para acessar este recurso.',
    },
    notfound: {
        icon: <SearchOffIcon sx={{ fontSize: 56, color: 'primary.main' }} />,
        titleDefault: 'Página Não Encontrada',
        descDefault: 'O endereço que você tentou acessar não existe ou foi movido.',
    },
    error: {
        icon: <ErrorOutlineIcon sx={{ fontSize: 56, color: 'error.main' }} />,
        titleDefault: 'Ocorreu um Erro',
        descDefault: 'Não foi possível carregar as informações desta seção. Tente novamente mais tarde.',
    },
    empty: {
        icon: <InboxOutlinedIcon sx={{ fontSize: 56, color: 'text.secondary' }} />,
        titleDefault: 'Nenhum Registro Encontrado',
        descDefault: 'Não há dados disponíveis para os filtros selecionados.',
    },
};

export default function StateFeedback({
    type = 'notfound',
    title,
    description,
    actionLabel = 'Voltar ao Dashboard',
    onAction,
}) {
    const navigate = useNavigate();
    const config = configMap[type] || configMap.notfound;

    const handleAction = () => {
        if (onAction) {
            onAction();
        } else {
            navigate('/dashboard');
        }
    };

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '60vh',
                p: 3,
            }}
        >
            <Paper
                variant="outlined"
                sx={{
                    maxWidth: 480,
                    width: '100%',
                    p: 4,
                    textAlign: 'center',
                    borderRadius: 3,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1.5,
                }}
            >
                <Box sx={{ mb: 1 }}>{config.icon}</Box>
                <Typography variant="h5" fontWeight={800} color="text.primary">
                    {title || config.titleDefault}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 380, mb: 2 }}>
                    {description || config.descDefault}
                </Typography>
                <Button
                    variant="contained"
                    onClick={handleAction}
                    sx={{
                        borderRadius: 2,
                        px: 3,
                        py: 1,
                        fontWeight: 700,
                        textTransform: 'none',
                    }}
                >
                    {actionLabel}
                </Button>
            </Paper>
        </Box>
    );
}
