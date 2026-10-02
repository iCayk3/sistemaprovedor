import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Stack,
    TextField,
    Button,
    Chip,
    CircularProgress,
    Alert,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    TableContainer,
    TableFooter,
    TablePagination,
    InputAdornment,
    LinearProgress,
    Tooltip,
    Autocomplete,
    Tabs,
    Tab,
    ToggleButton,
    ToggleButtonGroup
} from '@mui/material';
import TableChartRoundedIcon from '@mui/icons-material/TableChartRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import LocationCityRoundedIcon from '@mui/icons-material/LocationCityRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import MonetizationOnRoundedIcon from '@mui/icons-material/MonetizationOnRounded';
import SpeedRoundedIcon from '@mui/icons-material/SpeedRounded';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import Api from '../../Services/Api';
import {
    dashboardHeaderSx,
    dashboardMetricSx,
    dashboardPanelSx,
    dashboardShellSx,
    dashboardSubtleTextSx,
    dashboardMutedTextSx
} from '../../Utils/DashboardTheme';

const UseApi = Api();

export default function RelatorioClientesPlanoCidade() {
    const [dados, setDados] = useState(null);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState('');
    const [filtroPlano, setFiltroPlano] = useState('');
    const [cidadesSelecionadas, setCidadesSelecionadas] = useState([]);

    // Aba ativa: 'cobrados' | 'naoCobrados' | 'consolidado'
    const [abaAtiva, setAbaAtiva] = useState('cobrados');

    // Métrica ativa: 'pessoas' (clientes únicos) | 'contratos'
    const [metrica, setMetrica] = useState('pessoas');

    // Paginação da tabela
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);

    const carregarDados = useCallback(async () => {
        setLoading(true);
        setErro('');
        try {
            const res = await UseApi('rbx/relatorios/clientes-plano-cidade');
            setDados(res);
            if (res?.cidades && cidadesSelecionadas.length === 0) {
                setCidadesSelecionadas(res.cidades);
            }
        } catch (err) {
            console.error('Erro ao carregar relatório de clientes por plano e cidade:', err);
            setErro(err.message || 'Falha ao buscar dados do RBX.');
        } finally {
            setLoading(false);
        }
    }, [cidadesSelecionadas.length]);

    useEffect(() => {
        carregarDados();
    }, [carregarDados]);

    // Seção atual de dados conforme a aba ativa
    const secaoAtual = useMemo(() => {
        if (!dados) return null;
        if (abaAtiva === 'cobrados') return dados.cobrados;
        if (abaAtiva === 'naoCobrados') return dados.naoCobrados;
        return dados.consolidado;
    }, [dados, abaAtiva]);

    // Exportação em CSV no formato matriz / tabela dinâmica
    const exportarCsv = () => {
        if (!dados || !secaoAtual?.linhas) return;

        const cidadesExport = cidadesSelecionadas.length > 0 ? cidadesSelecionadas : dados.cidades;
        const sufixoMetrica = metrica === 'pessoas' ? 'Pessoas' : 'Contratos';
        const cabecalho = ['Plano', ...cidadesExport, `TOTAL (${sufixoMetrica})`];

        const linhasCsv = secaoAtual.linhas.map(linha => {
            const valoresCidades = cidadesExport.map(c => {
                if (metrica === 'pessoas') {
                    return linha.pessoasPorCidade?.[c] || 0;
                }
                return linha.quantidadePorCidade?.[c] || 0;
            });
            const totalLinha = metrica === 'pessoas' ? linha.totalPessoas : linha.totalContratos;
            return [
                `"${(linha.plano || '').replace(/"/g, '""')}"`,
                ...valoresCidades,
                totalLinha
            ];
        });

        // Linha de total geral por cidade
        const totaisColunas = cidadesExport.map(c => {
            if (metrica === 'pessoas') {
                return secaoAtual.totaisPorCidadePessoas?.[c] || 0;
            }
            return secaoAtual.totaisPorCidadeContratos?.[c] || 0;
        });

        const totalGeralSecao = metrica === 'pessoas' ? secaoAtual.totalPessoas : secaoAtual.totalContratos;
        linhasCsv.push([
            `"TOTAL GERAL (${sufixoMetrica})"`,
            ...totaisColunas,
            totalGeralSecao
        ]);

        const csvContent = '\uFEFF' + [cabecalho.join(';'), ...linhasCsv.map(l => l.join(';'))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `clientes_plano_x_cidade_${abaAtiva}_${metrica}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Linhas filtradas pela pesquisa de plano
    const linhasFiltradas = useMemo(() => {
        if (!secaoAtual?.linhas) return [];
        let lista = secaoAtual.linhas;
        if (filtroPlano.trim()) {
            const termo = filtroPlano.toLowerCase().trim();
            lista = lista.filter(item => item.plano.toLowerCase().includes(termo));
        }
        return lista;
    }, [secaoAtual, filtroPlano]);

    // Paginação
    const linhasPaginadas = useMemo(() => {
        const start = page * rowsPerPage;
        return linhasFiltradas.slice(start, start + rowsPerPage);
    }, [linhasFiltradas, page, rowsPerPage]);

    const cidadesExibidas = useMemo(() => {
        if (!dados?.cidades) return [];
        if (cidadesSelecionadas.length === 0) return dados.cidades;
        return dados.cidades.filter(c => cidadesSelecionadas.includes(c));
    }, [dados, cidadesSelecionadas]);

    return (
        <Box sx={{ py: 2, ...dashboardShellSx }}>
            {/* Header */}
            <Paper variant="outlined" sx={{ ...dashboardHeaderSx, mb: 3 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>
                    <Box>
                        <Typography variant="h5" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TableChartRoundedIcon sx={{ fontSize: 32, color: '#17e2e8' }} />
                            Clientes Ativos por Plano x Cidade
                        </Typography>
                        <Typography color="#e8f8ff" variant="body2" sx={{ mt: 0.5 }}>
                            Matriz cruzada e contagem de pessoas e contratos por localidade, separando contratos com mensalidade de planos de controle de banda.
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={1.5}>
                        <Button
                            variant="outlined"
                            startIcon={<DownloadRoundedIcon />}
                            onClick={exportarCsv}
                            disabled={!secaoAtual?.linhas?.length}
                            sx={{
                                color: '#fff',
                                borderColor: 'rgba(255,255,255,0.4)',
                                '&:hover': { borderColor: '#fff', backgroundColor: 'rgba(255,255,255,0.1)' }
                            }}
                        >
                            Exportar Planilha
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <RefreshRoundedIcon />}
                            onClick={carregarDados}
                            disabled={loading}
                            sx={{
                                backgroundColor: '#17e2e8',
                                color: '#092540',
                                fontWeight: 700,
                                '&:hover': { backgroundColor: '#14c3c8' }
                            }}
                        >
                            {loading ? 'Atualizando...' : 'Atualizar'}
                        </Button>
                    </Stack>
                </Stack>
            </Paper>

            {erro && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErro('')}>
                    {erro}
                </Alert>
            )}

            {/* Banner Informativo */}
            <Alert
                icon={<InfoOutlinedIcon fontSize="inherit" />}
                severity="info"
                variant="outlined"
                sx={{ mb: 3, bgcolor: 'background.paper', borderRadius: 2 }}
            >
                Separamos os <strong>contratos cobrados</strong> (planos de internet com mensalidade ativa) dos contratos de <strong>controle de banda / TV</strong> (com valor R$ 0,00 associados para viabilizar login ou serviços adicionais). Alterne entre as abas abaixo para consultar cada visão.
            </Alert>

            {loading && <LinearProgress sx={{ mb: 3, borderRadius: 1 }} />}

            {/* KPIs Gerais */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Paper variant="outlined" sx={{ ...dashboardMetricSx, height: '100%' }}>
                        <Stack direction="row" alignItems="center" spacing={2}>
                            <MonetizationOnRoundedIcon sx={{ fontSize: 38, color: '#2ecc71', flexShrink: 0 }} />
                            <Box>
                                <Typography sx={dashboardSubtleTextSx} variant="body2" fontWeight={800}>
                                    PESSOAS EM PLANOS COBRADOS
                                </Typography>
                                <Typography variant="h4" fontWeight={800} color="success.main">
                                    {dados ? dados.totalPessoasCobradas.toLocaleString('pt-BR') : '-'}
                                </Typography>
                                <Typography sx={dashboardMutedTextSx} variant="caption">
                                    {dados ? `${dados.totalContratosCobrados.toLocaleString('pt-BR')} contratos cobrados` : '-'}
                                </Typography>
                            </Box>
                        </Stack>
                    </Paper>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Paper variant="outlined" sx={{ ...dashboardMetricSx, height: '100%' }}>
                        <Stack direction="row" alignItems="center" spacing={2}>
                            <SpeedRoundedIcon sx={{ fontSize: 38, color: '#e67e22', flexShrink: 0 }} />
                            <Box>
                                <Typography sx={dashboardSubtleTextSx} variant="body2" fontWeight={800}>
                                    CONTROLE DE BANDA / TV (R$ 0)
                                </Typography>
                                <Typography variant="h4" fontWeight={800} sx={{ color: '#e67e22' }}>
                                    {dados ? dados.totalContratosNaoCobrados.toLocaleString('pt-BR') : '-'}
                                </Typography>
                                <Typography sx={dashboardMutedTextSx} variant="caption">
                                    {dados ? `${dados.totalPessoasNaoCobradas.toLocaleString('pt-BR')} pessoas vinculadas` : '-'}
                                </Typography>
                            </Box>
                        </Stack>
                    </Paper>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Paper variant="outlined" sx={{ ...dashboardMetricSx, height: '100%' }}>
                        <Stack direction="row" alignItems="center" spacing={2}>
                            <GroupsRoundedIcon sx={{ fontSize: 38, color: '#17e2e8', flexShrink: 0 }} />
                            <Box>
                                <Typography sx={dashboardSubtleTextSx} variant="body2" fontWeight={800}>
                                    TOTAL CLIENTES ÚNICOS
                                </Typography>
                                <Typography variant="h4" fontWeight={800} sx={{ color: '#17e2e8' }}>
                                    {dados ? dados.totalClientesUnicos.toLocaleString('pt-BR') : '-'}
                                </Typography>
                                <Typography sx={dashboardMutedTextSx} variant="caption">
                                    Pessoas com contratos ativos
                                </Typography>
                            </Box>
                        </Stack>
                    </Paper>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Paper variant="outlined" sx={{ ...dashboardMetricSx, height: '100%' }}>
                        <Stack direction="row" alignItems="center" spacing={2}>
                            <LocationCityRoundedIcon sx={{ fontSize: 38, color: '#9b59b6', flexShrink: 0 }} />
                            <Box>
                                <Typography sx={dashboardSubtleTextSx} variant="body2" fontWeight={800}>
                                    CIDADES ATENDIDAS
                                </Typography>
                                <Typography variant="h4" fontWeight={800} sx={{ color: '#9b59b6' }}>
                                    {dados?.cidades ? dados.cidades.length : '-'}
                                </Typography>
                                <Typography sx={dashboardMutedTextSx} variant="caption">
                                    {dados ? `${dados.totalGeralContratos.toLocaleString('pt-BR')} contratos totais` : '-'}
                                </Typography>
                            </Box>
                        </Stack>
                    </Paper>
                </Grid>
            </Grid>

            {/* Abas de Separação de Contratos */}
            <Paper variant="outlined" sx={{ mb: 3, bgcolor: 'background.paper' }}>
                <Tabs
                    value={abaAtiva}
                    onChange={(_, novaAba) => {
                        setAbaAtiva(novaAba);
                        setPage(0);
                    }}
                    indicatorColor="primary"
                    textColor="primary"
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}
                >
                    <Tab
                        value="cobrados"
                        label={
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <MonetizationOnRoundedIcon fontSize="small" sx={{ color: abaAtiva === 'cobrados' ? 'success.main' : 'inherit' }} />
                                <span>Planos Cobrados (Mensalidade)</span>
                                <Typography
                                    component="span"
                                    sx={{
                                        color: abaAtiva === 'cobrados' ? 'success.main' : 'text.secondary',
                                        fontWeight: 800,
                                        fontSize: '0.85rem'
                                    }}
                                >
                                    ({dados ? `${dados.totalPessoasCobradas.toLocaleString('pt-BR')} pessoas` : '...'})
                                </Typography>
                            </Stack>
                        }
                    />
                    <Tab
                        value="naoCobrados"
                        label={
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <SpeedRoundedIcon fontSize="small" sx={{ color: abaAtiva === 'naoCobrados' ? 'warning.main' : 'inherit' }} />
                                <span>Controle de Banda / TV (R$ 0)</span>
                                <Typography
                                    component="span"
                                    sx={{
                                        color: abaAtiva === 'naoCobrados' ? 'warning.main' : 'text.secondary',
                                        fontWeight: 800,
                                        fontSize: '0.85rem'
                                    }}
                                >
                                    ({dados ? `${dados.totalContratosNaoCobrados.toLocaleString('pt-BR')} contratos` : '...'})
                                </Typography>
                            </Stack>
                        }
                    />
                    <Tab
                        value="consolidado"
                        label={
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <TableChartRoundedIcon fontSize="small" sx={{ color: abaAtiva === 'consolidado' ? 'info.main' : 'inherit' }} />
                                <span>Visão Consolidada (Todos)</span>
                                <Typography
                                    component="span"
                                    sx={{
                                        color: abaAtiva === 'consolidado' ? 'info.main' : 'text.secondary',
                                        fontWeight: 800,
                                        fontSize: '0.85rem'
                                    }}
                                >
                                    ({dados ? `${dados.totalGeralContratos.toLocaleString('pt-BR')}` : '...'})
                                </Typography>
                            </Stack>
                        }
                    />
                </Tabs>

                {/* Barra de Controles (Pesquisa + Seletor Pessoas/Contratos + Filtro de Cidades) */}
                <Box sx={{ p: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={4}>
                            <TextField
                                size="small"
                                fullWidth
                                label="Buscar Plano"
                                placeholder="Ex: 250, 500, TV..."
                                value={filtroPlano}
                                onChange={(e) => {
                                    setFiltroPlano(e.target.value);
                                    setPage(0);
                                }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchRoundedIcon fontSize="small" />
                                        </InputAdornment>
                                    )
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6} md={3.5}>
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <Typography variant="caption" fontWeight={700} color="text.secondary">
                                    Contar por:
                                </Typography>
                                <ToggleButtonGroup
                                    value={metrica}
                                    exclusive
                                    size="small"
                                    onChange={(_, novaMetrica) => {
                                        if (novaMetrica) setMetrica(novaMetrica);
                                    }}
                                >
                                    <ToggleButton value="pessoas" sx={{ textTransform: 'none', px: 1.5, py: 0.5, fontWeight: 700 }}>
                                        <PersonOutlineRoundedIcon fontSize="small" sx={{ mr: 0.5 }} /> Pessoas
                                    </ToggleButton>
                                    <ToggleButton value="contratos" sx={{ textTransform: 'none', px: 1.5, py: 0.5, fontWeight: 700 }}>
                                        <DescriptionOutlinedIcon fontSize="small" sx={{ mr: 0.5 }} /> Contratos
                                    </ToggleButton>
                                </ToggleButtonGroup>
                            </Stack>
                        </Grid>

                        <Grid item xs={12} sm={6} md={4.5}>
                            <Autocomplete
                                multiple
                                size="small"
                                options={dados?.cidades || []}
                                value={cidadesSelecionadas}
                                onChange={(_, novo) => setCidadesSelecionadas(novo)}
                                renderTags={(value, getTagProps) =>
                                    value.map((option, index) => (
                                        <Chip
                                            variant="outlined"
                                            label={option}
                                            size="small"
                                            {...getTagProps({ index })}
                                            key={option}
                                        />
                                    ))
                                }
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Filtrar Cidades Visíveis"
                                        placeholder={cidadesSelecionadas.length === 0 ? "Todas as cidades" : ""}
                                    />
                                )}
                            />
                        </Grid>
                    </Grid>
                </Box>
            </Paper>

            {/* Painéis com Top Planos e Top Cidades da Aba Ativa */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ ...dashboardPanelSx, p: 2.5, height: '100%' }}>
                        <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 2 }}>
                            Top 5 Planos ({abaAtiva === 'cobrados' ? 'Cobrados' : abaAtiva === 'naoCobrados' ? 'Controle de Banda' : 'Consolidado'})
                        </Typography>
                        <Stack spacing={2}>
                            {secaoAtual?.topPlanos?.map((item) => (
                                <Box key={item.label}>
                                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                                        <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: '75%' }}>
                                            {item.label}
                                        </Typography>
                                        <Typography variant="body2" fontWeight={700}>
                                            {item.total.toLocaleString('pt-BR')} pessoas ({item.percentual}%)
                                        </Typography>
                                    </Stack>
                                    <LinearProgress
                                        variant="determinate"
                                        value={Math.min(item.percentual * 2, 100)}
                                        color={abaAtiva === 'cobrados' ? 'primary' : 'warning'}
                                        sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(0,0,0,0.06)' }}
                                    />
                                </Box>
                            ))}
                        </Stack>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ ...dashboardPanelSx, p: 2.5, height: '100%' }}>
                        <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 2 }}>
                            Top 5 Cidades com Mais Pessoas ({abaAtiva === 'cobrados' ? 'Cobrados' : abaAtiva === 'naoCobrados' ? 'Controle de Banda' : 'Consolidado'})
                        </Typography>
                        <Stack spacing={2}>
                            {secaoAtual?.topCidades?.map((item) => (
                                <Box key={item.label}>
                                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                                        <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: '75%' }}>
                                            {item.label}
                                        </Typography>
                                        <Typography variant="body2" fontWeight={700}>
                                            {item.total.toLocaleString('pt-BR')} pessoas ({item.percentual}%)
                                        </Typography>
                                    </Stack>
                                    <LinearProgress
                                        variant="determinate"
                                        value={Math.min(item.percentual * 2, 100)}
                                        color="secondary"
                                        sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(0,0,0,0.06)' }}
                                    />
                                </Box>
                            ))}
                        </Stack>
                    </Paper>
                </Grid>
            </Grid>

            {/* Matriz Cruzada / Pivot Table */}
            <Paper variant="outlined" sx={{ ...dashboardPanelSx, overflow: 'hidden' }}>
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="h6" fontWeight={800}>
                            Tabela Cruzada: Plano de Internet x Cidade
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Visualizando por: <strong>{metrica === 'pessoas' ? 'Pessoas (Clientes Únicos)' : 'Contratos'}</strong> | Aba: <strong>{abaAtiva === 'cobrados' ? 'Planos Cobrados' : abaAtiva === 'naoCobrados' ? 'Controle de Banda' : 'Consolidado'}</strong>
                        </Typography>
                    </Box>
                    <Typography sx={{ color: 'primary.main', fontWeight: 800, fontSize: '0.875rem' }}>
                        {linhasFiltradas.length} plano(s)
                    </Typography>
                </Box>

                <TableContainer sx={{ maxHeight: 650 }}>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell
                                    sx={{
                                        fontWeight: 800,
                                        minWidth: 240,
                                        backgroundColor: 'background.paper',
                                        zIndex: 3
                                    }}
                                >
                                    Plano de Internet
                                </TableCell>
                                {cidadesExibidas.map((cidade) => (
                                    <TableCell
                                        key={cidade}
                                        align="right"
                                        sx={{
                                            fontWeight: 800,
                                            minWidth: 120,
                                            backgroundColor: 'background.paper',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        {cidade}
                                    </TableCell>
                                ))}
                                <TableCell
                                    align="right"
                                    sx={{
                                        fontWeight: 800,
                                        minWidth: 140,
                                        backgroundColor: abaAtiva === 'cobrados' ? 'primary.main' : 'warning.dark',
                                        color: '#fff',
                                        zIndex: 3
                                    }}
                                >
                                    TOTAL {metrica === 'pessoas' ? 'PESSOAS' : 'CONTRATOS'}
                                </TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {linhasPaginadas.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={cidadesExibidas.length + 2} align="center" sx={{ py: 4 }}>
                                        <Typography variant="body2" color="text.secondary">
                                             {loading ? 'Carregando matriz...' : 'Nenhum plano encontrado.'}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                linhasPaginadas.map((linha) => {
                                    const totalLinhaExibido = metrica === 'pessoas' ? linha.totalPessoas : linha.totalContratos;
                                    return (
                                        <TableRow
                                            key={linha.plano}
                                            hover
                                            sx={{ '&:nth-of-type(odd)': { backgroundColor: 'action.hover' } }}
                                        >
                                            <TableCell sx={{ fontWeight: 600 }}>
                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                    <span>{linha.plano}</span>
                                                    {!linha.cobrado && (
                                                        <Typography variant="caption" sx={{ color: 'warning.main', fontWeight: 800 }}>
                                                            R$ 0
                                                        </Typography>
                                                    )}
                                                </Stack>
                                            </TableCell>

                                            {cidadesExibidas.map((cidade) => {
                                                const pessoas = linha.pessoasPorCidade?.[cidade] || 0;
                                                const contratos = linha.quantidadePorCidade?.[cidade] || 0;
                                                const valorExibido = metrica === 'pessoas' ? pessoas : contratos;

                                                return (
                                                    <TableCell key={cidade} align="right">
                                                        {valorExibido > 0 ? (
                                                            <Tooltip title={`${pessoas.toLocaleString('pt-BR')} pessoas | ${contratos.toLocaleString('pt-BR')} contratos`} arrow>
                                                                <Typography
                                                                    variant="body2"
                                                                    sx={{
                                                                        fontWeight: valorExibido >= 100 ? 800 : valorExibido >= 20 ? 700 : 500,
                                                                        color: valorExibido >= 100 ? 'primary.main' : valorExibido > 0 ? 'text.primary' : 'text.disabled',
                                                                        display: 'inline-block'
                                                                    }}
                                                                >
                                                                    {valorExibido.toLocaleString('pt-BR')}
                                                                </Typography>
                                                            </Tooltip>
                                                        ) : (
                                                            <Typography variant="caption" color="text.disabled">-</Typography>
                                                        )}
                                                    </TableCell>
                                                );
                                            })}

                                            <TableCell align="right" sx={{ fontWeight: 800, bgcolor: 'action.selected' }}>
                                                <Tooltip title={`${linha.totalPessoas} pessoas | ${linha.totalContratos} contratos`} arrow>
                                                    <Typography variant="body2" fontWeight={800} color="primary.main">
                                                        {totalLinhaExibido.toLocaleString('pt-BR')}
                                                    </Typography>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>

                        {/* Linha de Totais Gerais por Cidade no Rodapé */}
                        {secaoAtual && (
                            <TableFooter sx={{ position: 'sticky', bottom: 0, zIndex: 2 }}>
                                <TableRow sx={{ bgcolor: 'background.paper', borderTop: '2px solid rgba(140,140,140,0.3)' }}>
                                    <TableCell sx={{ fontWeight: 800, fontSize: '0.92rem', bgcolor: 'action.focus' }}>
                                        TOTAL GERAL POR CIDADE ({metrica === 'pessoas' ? 'PESSOAS' : 'CONTRATOS'})
                                    </TableCell>
                                    {cidadesExibidas.map((cidade) => {
                                        const totalCidade = metrica === 'pessoas'
                                            ? (secaoAtual.totaisPorCidadePessoas?.[cidade] || 0)
                                            : (secaoAtual.totaisPorCidadeContratos?.[cidade] || 0);

                                        return (
                                            <TableCell key={cidade} align="right" sx={{ fontWeight: 800, bgcolor: 'action.focus' }}>
                                                <Typography variant="body2" fontWeight={800}>
                                                    {totalCidade.toLocaleString('pt-BR')}
                                                </Typography>
                                            </TableCell>
                                        );
                                    })}
                                    <TableCell align="right" sx={{ fontWeight: 900, bgcolor: 'primary.dark', color: '#fff' }}>
                                        <Typography variant="subtitle2" fontWeight={900}>
                                            {metrica === 'pessoas'
                                                ? secaoAtual.totalPessoas.toLocaleString('pt-BR')
                                                : secaoAtual.totalContratos.toLocaleString('pt-BR')}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            </TableFooter>
                        )}
                    </Table>
                </TableContainer>

                <TablePagination
                    rowsPerPageOptions={[15, 25, 50, 100]}
                    component="div"
                    count={linhasFiltradas.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(_, newPage) => setPage(newPage)}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                    }}
                    labelRowsPerPage="Planos por página:"
                    labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count !== -1 ? count : `mais de ${to}`}`}
                />
            </Paper>
        </Box>
    );
}
