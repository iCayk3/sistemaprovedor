import * as React from 'react';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Settings from '@mui/icons-material/Settings';
import Logout from '@mui/icons-material/Logout';
import DarkMode from '@mui/icons-material/DarkMode';
import LightMode from '@mui/icons-material/LightMode';
import { useNavigate } from 'react-router-dom';
import Api from '../../Services/Api';
import { useAuth } from '../AuthProvider';
import { useThemeMode } from '../ThemeModeProvider';

const UseApi = Api();

export default function AccountMenu() {
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = React.useState(null);
    const [userLogado, setUserLogado] = React.useState({});
    const { logout } = useAuth();
    const { isDark, toggleTheme } = useThemeMode();
    const open = Boolean(anchorEl);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    React.useEffect(() => {
        const user = localStorage.getItem("user");
        if (user) {
            setUserLogado(JSON.parse(user));
        } else {
            setUserLogado({});
        }
    }, []);

    const sair = async () => {
        console.log("Iniciando processo de logout completo...");

        try {
            // 1. Notifica o backend para invalidar o cookie HttpOnly
            await UseApi('usuario/logout', 'POST');
        } catch (error) {
            console.error('Falha ao contatar o servidor para logout:', error);
        } finally {
            // 2. Preserva a preferência de tema do usuário ao deslogar
            const savedTheme = localStorage.getItem('app-theme-mode') 
                || localStorage.getItem('toolpad-mode') 
                || localStorage.getItem('mui-mode');

            // 3. ATUALIZA O ESTADO GLOBAL DO FRONT-END
            logout();

            // 4. Limpa storage de sessão e usuário
            localStorage.clear();
            sessionStorage.clear();

            if (savedTheme) {
                localStorage.setItem('app-theme-mode', savedTheme);
                localStorage.setItem('toolpad-mode', savedTheme);
                localStorage.setItem('mui-mode', savedTheme);
                localStorage.setItem('toolpad-color-scheme', savedTheme);
                localStorage.setItem('mui-color-scheme', savedTheme);
            }

            // 5. Redireciona o usuário para a página de login
            navigate('/login', { replace: true });
        }
    };

    return (
        <React.Fragment>
            <Box sx={{ display: 'flex', alignItems: 'center', textAlign: 'center' }}>
                <Tooltip title="Account settings">
                    <IconButton
                        onClick={handleClick}
                        size="small"
                        sx={{ ml: 1, mb: 3 }}
                        aria-controls={open ? 'account-menu' : undefined}
                        aria-haspopup="true"
                        aria-expanded={open ? 'true' : undefined}
                    >
                        <Avatar sx={{ width: 32, height: 32 }}>{userLogado.usuario}</Avatar>
                    </IconButton>
                </Tooltip>
            </Box>
            <Menu
                anchorEl={anchorEl}
                id="account-menu"
                open={open}
                onClose={handleClose}
                onClick={handleClose}
                slotProps={{
                    paper: {
                        elevation: 0,
                        sx: {
                            overflow: 'visible',
                            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                            mt: 1.5,
                            '& .MuiAvatar-root': {
                                width: 32,
                                height: 32,
                                ml: -0.5,
                                mr: 1,
                            },
                            '&::before': {
                                content: '""',
                                display: 'block',
                                position: 'absolute',
                                top: 0,
                                right: 14,
                                width: 10,
                                height: 10,
                                bgcolor: 'background.paper',
                                transform: 'translateY(-50%) rotate(45deg)',
                                zIndex: 0,
                            },
                        },
                    },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                <MenuItem onClick={handleClose} sx={{ justifyContent: 'center', alignItems: 'center', m: 'auto', alignContent: 'center' }}>
                    <Avatar>{userLogado.usuario}</Avatar> 
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => { handleClose(); toggleTheme(); }}>
                    <ListItemIcon>
                        {isDark ? (
                            <LightMode fontSize="small" sx={{ color: '#facc15' }} />
                        ) : (
                            <DarkMode fontSize="small" sx={{ color: '#0f4c81' }} />
                        )}
                    </ListItemIcon>
                    {isDark ? 'Tema Claro' : 'Tema Escuro'}
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => navigate("/perfil/settings")}>
                    <ListItemIcon>
                        <Settings fontSize="small" />
                    </ListItemIcon>
                    Settings
                </MenuItem>
                <MenuItem onClick={() => sair()}>
                    <ListItemIcon>
                        <Logout fontSize="small" />
                    </ListItemIcon>
                    Logout
                </MenuItem>
            </Menu>
        </React.Fragment>
    );
}
