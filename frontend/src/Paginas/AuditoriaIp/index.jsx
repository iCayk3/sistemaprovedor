import React, { useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Divider,
    Grid,
    IconButton,
    LinearProgress,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonPinIcon from '@mui/icons-material/PersonPin';
import RouterIcon from '@mui/icons-material/Router';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import Api from '../../Services/Api';
import {
    dashboardHeaderSx,
    dashboardPanelSx,
    dashboardShellSx,
    dashboardMetricSx,
    dashboardMutedTextSx,
} from '../../Utils/DashboardTheme';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const UseApi = Api();

export default function AuditoriaIp() {
    const hojeIso = new Date().toISOString().slice(0, 10);
    const [ip, setIp] = useState('');
    const [data, setData] = useState(hojeIso);
    const [hora, setHora] = useState('');
    const [usarIntervalo, setUsarIntervalo] = useState(false);
    const [dataInicio, setDataInicio] = useState(hojeIso + ' 00:00:00');
    const [dataFim, setDataFim] = useState(hojeIso + ' 23:59:59');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [resultado, setResultado] = useState(null);
    const [copiado, setCopiado] = useState(false);

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        if (!ip.trim()) {
            setError('Por favor, informe o endereço IP para pesquisar.');
            return;
        }

        setError('');
        setLoading(true);
        setResultado(null);

        const payload = {
            ip: ip.trim(),
            ...(usarIntervalo
                ? { dataInicio, dataFim }
                : {
                    data,
                    hora: hora ? (hora.length === 5 ? `${hora}:00` : hora) : null,
                }),
        };

        try {
            const data = await UseApi('auditoria-ip/consultar', 'POST', payload);
            setResultado(data);
            if (!data?.sessoes || data.sessoes.length === 0) {
                setError(`Nenhuma conexão com o IP ${ip} foi localizada no período especificado.`);
            }
        } catch (err) {
            setError(err?.message || 'Falha ao consultar histórico de IP no servidor RBX.');
        } finally {
            setLoading(false);
        }
    };

    const copiarDados = (sessao) => {
        const texto = `=== AUDITORIA DE CONEXÃO (MARCO CIVIL) ===
IP Consultado: ${sessao.ipAddress || ip}
Assinante: ${sessao.clienteNome} (ID: ${sessao.customerId})
CPF/CNPJ: ${sessao.clienteCpfCnpj}
Login (PPPoE): ${sessao.username}
Grupo/Cidade: ${sessao.clienteGrupo}
Início da Conexão: ${sessao.startTime}
Fim da Conexão: ${sessao.stopTime || 'Conexão ativa'}
Duração: ${sessao.duracaoFormatada}
Endereço MAC: ${sessao.mac}
Concentrador (NAS): ${sessao.nas}
Motivo Término: ${sessao.terminateCauseDescricao || sessao.terminateCause}`;

        navigator.clipboard.writeText(texto);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2500);
    };

    const exportarPdf = (sessao) => {
        const doc = new jsPDF();
        const emissoes = new Date().toLocaleString('pt-BR');

        // Cabeçalho Oficial
        doc.setFillColor(15, 76, 129);
        doc.rect(0, 0, 210, 24, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('SOL PROVEDOR DE INTERNET', 14, 12);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('LAUDO TÉCNICO DE AUDITORIA DE CONEXÃO / MARCO CIVIL DA INTERNET', 14, 19);

        doc.setTextColor(40, 40, 40);
        doc.setFontSize(8);
        doc.text(`Data de Emissão: ${emissoes}`, 140, 19);

        // Bloco 1: Parâmetros Investigados
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('1. DADOS DO IP AUDITADO', 14, 34);

        autoTable(doc, {
            startY: 37,
            head: [['Endereço IP', 'Data/Hora de Referência', 'Período Consultado']],
            body: [[
                sessao.ipAddress || ip,
                hora ? `${data} ${hora}` : data,
                resultado?.periodoConsultado || `${dataInicio} até ${dataFim}`,
            ]],
            theme: 'grid',
            headStyles: { fillColor: [15, 76, 129], textColor: 255, fontStyle: 'bold' },
            styles: { fontSize: 9 },
        });

        // Bloco 2: Titular Identificado
        const nextY1 = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('2. TITULAR / ASSINANTE IDENTIFICADO', 14, nextY1);

        autoTable(doc, {
            startY: nextY1 + 3,
            head: [['Código', 'Nome / Razão Social', 'CPF / CNPJ', 'Login (PPPoE)', 'Cidade / Grupo', 'Situação']],
            body: [[
                sessao.customerId || 'N/A',
                sessao.clienteNome || 'Não identificado',
                sessao.clienteCpfCnpj || 'Não informado',
                sessao.username || 'N/A',
                sessao.clienteGrupo || 'N/A',
                sessao.clienteSituacao || 'N/A',
            ]],
            theme: 'grid',
            headStyles: { fillColor: [15, 76, 129], textColor: 255, fontStyle: 'bold' },
            styles: { fontSize: 9 },
        });

        // Bloco 3: Dados Técnicos da Sessão
        const nextY2 = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('3. REGISTRO TÉCNICO DE CONEXÃO (RADIUS)', 14, nextY2);

        autoTable(doc, {
            startY: nextY2 + 3,
            head: [['Campo', 'Informação Técnica']],
            body: [
                ['Endereço IPv4 Atribuído', sessao.ipAddress || 'Não informado'],
                ['Endereço IPv6 Atribuído', sessao.ipv6Address || 'Não informado'],
                ['Prefixo IPv6 Delegado', sessao.delegatedIpv6Prefix || 'Não informado'],
                ['Endereço Físico (MAC da ONU/Roteador)', sessao.mac || 'Não informado'],
                ['Concentrador / BNG (NAS)', sessao.nas || 'Não informado'],
                ['Início da Conexão (Data/Hora)', sessao.startTime || 'Não informado'],
                ['Término da Conexão (Data/Hora)', sessao.stopTime || 'Sessão ainda em andamento'],
                ['Duração Total da Sessão', sessao.duracaoFormatada || 'N/A'],
                ['Tráfego de Download (Octetos)', sessao.downloadFormatado || '0 B'],
                ['Tráfego de Upload (Octetos)', sessao.uploadFormatado || '0 B'],
                ['Causa da Desconexão', sessao.terminateCauseDescricao || sessao.terminateCause || 'Conexão ativa'],
            ],
            theme: 'striped',
            headStyles: { fillColor: [15, 76, 129], textColor: 255, fontStyle: 'bold' },
            styles: { fontSize: 8.5 },
        });

        // Bloco de Assinatura e Encerramento
        const finalY = doc.lastAutoTable.finalY + 25;
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.text('Este documento foi gerado automaticamente pelo Sistema de Gestão SOL PROVEDOR a partir dos logs oficiais do servidor RADIUS.', 14, finalY);
        doc.text('Em conformidade com as diretrizes do Marco Civil da Internet (Lei nº 12.965/2014) sobre guarda e fornecimento de registros de conexão.', 14, finalY + 5);

        doc.line(70, finalY + 28, 140, finalY + 28);
        doc.text('Responsável Técnico / NOC', 87, finalY + 33);

        doc.save(`auditoria-ip-${(sessao.ipAddress || ip).replace(/[^0-9a-zA-Z]/g, '_')}-${sessao.username || 'sessao'}.pdf`);
    };

    return (
        <Box sx={{ py: 2, ...dashboardShellSx }}>
            {/* Cabeçalho */}
            <Paper variant="outlined" sx={{ ...dashboardHeaderSx, mb: 3 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} gap={2}>
                    <Box>
                        <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>
                            <FingerprintIcon sx={{ fontSize: 32, color: '#00e5ff' }} />
                            <Typography variant="h5" fontWeight={800}>
                                Auditoria de IP & Conexões (Marco Civil)
                            </Typography>
                        </Stack>
                        <Typography color="#e8f8ff">
                            Localize o titular, login, endereço MAC e concentrador NAS responsável por um determinado endereço IP em data e hora específicas.
                        </Typography>
                    </Box>
                </Stack>
            </Paper>

            {/* Painel de Filtros */}
            <Paper variant="outlined" sx={{ ...dashboardPanelSx, p: 3, mb: 3 }}>
                <form onSubmit={handleSearch}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={6} md={3.5}>
                            <TextField
                                label="Endereço IP (IPv4 ou IPv6)"
                                placeholder="Ex: 100.122.7.220"
                                fullWidth
                                size="small"
                                required
                                value={ip}
                                onChange={(e) => setIp(e.target.value)}
                                helperText="IP exato da ocorrência"
                            />
                        </Grid>

                        {!usarIntervalo ? (
                            <>
                                <Grid item xs={12} sm={3} md={2.5}>
                                    <TextField
                                        label="Data do Evento"
                                        type="date"
                                        fullWidth
                                        size="small"
                                        required
                                        value={data}
                                        onChange={(e) => setData(e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={3} md={2}>
                                    <TextField
                                        label="Horário (Opcional)"
                                        type="time"
                                        fullWidth
                                        size="small"
                                        value={hora}
                                        onChange={(e) => setHora(e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                        inputProps={{ step: 1 }}
                                        helperText="Ex: 14:30:00"
                                    />
                                </Grid>
                            </>
                        ) : (
                            <>
                                <Grid item xs={12} sm={3} md={2.5}>
                                    <TextField
                                        label="Início (AAAA-MM-DD HH:MM:SS)"
                                        fullWidth
                                        size="small"
                                        required
                                        value={dataInicio}
                                        onChange={(e) => setDataInicio(e.target.value)}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={3} md={2}>
                                    <TextField
                                        label="Fim (AAAA-MM-DD HH:MM:SS)"
                                        fullWidth
                                        size="small"
                                        required
                                        value={dataFim}
                                        onChange={(e) => setDataFim(e.target.value)}
                                    />
                                </Grid>
                            </>
                        )}

                        <Grid item xs={12} sm={12} md={4}>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Button
                                    variant="contained"
                                    type="submit"
                                    disabled={loading}
                                    startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SearchIcon />}
                                    sx={{ minWidth: 160, height: 40 }}
                                >
                                    {loading ? 'Consultando...' : 'Localizar Titular'}
                                </Button>
                                <Button
                                    variant="text"
                                    size="small"
                                    onClick={() => setUsarIntervalo(!usarIntervalo)}
                                    sx={{ fontSize: '0.8rem' }}
                                >
                                    {usarIntervalo ? 'Modo Data/Hora' : 'Intervalo Livre'}
                                </Button>
                            </Stack>
                        </Grid>
                    </Grid>
                </form>

                {loading && (
                    <Box sx={{ mt: 3 }}>
                        <LinearProgress sx={{ height: 6, borderRadius: 3 }} />
                        <Typography variant="body2" sx={{ mt: 1, ...dashboardMutedTextSx }}>
                            Consultando registros de conexões no servidor RADIUS (RBX)... Esse processo faz uma varredura profunda no banco e pode levar de 30 a 90 segundos.
                        </Typography>
                    </Box>
                )}
            </Paper>

            {/* Alerta de Erro */}
            {error && !loading && (
                <Alert severity="warning" sx={{ mb: 3 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            {/* Aviso de cópia rápida */}
            {copiado && (
                <Alert severity="success" sx={{ mb: 3 }}>
                    Dados da sessão copiados para a área de transferência!
                </Alert>
            )}

            {/* Resultados Encontrados */}
            {resultado && resultado.sessoes && resultado.sessoes.length > 0 && (
                <Stack spacing={3}>
                    {/* Card de Destaque da Primeira Sessão / Titular */}
                    {(() => {
                        const principal = resultado.sessoes[0];
                        return (
                            <Card variant="outlined" sx={{ ...dashboardPanelSx, borderColor: '#00e5ff', borderWidth: 2 }}>
                                <CardContent>
                                    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} spacing={2} mb={2}>
                                        <Stack direction="row" alignItems="center" spacing={1.5}>
                                            <PersonPinIcon sx={{ fontSize: 40, color: '#00e5ff' }} />
                                            <Box>
                                                <Typography variant="caption" sx={dashboardMutedTextSx}>
                                                    TITULAR IDENTIFICADO
                                                </Typography>
                                                <Typography variant="h5" fontWeight={800}>
                                                    {principal.clienteNome}
                                                </Typography>
                                            </Box>
                                        </Stack>
                                        <Stack direction="row" spacing={1}>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                startIcon={<ContentCopyIcon />}
                                                onClick={() => copiarDados(principal)}
                                            >
                                                Copiar Resumo
                                            </Button>
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                size="small"
                                                startIcon={<PictureAsPdfIcon />}
                                                onClick={() => exportarPdf(principal)}
                                            >
                                                Exportar Laudo Oficial (PDF)
                                            </Button>
                                        </Stack>
                                    </Stack>

                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6} md={3}>
                                            <Paper variant="outlined" sx={{ ...dashboardMetricSx, p: 1.5 }}>
                                                <Typography variant="caption" sx={dashboardMutedTextSx}>CPF / CNPJ</Typography>
                                                <Typography variant="body1" fontWeight={700}>{principal.clienteCpfCnpj || 'Não informado'}</Typography>
                                            </Paper>
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={3}>
                                            <Paper variant="outlined" sx={{ ...dashboardMetricSx, p: 1.5 }}>
                                                <Typography variant="caption" sx={dashboardMutedTextSx}>LOGIN / USUÁRIO (PPPoE)</Typography>
                                                <Typography variant="body1" fontWeight={700} color="#00e5ff">{principal.username}</Typography>
                                            </Paper>
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={3}>
                                            <Paper variant="outlined" sx={{ ...dashboardMetricSx, p: 1.5 }}>
                                                <Typography variant="caption" sx={dashboardMutedTextSx}>CÓDIGO RBX / CIDADE</Typography>
                                                <Typography variant="body1" fontWeight={700}>#{principal.customerId} - {principal.clienteGrupo}</Typography>
                                            </Paper>
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={3}>
                                            <Paper variant="outlined" sx={{ ...dashboardMetricSx, p: 1.5 }}>
                                                <Typography variant="caption" sx={dashboardMutedTextSx}>SITUAÇÃO DO CONTRATO</Typography>
                                                <Typography variant="body1" fontWeight={800} sx={{ color: principal.clienteSituacao === 'A' ? 'success.main' : 'text.secondary' }}>
                                                    {principal.clienteSituacao === 'A' ? 'Ativo' : principal.clienteSituacao}
                                                </Typography>
                                            </Paper>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        );
                    })()}

                    {/* Tabela de Todas as Sessões Encontradas com Esse IP */}
                    <Paper variant="outlined" sx={{ ...dashboardPanelSx, p: 2 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                            <Box>
                                <Typography variant="h6" fontWeight={800}>
                                    Histórico de Sessões com o IP {resultado.ipBuscado}
                                </Typography>
                                <Typography variant="caption" sx={dashboardMutedTextSx}>
                                    Total de {resultado.totalSessoesEncontradas} registro(s) encontrado(s) no intervalo consultado
                                </Typography>
                            </Box>
                        </Stack>

                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Status da Conexão</TableCell>
                                        <TableCell>Início</TableCell>
                                        <TableCell>Término</TableCell>
                                        <TableCell>Duração</TableCell>
                                        <TableCell>Endereço MAC (ONU/CPE)</TableCell>
                                        <TableCell>Concentrador (NAS)</TableCell>
                                        <TableCell>Consumo (Down / Up)</TableCell>
                                        <TableCell>Causa de Desconexão</TableCell>
                                        <TableCell align="center">Ações</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {resultado.sessoes.map((sessao, idx) => (
                                        <TableRow key={idx} hover sx={{ bgcolor: sessao.ativaNoMomento ? 'rgba(0, 229, 255, 0.05)' : undefined }}>
                                            <TableCell>
                                                {sessao.ativaNoMomento ? (
                                                    <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        <CheckCircleOutlineIcon fontSize="small" /> Ativa no Horário
                                                    </Typography>
                                                ) : (
                                                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                                        Sessão no Período
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{sessao.startTime}</TableCell>
                                            <TableCell sx={{ whiteSpace: 'nowrap' }}>{sessao.stopTime || 'Conexão ativa'}</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }}>{sessao.duracaoFormatada}</TableCell>
                                            <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{sessao.mac}</TableCell>
                                            <TableCell>{sessao.nas}</TableCell>
                                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                                {sessao.downloadFormatado} / {sessao.uploadFormatado}
                                            </TableCell>
                                            <TableCell>
                                                <Tooltip title={sessao.terminateCause || 'Ativa'}>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            color: sessao.terminateCause === 'Lost-Carrier' ? 'warning.main' : 'text.secondary',
                                                            fontWeight: 600
                                                        }}
                                                    >
                                                        {sessao.terminateCause || 'Ativa'}
                                                    </Typography>
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Stack direction="row" spacing={0.5} justifyContent="center">
                                                    <Tooltip title="Copiar resumo">
                                                        <IconButton size="small" onClick={() => copiarDados(sessao)}>
                                                            <ContentCopyIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Gerar Laudo PDF">
                                                        <IconButton size="small" color="primary" onClick={() => exportarPdf(sessao)}>
                                                            <PictureAsPdfIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Stack>
            )}
        </Box>
    );
}
