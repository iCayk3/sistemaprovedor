import * as React from 'react';

import DashboardIcon from '@mui/icons-material/Dashboard';
import BarChartIcon from '@mui/icons-material/BarChart';
import DescriptionIcon from '@mui/icons-material/Description';
import { DashboardLayout } from '@toolpad/core/DashboardLayout';
import { PageContainer } from '@toolpad/core/PageContainer';
import MapIcon from '@mui/icons-material/Map';
import SettingsApplicationsIcon from '@mui/icons-material/SettingsApplications';
import FiberNewIcon from '@mui/icons-material/FiberNew';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import PaymentOutlinedIcon from '@mui/icons-material/PaymentOutlined';
import MoneyOffOutlinedIcon from '@mui/icons-material/MoneyOffOutlined';
import SavingsOutlinedIcon from '@mui/icons-material/SavingsOutlined';
import RequestQuoteOutlinedIcon from '@mui/icons-material/RequestQuoteOutlined';
import Groups2Icon from '@mui/icons-material/Groups2';
import EventNoteIcon from '@mui/icons-material/EventNote';
import ChatOutlinedIcon from '@mui/icons-material/ChatOutlined';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import TableChartIcon from '@mui/icons-material/TableChart';
import PropTypes from 'prop-types';
import { Alert, Badge, Box, Button, CircularProgress, MenuItem, Paper, Snackbar, Stack, TextField, Typography } from '@mui/material';
import AccountMenu from '../Componentes/AccountMenu';
import { ReactRouterAppProvider } from '@toolpad/core/react-router';
import { Navigate, Route, Routes } from 'react-router-dom';
import Api from '../Services/Api';
import { dashboardHeaderInputSx, dashboardHeaderSx } from '../Utils/DashboardTheme';
import AssistenteIa from '../Componentes/AssistenteIa';
import StateFeedback from '../Componentes/StateFeedback';
import { appTheme } from '../Utils/appTheme';
import { ThemeToggleButton } from '../Componentes/ThemeModeProvider';

// Code Splitting - Lazy Loaded Pages
const Inicio = React.lazy(() => import("../Paginas/Inicio"));
const DashboardPrincipal = React.lazy(() => import("../Paginas/DashboardPrincipal"));
const OverviewRegistro = React.lazy(() => import("../Paginas/OverviewRegistro"));
const MapPage = React.lazy(() => import("../Paginas/MapPage"));
const Financeiro = React.lazy(() => import('../Paginas/Financeiro'));
const Inadiplentes = React.lazy(() => import('../Paginas/Inadiplentes'));
const Suspensos = React.lazy(() => import('../Paginas/Suspensos'));
const CadastroEquipamento = React.lazy(() => import('../Paginas/CadastroEquipamento'));
const ListeCto = React.lazy(() => import('../Paginas/ListeCto'));
const EquipesTecnicas = React.lazy(() => import('../Paginas/EquipesTecnicas'));
const SettingsRegistros = React.lazy(() => import('../Paginas/SettingsRegistros'));
const AtividadesComercial = React.lazy(() => import('../Paginas/AtividadesComercial'));
const DashBoardsComercial = React.lazy(() => import('../Paginas/DashBoardsComercial'));
const SettingsPerfil = React.lazy(() => import('../Paginas/SettingsPerfil'));
const UsuariosNAtivos = React.lazy(() => import('../Paginas/UsuariosNAtivos'));
const ManagementUser = React.lazy(() => import('../Paginas/ManagementUser'));
const SettingsAtividades = React.lazy(() => import('../Paginas/SettingsAtividades'));
const PendentPass = React.lazy(() => import('../Paginas/PendentPass'));
const DashboardClientes = React.lazy(() => import('../Paginas/DashboardClientes'));
const AcpEventos = React.lazy(() => import('../Paginas/AcpEventos'));
const Cobrancas = React.lazy(() => import('../Paginas/Cobrancas'));
const PainelCobrancaGerencial = React.lazy(() => import('../Paginas/PainelCobrancaGerencial'));
const ChatInterno = React.lazy(() => import('../Paginas/ChatInterno'));
const WhatsAppChat = React.lazy(() => import('../Paginas/WhatsAppChat'));
const ConfiguracaoWhatsApp = React.lazy(() => import('../Paginas/ConfiguracaoWhatsApp'));
const AuditoriaIp = React.lazy(() => import('../Paginas/AuditoriaIp'));
const RelatorioClientesPlanoCidade = React.lazy(() => import('../Paginas/RelatorioClientesPlanoCidade'));

function ToolbarActions() {
    return (
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mr: 1 }}>
            <ThemeToggleButton />
        </Stack>
    );
}

const theme = appTheme;

/* theme original substituido por appTheme
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
*/

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
                {mini ? 'Â© SOL' : 'Â© SOL PROVEDOR DE INTERNET | 2.1'}
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
    charging: ['ADMIN', 'FINANCEIRO', 'TECNICO_FINANCEIRO', 'COMERCIAL_FINANCEIRO', 'COBRANCA'],
    admin: ['ADMIN'],
};

const Menu = () => {
    const [user, setUser] = React.useState({});
    const [chatNaoLidas, setChatNaoLidas] = React.useState(0);
    const [avisoChat, setAvisoChat] = React.useState(false);
    const [cobrancasSemAtualizacao, setCobrancasSemAtualizacao] = React.useState(0);
    const [avisoCobrancas, setAvisoCobrancas] = React.useState(false);
    const [encerramentosAutomaticos, setEncerramentosAutomaticos] = React.useState([]);
    const naoLidasAnteriores = React.useRef(0);
    const semPermissao = <StateFeedback type="denied" />;

    const hasRole = React.useCallback(
        (group) => roleGroups[group]?.includes(user.role),
        [user.role],
    );
    const isChargingOnly = user.role === 'COBRANCA';
    const temAcessoIaChat = Boolean(user.recursosIaChatHabilitados);

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

    const atualizarNotificacoesChat = React.useCallback(async (totalInformado) => {
        try {
            const total = typeof totalInformado === 'number'
                ? totalInformado
                : (await Promise.all([
                    UseApi('chat/notificacoes'),
                    UseApi('integracoes/whatsapp/notificacoes'),
                ])).reduce((soma, item) => soma + (item.totalNaoLidas || 0), 0);
            if (total > naoLidasAnteriores.current) setAvisoChat(true);
            naoLidasAnteriores.current = total;
            setChatNaoLidas(total);
        } catch {
            // A notificacao nao deve interromper o restante do sistema.
        }
    }, []);

    React.useEffect(() => {
        if (!temAcessoIaChat) {
            setChatNaoLidas(0);
            naoLidasAnteriores.current = 0;
            return undefined;
        }
        atualizarNotificacoesChat();
        const intervalo = setInterval(atualizarNotificacoesChat, 10000);
        return () => clearInterval(intervalo);
    }, [atualizarNotificacoesChat, temAcessoIaChat]);

    React.useEffect(() => {
        if (!hasRole('charging')) {
            setCobrancasSemAtualizacao(0);
            return undefined;
        }
        const atualizarLembretes = async () => {
            try {
                const response = await UseApi('cobrancas/lembretes');
                const quantidade = Number(response?.quantidade || 0);
                setCobrancasSemAtualizacao(quantidade);
                const hoje = new Date().toISOString().slice(0, 10);
                const chave = `lembrete-cobrancas-${user.usuario || 'usuario'}`;
                if (quantidade > 0 && localStorage.getItem(chave) !== hoje) {
                    setAvisoCobrancas(true);
                    localStorage.setItem(chave, hoje);
                }
            } catch {
                // O lembrete nao deve interromper o restante do sistema.
            }
        };
        atualizarLembretes();
        const intervalo = setInterval(atualizarLembretes, 60000);
        return () => clearInterval(intervalo);
    }, [hasRole, user.usuario]);

    React.useEffect(() => {
        if (!hasRole('charging') || !user.usuario) {
            setEncerramentosAutomaticos([]);
            return undefined;
        }
        const atualizarEncerramentos = async () => {
            try {
                const response = await UseApi('cobrancas/notificacoes/encerramentos');
                setEncerramentosAutomaticos(Array.isArray(response) ? response : []);
            } catch {
                // O aviso nÃ£o deve interromper o restante do sistema.
            }
        };
        atualizarEncerramentos();
        const intervalo = setInterval(atualizarEncerramentos, 15000);
        return () => clearInterval(intervalo);
    }, [hasRole, user.usuario]);

    const confirmarEncerramentoAutomatico = async () => {
        const atual = encerramentosAutomaticos[0];
        if (!atual) return;
        try {
            await UseApi(`cobrancas/${atual.cobrancaId}/notificacao-encerramento/lida`, 'PATCH');
            setEncerramentosAutomaticos((lista) => lista.filter((item) => item.cobrancaId !== atual.cobrancaId));
        } catch {
            // MantÃ©m o aviso visÃ­vel para que o usuÃ¡rio possa tentar confirmar novamente.
        }
    };

    const cobrancaChildren = [
        {
            segment: 'registrar',
            title: 'Registrar cobranca',
            icon: <RequestQuoteOutlinedIcon />,
        },
        {
            segment: 'dashboard',
            title: 'Dashboard cobranca',
            icon: <DashboardIcon />,
        },
        {
            segment: 'painel-gerencial',
            title: 'Painel gerencial',
            icon: <BarChartIcon />,
        },
        {
            segment: 'automaticas',
            title: 'Atendimentos automaticos',
            icon: <RequestQuoteOutlinedIcon />,
        },
        {
            segment: 'acompanhamento',
            title: cobrancasSemAtualizacao > 0
                ? `Acompanhamento (${cobrancasSemAtualizacao})`
                : 'Acompanhamento',
            icon: (
                <Badge color="error" badgeContent={cobrancasSemAtualizacao} max={99}>
                    <RequestQuoteOutlinedIcon />
                </Badge>
            ),
        },
        {
            segment: 'pagas',
            title: 'Baixas e auditoria',
            icon: <SavingsOutlinedIcon />,
        },
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
        {
            segment: 'configuracoes',
            title: 'Configuracoes cobranca',
            icon: <Groups2Icon />,
        },
    ];

    const cobrancaMenu = {
        segment: 'financeiro/cobranca',
        title: 'Cobranca',
        icon: <PaymentOutlinedIcon />,
        children: cobrancaChildren,
    };

    const NAVIGATION = [
        {
            kind: 'header',
            title: 'Menu principal',
        },
        !isChargingOnly ? {
            segment: 'dashboard',
            title: 'Dashboard principal',
            icon: <DashboardIcon />,
        } : null,
        temAcessoIaChat ? {
            segment: 'chat',
            title: chatNaoLidas > 0 ? `Chat interno (${chatNaoLidas})` : 'Chat interno',
            icon: (
                <Badge color="error" badgeContent={chatNaoLidas} max={99}>
                    <ChatOutlinedIcon />
                </Badge>
            ),
        } : null,
        temAcessoIaChat ? {
            segment: 'whatsapp',
            title: 'WhatsApp',
            icon: <WhatsAppIcon />,
        } : null,
        hasRole('financial')
            ? {
                segment: 'dashboard-clientes',
                title: 'Dashboard clientes',
                icon: <Groups2Icon />,
            } : null,
        {
            kind: 'divider',
        },
        {
            kind: 'header',
            title: isChargingOnly ? 'Operacao de cobranca' : 'Registros',
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
        hasRole('technical')
            ? {
                segment: 'noc-eventos',
                title: 'ACP eventos',
                icon: <EventNoteIcon />,
            } : null,
        hasRole('technical')
            ? {
                segment: 'auditoria-ip',
                title: 'Auditoria de IP',
                icon: <FingerprintIcon />,
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
                        segment: 'leads',
                        title: 'Leads',
                        icon: <PersonAddIcon />,
                        children: [
                            {
                                segment: 'registrar',
                                title: 'Registrar lead',
                                icon: <FiberNewIcon />,
                            },
                            {
                                segment: 'dashboard',
                                title: 'Dashboard leads',
                                icon: <DashboardIcon />,
                            },
                            {
                                segment: 'acompanhamento',
                                title: 'Acompanhamento mensal',
                                icon: <DescriptionIcon />,
                            },
                            {
                                segment: 'configuracoes',
                                title: 'Configuracoes leads',
                                icon: <Groups2Icon />,
                            },
                        ],
                    },
                    {
                        segment: 'dashboards',
                        title: 'Dashboards comercial',
                        icon: <FiberNewIcon />,
                    },
                    {
                        segment: 'relatorio-vendas',
                        title: 'Relatorio comercial',
                        icon: <DashboardIcon />,
                    },
                    {
                        segment: 'clientes-plano-cidade',
                        title: 'Clientes por Plano x Cidade',
                        icon: <TableChartIcon />,
                    },
                    {
                        segment: 'configuration',
                        title: 'Configuracoes comercial',
                        icon: <Groups2Icon />,
                    },
                ],
            } : null,
        hasRole('financial')
            ? {
                segment: 'financeiro',
                title: 'Financeiro',
                icon: <MonetizationOnIcon />,
                children: [
                    {
                        segment: 'dashboard-clientes',
                        title: 'Dashboard clientes',
                        icon: <DashboardIcon />,
                    },
                    {
                        segment: 'clientes-plano-cidade',
                        title: 'Clientes por Plano x Cidade',
                        icon: <TableChartIcon />,
                    },
                    {
                        segment: 'dados',
                        title: 'Dados financeiro',
                        icon: <SavingsOutlinedIcon />,
                    },
                    {
                        segment: 'cobranca',
                        title: 'Cobranca',
                        icon: <PaymentOutlinedIcon />,
                        children: cobrancaChildren,
                    },
                ],
            } : null,
        isChargingOnly ? cobrancaMenu : null,
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
                    {
                        segment: 'whatsapp',
                        title: 'Configurar WhatsApp',
                        icon: <WhatsAppIcon />,
                    },
                ],
            } : null,
    ].filter(Boolean);

    const DashboardView = () => {
        const options = [
            hasRole('technical') ? { value: 'tecnico', label: 'Registros tecnicos', content: <DashboardPrincipal /> } : null,


            (hasRole('financial') || hasRole('commercial')) ? { value: 'plano-cidade', label: 'Clientes por Plano x Cidade', content: <RelatorioClientesPlanoCidade /> } : null,
            user.role ? { value: 'acp-eventos', label: 'ACP Eventos', content: <AcpEventos readOnly /> } : null,
            hasRole('commercial') ? { value: 'atividade', label: 'Atividades comerciais', content: <DashBoardsComercial segmento="ATIVIDADE" allowSegmentSelect={false} /> } : null,
            hasRole('charging') ? { value: 'cobranca', label: 'Cobrancas', content: <Cobrancas mode="dashboard" /> } : null,
            hasRole('financial') ? { value: 'clientes', label: 'Clientes', content: <DashboardClientes /> } : null,
        ].filter(Boolean);
        const [selected, setSelected] = React.useState(options[0]?.value || '');
        const active = options.find((item) => item.value === selected) || options[0];

        if (!active) return <div>Sem permissao</div>;

        return (
            <Stack spacing={2}>
                <Paper variant="outlined" sx={dashboardHeaderSx}>
                    <Typography variant="h5" fontWeight={800}>Dashboard principal</Typography>
                    <Typography color="#e8f8ff" sx={{ mb: 2 }}>
                        Selecione a visao que deseja acompanhar.
                    </Typography>
                    <TextField
                        select
                        size="small"
                        label="Dashboard"
                        value={active.value}
                        onChange={(event) => setSelected(event.target.value)}
                        sx={{
                            minWidth: 280,
                            ...dashboardHeaderInputSx,
                        }}
                    >
                        {options.map((item) => (
                            <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>
                        ))}
                    </TextField>
                </Paper>
                {active.content}
            </Stack>
        );
    };

    return (
        <ReactRouterAppProvider
            navigation={NAVIGATION}
            branding={{
                logo: <img src="/imagens/logo.png" alt="SOL" style={{ height: 36, objectFit: "contain" }} />,
                title: 'SOL PROVEDOR DE INTERNET',
            }}
            theme={theme}
        >
            <DashboardLayout
                defaultSidebarCollapsed
                slots={{
                    sidebarFooter: SidebarFooter,
                    toolbarActions: ToolbarActions,
                }}
            >
                <PageContainer>
                    <React.Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}><CircularProgress /></Box>}>
                        <Routes>
                        <Route path="/" element={<Navigate to={isChargingOnly ? "/financeiro/cobranca/dashboard" : "/dashboard"} replace />} />
                        <Route path="dashboard" element={<DashboardView />} />
                        <Route path="chat" element={temAcessoIaChat
                            ? <ChatInterno onUnreadChange={atualizarNotificacoesChat} />
                            : semPermissao}
                        />
                        <Route path="whatsapp" element={temAcessoIaChat
                            ? <WhatsAppChat onUnreadChange={atualizarNotificacoesChat} />
                            : semPermissao}
                        />
                        <Route path="dashboard-clientes" element={hasRole('financial') ? <DashboardClientes /> : semPermissao} />
                        <Route path="registro/registrar" element={hasRole('technical') ? <Inicio /> : semPermissao} />
                        <Route path="registro/dashboard-registro" element={hasRole('technical') ? <OverviewRegistro /> : semPermissao} />
                        <Route path="registro/settings" element={hasRole('technical') ? <SettingsRegistros /> : semPermissao} />
                        <Route path="redes/ctos" element={hasRole('technical') ? <ListeCto /> : semPermissao} />
                        <Route path="redes/equipamento" element={hasRole('technical') ? <CadastroEquipamento /> : semPermissao} />
                        <Route path="redes/tecnico" element={hasRole('technical') ? <EquipesTecnicas /> : semPermissao} />
                        <Route path="map" element={hasRole('technical') ? <MapPage /> : semPermissao} />
                        <Route path="noc-eventos" element={hasRole('technical') ? <AcpEventos /> : semPermissao} />
                        <Route path="auditoria-ip" element={hasRole('technical') ? <AuditoriaIp /> : semPermissao} />
                        <Route path="comercial/atividades" element={hasRole('commercial') ? <AtividadesComercial /> : semPermissao} />
                        <Route path="comercial/leads/registrar" element={hasRole('commercial') ? <AtividadesComercial segmento="LEAD" /> : semPermissao} />
                        <Route path="comercial/leads/dashboard" element={hasRole('commercial') ? <DashBoardsComercial segmento="LEAD" allowSegmentSelect={false} /> : semPermissao} />
                        <Route path="comercial/leads/acompanhamento" element={hasRole('commercial') ? <AtividadesComercial segmento="LEAD" mode="acompanhamento" /> : semPermissao} />
                        <Route path="comercial/leads/configuracoes" element={hasRole('commercial') ? <SettingsAtividades initialSegment="LEAD" allowedSegments={['LEAD']} /> : semPermissao} />
                        <Route path="comercial/dashboards" element={hasRole('commercial') ? <DashBoardsComercial segmento="ATIVIDADE" allowSegmentSelect={false} /> : semPermissao} />
                        <Route path="comercial/relatorio-vendas" element={hasRole('commercial') ? <DashBoardsComercial segmento="LEAD" allowSegmentSelect={false} /> : semPermissao} />
                        <Route path="comercial/configuration" element={hasRole('commercial') ? <SettingsAtividades allowedSegments={['ATIVIDADE']} /> : semPermissao} />
                        <Route path="perfil/settings" element={<SettingsPerfil />} />
                        <Route path="/financeiro/dashboard-clientes" element={hasRole('financial') ? <DashboardClientes /> : semPermissao} />

                        <Route path="/financeiro/clientes-plano-cidade" element={hasRole('financial') || hasRole('commercial') ? <RelatorioClientesPlanoCidade /> : semPermissao} />

                        <Route path="financeiro/clientes-plano-cidade" element={hasRole('financial') || hasRole('commercial') ? <RelatorioClientesPlanoCidade /> : semPermissao} />

                        <Route path="comercial/clientes-plano-cidade" element={hasRole('commercial') || hasRole('financial') ? <RelatorioClientesPlanoCidade /> : semPermissao} />
                        <Route path="/financeiro/dados" element={hasRole('financial') ? <Financeiro /> : semPermissao} />
                        <Route path="/financeiro/cobranca/registrar" element={hasRole('charging') ? <Cobrancas mode="cadastro" /> : semPermissao} />
                        <Route path="/financeiro/cobranca/dashboard" element={hasRole('charging') ? <Cobrancas mode="dashboard" /> : semPermissao} />
                        <Route path="/financeiro/cobranca/painel-gerencial" element={hasRole('charging') ? <PainelCobrancaGerencial /> : semPermissao} />
                        <Route path="/financeiro/cobranca/automaticas" element={hasRole('charging') ? <Cobrancas mode="automaticas" /> : semPermissao} />
                        <Route path="/financeiro/cobranca/acompanhamento" element={hasRole('charging') ? <Cobrancas mode="acompanhamento" /> : semPermissao} />
                        <Route path="/financeiro/cobranca/pagas" element={hasRole('charging') ? <Cobrancas mode="pagas" /> : semPermissao} />
                        <Route path="/financeiro/cobranca/bloqueados" element={hasRole('charging') ? <Inadiplentes /> : semPermissao} />
                        <Route path="/financeiro/cobranca/suspenso" element={hasRole('charging') ? <Suspensos /> : semPermissao} />
                        <Route path="/financeiro/cobranca/configuracoes" element={hasRole('charging') ? <SettingsAtividades initialSegment="COBRANCA_ACAO" allowedSegments={['COBRANCA_ACAO', 'COBRANCA_STATUS']} /> : semPermissao} />
                        <Route path="/settinguser/ativar" element={hasRole('admin') ? <UsuariosNAtivos /> : semPermissao} />
                        <Route path="/settinguser/management" element={hasRole('admin') ? <ManagementUser /> : semPermissao} />
                        <Route path="/settinguser/pendentpass" element={hasRole('admin') ? <PendentPass /> : semPermissao} />
                        <Route path="/settinguser/whatsapp" element={hasRole('admin') ? <ConfiguracaoWhatsApp /> : semPermissao} />
                        <Route path="*" element={<StateFeedback type="notfound" />} />
                    </Routes>
                    </React.Suspense>
                </PageContainer>
            </DashboardLayout>
            {temAcessoIaChat && <AssistenteIa />}
            <Snackbar
                open={avisoChat}
                autoHideDuration={5000}
                onClose={() => setAvisoChat(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity="info" variant="filled" onClose={() => setAvisoChat(false)}>
                    VocÃª recebeu uma nova mensagem no chat ou WhatsApp.
                </Alert>
            </Snackbar>
            <Snackbar
                open={avisoCobrancas}
                onClose={() => setAvisoCobrancas(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            >
                <Alert severity="warning" variant="filled" onClose={() => setAvisoCobrancas(false)}>
                    {cobrancasSemAtualizacao} cobranÃ§a(s) aberta(s) estÃ£o hÃ¡ 7 dias ou mais sem atualizaÃ§Ã£o.
                </Alert>
            </Snackbar>
            <Snackbar
                open={encerramentosAutomaticos.length > 0}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    severity={encerramentosAutomaticos[0]?.statusIntegracaoRbx === 'FECHADO_RBX' ? 'success' : 'warning'}
                    variant="filled"
                    action={(
                        <Button color="inherit" size="small" onClick={confirmarEncerramentoAutomatico}>
                            Ciente
                        </Button>
                    )}
                >
                    {encerramentosAutomaticos[0]?.mensagem}
                    {encerramentosAutomaticos.length > 1 && ` (+${encerramentosAutomaticos.length - 1} aviso(s))`}
                </Alert>
            </Snackbar>
        </ReactRouterAppProvider>
    );
}

export default Menu
