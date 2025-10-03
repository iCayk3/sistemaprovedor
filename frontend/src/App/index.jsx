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
import PeopleIcon from '@mui/icons-material/People';
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

//Configurações do tema
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
                mt: 'auto', // Move para o final
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
                {mini ? '© SOL' : `© SOL PROVEDOR DE INTERNET | 2.1`}
            </Typography>
        </Box>
    );
}

SidebarFooter.propTypes = {
    mini: PropTypes.bool.isRequired,
};

const UseApi = Api()

const Menu = () => {

    const [user, setUser] = React.useState({})

    const semPermissao = <div>Sem permissao</div>

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
    }, [])

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
        user.role === 'ADMIN' || user.role === 'TECNICO'
            ? {
                segment: 'registro',
                title: 'Registro de serviço',
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
                        title: 'Configurações registros',
                        icon: <DescriptionIcon />,
                    },
                ],
            } : null,
        // {
        //     segment: 'manutencao',
        //     title: 'Registro de manutenção',
        //     icon: <BarChartIcon />,
        //     children: [
        //         {
        //             segment: 'manutencao',
        //             title: 'Registrar',
        //             icon: <DescriptionIcon />,
        //         },
        //         {
        //             segment: 'dashboard-registro',
        //             title: 'Overview de registros',
        //             icon: <DescriptionIcon />,
        //         },
        //     ],
        // },
        user.role === 'ADMIN' || user.role === 'TECNICO'
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
        user.role === 'ADMIN' || user.role === 'TECNICO'
            ? {
                segment: 'map',
                title: 'Mapa de CTOs',
                icon: <MapIcon />,
            } : null,
        user.role === 'ADMIN' || user.role === 'COMERCIAL'
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
                        title: 'Configurações',
                        icon: <Groups2Icon />,
                    },
                ],
            } : null,
        user.role === 'ADMIN' || user.role === 'FINANCEIRO'
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
                        title: 'Dados cobrança',
                        icon: <PaymentOutlinedIcon />,
                        children: [
                            {
                                segment: 'inadiplentes',
                                title: 'Clientes inadiplentes',
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
        user.role === 'ADMIN'
            ? {
                segment: 'settinguser',
                title: 'Configurações usuarios',
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
                ],
            } : null,
    ].filter(Boolean);

    const DashboardView = () => {
        if (user.role === 'ADMIN' || user.role === 'TECNICO') return <DashboardPrincipal />;
        if (user.role === 'COMERCIAL') return <DashBoardsComercial />;
        if (user.role === 'FINANCEIRO') return <Financeiro />;
        return <div>Sem permissão</div>;
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
                    {/* Roteador interno para as páginas privadas */}
                    <Routes>
                        {/* Redireciona a rota raiz ("/") para a página inicial do dashboard */}
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />

                        {/* O "path" aqui deve corresponder ao "segment" definido no NAVIGATION */}

                        <Route path="dashboard" element={<DashboardView />} />
                        <Route path="registro/registrar" element={user.role === 'ADMIN' || user.role === 'TECNICO' ? <Inicio /> : semPermissao} />
                        <Route path="registro/dashboard-registro" element={user.role === 'ADMIN' || user.role === 'TECNICO' ? <OverviewRegistro /> : semPermissao} />
                        <Route path="registro/settings" element={user.role === 'ADMIN' || user.role === 'TECNICO' ? <SettingsRegistros /> : semPermissao} />
                        <Route path="redes/ctos" element={user.role === 'ADMIN' || user.role === 'TECNICO' ? <ListeCto /> : semPermissao} />
                        <Route path="redes/equipamento" element={user.role === 'ADMIN' || user.role === 'TECNICO' ? <CadastroEquipamento /> : semPermissao} />
                        <Route path="redes/tecnico" element={user.role === 'ADMIN' || user.role === 'TECNICO' ? <EquipesTecnicas /> : semPermissao} />
                        <Route path="map" element={user.role === 'ADMIN' || user.role === 'TECNICO' ? <MapPage /> : semPermissao} />
                        <Route path="comercial/atividades" element={user.role === 'ADMIN' || user.role === 'COMERCIAL' ? <AtividadesComercial /> : semPermissao} />
                        <Route path="comercial/dashboards" element={user.role === 'ADMIN' || user.role === 'COMERCIAL' ? <DashBoardsComercial /> : semPermissao} />
                        <Route path="comercial/configuration" element={user.role === 'ADMIN' || user.role === 'COMERCIAL' ? <SettingsAtividades /> : semPermissao} />
                        <Route path="perfil/settings" element={<SettingsPerfil />} />
                        <Route path="/financeiro/dados" element={user.role === 'ADMIN' || user.role === 'FINANCEIRO' ? <Financeiro /> : semPermissao} />
                        <Route path="/financeiro/cobranca/inadiplentes" element={user.role === 'ADMIN' || user.role === 'FINANCEIRO' ? <Inadiplentes /> : semPermissao} />
                        <Route path="/financeiro/cobranca/suspenso" element={user.role === 'ADMIN' || user.role === 'FINANCEIRO' ? <Suspensos /> : semPermissao} />
                        <Route path="/settinguser/ativar" element={user.role === 'ADMIN' ? <UsuariosNAtivos /> : semPermissao} />
                        <Route path="/settinguser/management" element={user.role === 'ADMIN' ? <ManagementUser /> : semPermissao} />

                        {/* Rota "catch-all" para páginas não encontradas dentro do app */}
                        <Route path="*" element={<div>Página não encontrada</div>} />
                    </Routes>
                </PageContainer>
            </DashboardLayout>
        </ReactRouterAppProvider>
    );
}

export default Menu