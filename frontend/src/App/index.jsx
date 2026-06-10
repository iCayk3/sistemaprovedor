import * as React from 'react';
import { createTheme } from '@mui/material/styles';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BarChartIcon from '@mui/icons-material/BarChart';
import DescriptionIcon from '@mui/icons-material/Description';
import { DashboardLayout } from '@toolpad/core/DashboardLayout';
import { PageContainer } from '@toolpad/core/PageContainer';
import Inicio from "../Paginas/Inicio";
import DashboardPrincipal from "../Paginas/DashboardPrincipal";
import OverviewRegistro from "../Paginas/OverviewRegistro";
import MapIcon from '@mui/icons-material/Map';
import MapPage from "../Paginas/MapPage";
import SettingsApplicationsIcon from '@mui/icons-material/SettingsApplications';
import FiberNewIcon from '@mui/icons-material/FiberNew';
import Financeiro from '../Paginas/Financeiro';
import Inadiplentes from '../Paginas/Inadiplentes';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import PaymentOutlinedIcon from '@mui/icons-material/PaymentOutlined';
import MoneyOffOutlinedIcon from '@mui/icons-material/MoneyOffOutlined';
import SavingsOutlinedIcon from '@mui/icons-material/SavingsOutlined';
import Suspensos from '../Paginas/Suspensos';
import CadastroEquipamento from '../Paginas/CadastroEquipamento';
import ListeCto from '../Paginas/ListeCto';
import EquipesTecnicas from '../Paginas/EquipesTecnicas';
import SettingsRegistros from '../Paginas/SettingsRegistros';
import Groups2Icon from '@mui/icons-material/Groups2';
import PropTypes from 'prop-types';
import { Box, Typography } from '@mui/material';
import AtividadesComercial from '../Paginas/AtividadesComercial';
import DashBoardsComercial from '../Paginas/DashBoardsComercial';
import AccountMenu from '../Componentes/AccountMenu';
import { ReactRouterAppProvider } from '@toolpad/core/react-router';
import { Navigate, Route, Routes } from 'react-router-dom';
import SettingsPerfil from '../Paginas/SettingsPerfil';
import UsuariosNAtivos from '../Paginas/UsuariosNAtivos';
import ManagementUser from '../Paginas/ManagementUser';
import Api from '../Services/Api';
import SettingsAtividades from '../Paginas/SettingsAtividades';
import PendentPass from '../Paginas/PendentPass';

const theme = createTheme({
    colorSchemes: { light: true, dark: true },
    cssVariables: {
        colorSchemeSelector: 'class',
    },
    components: {
        MuiContainer: {
            defaultProps: {
                maxWidth: false,
            },
            styleOverrides: {
                root: {
                    maxWidth: '100% !important',
                    width: '90%',
                },
            },
        },
    },
});

function SidebarFooter({ mini }) {
    return (
        <Box
            sx={{
                mt: 'auto',
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
            }}
        >
            <AccountMenu />
            <Typography
                variant="caption"
                sx={{ mt: 1, whiteSpace: 'nowrap', overflow: 'hidden', textAlign: 'center' }}
            >
                {mini ? '© SOL' : '© SOL PROVEDOR DE INTERNET | 2.1'}
            </Typography>
        </Box>
    );
}

SidebarFooter.propTypes = {
    mini: PropTypes.bool.isRequired,
};

const UseApi = Api();
const roleGroups = {
    technical: ['ADMIN', 'TECNICO', 'TECNICO_COMERCIAL', 'TECNICO_FINANCEIRO'],
    commercial: ['ADMIN', 'COMERCIAL', 'TECNICO_COMERCIAL', 'COMERCIAL_FINANCEIRO'],
    financial: ['ADMIN', 'FINANCEIRO', 'TECNICO_FINANCEIRO', 'COMERCIAL_FINANCEIRO'],
    admin: ['ADMIN'],
};

const Menu = () => {
    const [user, setUser] = React.useState({});
    const semPermissao = <div>Sem permissao</div>;

    const hasRole = React.useCallback(
        (group) => roleGroups[group]?.includes(user.role),
        [user.role],
    );

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await UseApi(`usuario/me`);
                setUser(response);
            } catch (error) {
                console.error('Erro ao buscar dados:', error);
            }
        };
        fetchData();
    }, []);

    const NAVIGATION = [
        {
            kind: 'header',
            title: 'Menu principal',
        },
        {
            segment: 'dashboard',
            title: 'Dashboard principal',
            icon: <DashboardIcon />,
        },
        {
            kind: 'divider',
        },
        {
            kind: 'header',
            title: 'Registros',
        },
        hasRole('technical')
            ? {
                segment: 'registro',
                title: 'Registro de servico',
                icon: <BarChartIcon />,
                children: [
                    {
                        segment: 'registrar',
                        title: 'Registrar',
                        icon: <DescriptionIcon />,
                    },
                    {
                        segment: 'dashboard-registro',
                        title: 'Overview de registros',
                        icon: <DescriptionIcon />,
                    },
                    {
                        segment: 'settings',
                        title: 'Configuracoes registros',
                        icon: <DescriptionIcon />,
                    },
                ],
            } : null,
        hasRole('technical')
            ? {
                segment: 'redes',
                title: 'Redes',
                icon: <SettingsApplicationsIcon />,
                children: [
                    {
                        segment: 'equipamento',
                        title: 'Cadastro equipamento',
                        icon: <FiberNewIcon />,
                    },
                    {
                        segment: 'ctos',
                        title: 'Listar CTOs',
                        icon: <FiberNewIcon />,
                    },
                    {
                        segment: 'tecnico',
                        title: 'Equipes tecnicas',
                        icon: <Groups2Icon />,
                    },
                ],
            } : null,
        hasRole('technical')
            ? {
                segment: 'map',
                title: 'Mapa de CTOs',
                icon: <MapIcon />,
            } : null,
        hasRole('commercial')
            ? {
                segment: 'comercial',
                title: 'Comercial',
                icon: <SettingsApplicationsIcon />,
                children: [
                    {
                        segment: 'atividades',
                        title: 'Registros de atividades',
                        icon: <FiberNewIcon />,
                    },
                    {
                        segment: 'dashboards',
                        title: 'Dashboards',
                        icon: <FiberNewIcon />,
                    },
                    {
                        segment: 'configuration',
                        title: 'Configuracoes',
                        icon: <Groups2Icon />,
                    },
                ],
            } : null,
        hasRole('financial')
            ? {
                segment: 'financeiro',
                title: 'Consultar dados financeiro',
                icon: <MonetizationOnIcon />,
                children: [
                    {
                        segment: 'dados',
                        title: 'Dados financeiro',
                        icon: <SavingsOutlinedIcon />,
                    },
                    {
                        segment: 'cobranca',
                        title: 'Dados cobranca',
                        icon: <PaymentOutlinedIcon />,
                        children: [
                            {
                                segment: 'bloqueados',
                                title: 'Clientes bloqueados',
                                icon: <MoneyOffOutlinedIcon />,
                            },
                            {
                                segment: 'suspenso',
                                title: 'Clientes suspenso',
                                icon: <MoneyOffOutlinedIcon />,
                            },
                        ],
                    },
                ],
            } : null,
        hasRole('admin')
            ? {
                segment: 'settinguser',
                title: 'Configuracoes usuarios',
                icon: <BarChartIcon />,
                children: [
                    {
                        segment: 'ativar',
                        title: 'Ativar usuarios',
                        icon: <DescriptionIcon />,
                    },
                    {
                        segment: 'management',
                        title: 'Gerenciar usuarios',
                        icon: <DescriptionIcon />,
                    },
                    {
                        segment: 'pendentpass',
                        title: 'Redefinicoes pendentes',
                        icon: <DescriptionIcon />,
                    },
                ],
            } : null,
    ].filter(Boolean);

    const DashboardView = () => {
        if (hasRole('technical')) return <DashboardPrincipal />;
        if (hasRole('commercial')) return <DashBoardsComercial />;
        if (hasRole('financial')) return <Financeiro />;
        return <div>Sem permissao</div>;
    };

    return (
        <ReactRouterAppProvider
            navigation={NAVIGATION}
            branding={{
                logo: <img src={null} alt="" />,
                title: 'SOL PROVEDOR DE INTERNET',
            }}
            theme={theme}
        >
            <DashboardLayout
                defaultSidebarCollapsed
                slots={{
                    sidebarFooter: SidebarFooter,
                }}
            >
                <PageContainer>
                    <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="dashboard" element={<DashboardView />} />
                        <Route path="registro/registrar" element={hasRole('technical') ? <Inicio /> : semPermissao} />
                        <Route path="registro/dashboard-registro" element={hasRole('technical') ? <OverviewRegistro /> : semPermissao} />
                        <Route path="registro/settings" element={hasRole('technical') ? <SettingsRegistros /> : semPermissao} />
                        <Route path="redes/ctos" element={hasRole('technical') ? <ListeCto /> : semPermissao} />
                        <Route path="redes/equipamento" element={hasRole('technical') ? <CadastroEquipamento /> : semPermissao} />
                        <Route path="redes/tecnico" element={hasRole('technical') ? <EquipesTecnicas /> : semPermissao} />
                        <Route path="map" element={hasRole('technical') ? <MapPage /> : semPermissao} />
                        <Route path="comercial/atividades" element={hasRole('commercial') ? <AtividadesComercial /> : semPermissao} />
                        <Route path="comercial/dashboards" element={hasRole('commercial') ? <DashBoardsComercial /> : semPermissao} />
                        <Route path="comercial/configuration" element={hasRole('commercial') ? <SettingsAtividades /> : semPermissao} />
                        <Route path="perfil/settings" element={<SettingsPerfil />} />
                        <Route path="/financeiro/dados" element={hasRole('financial') ? <Financeiro /> : semPermissao} />
                        <Route path="/financeiro/cobranca/bloqueados" element={hasRole('financial') ? <Inadiplentes /> : semPermissao} />
                        <Route path="/financeiro/cobranca/suspenso" element={hasRole('financial') ? <Suspensos /> : semPermissao} />
                        <Route path="/settinguser/ativar" element={hasRole('admin') ? <UsuariosNAtivos /> : semPermissao} />
                        <Route path="/settinguser/management" element={hasRole('admin') ? <ManagementUser /> : semPermissao} />
                        <Route path="/settinguser/pendentpass" element={hasRole('admin') ? <PendentPass /> : semPermissao} />
                        <Route path="*" element={<div>Pagina nao encontrada</div>} />
                    </Routes>
                </PageContainer>
            </DashboardLayout>
        </ReactRouterAppProvider>
    );
}

export default Menu
