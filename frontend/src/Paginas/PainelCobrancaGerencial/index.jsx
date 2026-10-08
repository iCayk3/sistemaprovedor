import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import FileUploadRoundedIcon from '@mui/icons-material/FileUploadRounded';
import DeleteForeverRoundedIcon from '@mui/icons-material/DeleteForeverRounded';
import FlagRoundedIcon from '@mui/icons-material/FlagRounded';
import PictureAsPdfRoundedIcon from '@mui/icons-material/PictureAsPdfRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import SyncRoundedIcon from '@mui/icons-material/SyncRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import { BarChart, PieChart } from '@mui/x-charts';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Divider,
    LinearProgress,
    Paper,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Api from '../../Services/Api';
import {
    dashboardHeaderSx,
    dashboardChartSx,
    dashboardInputSx,
    dashboardMutedTextSx,
    dashboardPanelSx,
    dashboardShellSx,
    dashboardSubtleTextSx,
} from '../../Utils/DashboardTheme';

const UseApi = Api();

const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
}).format(Number(value || 0));
const formatDate = (value) => value ? new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR') : '—';
const formatDateTime = (value) => value ? new Date(value).toLocaleString('pt-BR') : '—';

const currentMonth = () => new Date().toISOString().slice(0, 7);
const previousMonth = (month) => {
    const [year, number] = month.split('-').map(Number);
    const date = new Date(year, number - 2, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};
const monthPeriod = (month) => {
    const [year, monthNumber] = month.split('-').map(Number);
    const lastDay = new Date(year, monthNumber, 0).getDate();
    return {
        from: `${month}-01`,
        to: `${month}-${String(lastDay).padStart(2, '0')}`,
    };
};
const emptyGoals = {
    metaRecebimento: '',
    metaRecuperacao: '',
    limiteInadimplencia: '',
    metaAcordos: '',
};
const inputNumber = (value) => value === '' || value === null || value === undefined ? null : Number(value);
const goalProgress = (actual, target, inverse = false) => {
    const result = Number(actual || 0);
    const goal = Number(target || 0);
    if (inverse) {
        if (result === 0) return 100;
        return Math.min(100, Math.max(0, (goal / result) * 100));
    }
    if (goal <= 0) return 0;
    return Math.min(100, Math.max(0, (result / goal) * 100));
};

export default function PainelCobrancaGerencial() {
    const [month, setMonth] = useState(currentMonth());
    const [financial, setFinancial] = useState(null);
    const [previousFinancial, setPreviousFinancial] = useState(null);
    const [operational, setOperational] = useState(null);
    const [previousOperational, setPreviousOperational] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [goals, setGoals] = useState(emptyGoals);
    const [goalAudit, setGoalAudit] = useState({ atualizadoEm: null, atualizadoPor: null });
    const [isAdmin, setIsAdmin] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        UseApi('usuario/me')
            .then((usuario) => setIsAdmin(usuario?.role === 'ADMIN'))
            .catch(() => setIsAdmin(false));
    }, []);

    useEffect(() => {
        let active = true;

        const loadFinancial = async () => {
            setLoading(true);
            setError('');
            setFinancial(null);
            try {
                const period = monthPeriod(month);
                const priorPeriod = monthPeriod(previousMonth(month));
                const [response, savedGoals, operationalResponse, previousOperationalResponse, previousFinancialResponse] = await Promise.all([
                    UseApi(`cobrancas/painel/financeiro?from=${period.from}&to=${period.to}&refresh=${Date.now()}`),
                    UseApi(`cobrancas/painel/metas?mes=${month}-01`),
                    UseApi(`cobrancas/painel/operacional?mes=${month}-01`),
                    UseApi(`cobrancas/painel/operacional?mes=${previousMonth(month)}-01`),
                    UseApi(`cobrancas/painel/financeiro?from=${priorPeriod.from}&to=${priorPeriod.to}&refresh=${Date.now()}`),
                ]);
                if (active) {
                    setFinancial(response);
                    setOperational(operationalResponse);
                    setPreviousOperational(previousOperationalResponse);
                    setPreviousFinancial(previousFinancialResponse);
                    setGoals({
                        metaRecebimento: savedGoals.metaRecebimento ?? '',
                        metaRecuperacao: savedGoals.metaRecuperacao ?? '',
                        limiteInadimplencia: savedGoals.limiteInadimplencia ?? '',
                        metaAcordos: savedGoals.metaAcordos ?? '',
                    });
                    setGoalAudit({ atualizadoEm: savedGoals.atualizadoEm, atualizadoPor: savedGoals.atualizadoPor });
                }
            } catch (requestError) {
                if (active) setError(requestError.message || 'Erro ao carregar o faturamento mensal do RBX.');
            } finally {
                if (active) setLoading(false);
            }
        };
        loadFinancial();

        return () => {
            active = false;
        };
    }, [month, reloadKey]);

    const importSpreadsheet = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;
        setActionLoading(true);
        setError('');
        setSuccess('');
        try {
            const data = new FormData();
            data.append('arquivo', file);
            const response = await UseApi(
                `cobrancas/painel/faturamento/importar?mes=${month}-01`,
                'POST',
                data,
            );
            setFinancial(response);
            const imported = response?.imported || {};
            const ignored = Number(imported.ignoredFromOtherMonths || 0);
            const existing = Number(imported.existingDocuments || 0);
            setSuccess(`Faturamento de ${month} atualizado: ${Number(imported.documents || 0).toLocaleString('pt-BR')} novo(s) título(s) incluído(s).${existing ? ` ${existing.toLocaleString('pt-BR')} título(s) já existente(s) foram mantidos sem duplicar.` : ''} A verificação das baixas está sendo executada em segundo plano.${ignored ? ` ${ignored.toLocaleString('pt-BR')} linha(s) de outros meses foram ignoradas.` : ''}`);
        } catch (requestError) {
            setError(requestError.message || 'Erro ao importar a planilha de faturamento.');
        } finally {
            setActionLoading(false);
        }
    };

    const resetBillingMonth = async () => {
        const reference = month.split('-').reverse().join('/');
        if (!window.confirm(`Zerar somente o faturamento de ${reference}? Títulos importados e cobranças automáticas ainda não capturadas dessa competência serão removidos.`)) return;
        setActionLoading(true);
        setError('');
        setSuccess('');
        try {
            const response = await UseApi(`cobrancas/painel/faturamento?mes=${month}-01`, 'DELETE');
            const reset = response?.reset || {};
            setFinancial(response);
            setSuccess(`Faturamento de ${reference} zerado: ${Number(reset.documents || 0).toLocaleString('pt-BR')} título(s) e ${Number(reset.automaticCharges || 0).toLocaleString('pt-BR')} cobrança(s) automática(s) não capturada(s) removidos.`);
            setReloadKey((value) => value + 1);
        } catch (requestError) {
            setError(requestError.message || 'Erro ao zerar o faturamento do mês.');
        } finally {
            setActionLoading(false);
        }
    };

    const saveGoals = async () => {
        setActionLoading(true);
        setError('');
        setSuccess('');
        try {
            const saved = await UseApi(`cobrancas/painel/metas?mes=${month}-01`, 'PUT', {
                mesReferencia: `${month}-01`,
                metaRecebimento: inputNumber(goals.metaRecebimento),
                metaRecuperacao: inputNumber(goals.metaRecuperacao),
                limiteInadimplencia: inputNumber(goals.limiteInadimplencia),
                metaAcordos: inputNumber(goals.metaAcordos),
            });
            setGoals({
                metaRecebimento: saved.metaRecebimento ?? '',
                metaRecuperacao: saved.metaRecuperacao ?? '',
                limiteInadimplencia: saved.limiteInadimplencia ?? '',
                metaAcordos: saved.metaAcordos ?? '',
            });
            setGoalAudit({ atualizadoEm: saved.atualizadoEm, atualizadoPor: saved.atualizadoPor });
            setSuccess(`Metas de ${month.split('-').reverse().join('/')} salvas com sucesso.`);
        } catch (requestError) {
            setError(requestError.message || 'Erro ao salvar as metas mensais.');
        } finally {
            setActionLoading(false);
        }
    };

    const syncSpreadsheet = async () => {
        setActionLoading(true);
        setError('');
        setSuccess('');
        try {
            const response = await UseApi(
                `cobrancas/painel/faturamento/sincronizar?mes=${month}-01`,
                'POST',
            );
            setFinancial(response);
            setSuccess('Baixas sincronizadas com o RBX.');
        } catch (requestError) {
            setError(requestError.message || 'Erro ao sincronizar as baixas com o RBX.');
        } finally {
            setActionLoading(false);
        }
    };

    const billing = financial?.billing?.totals || {};
    const previousBilling = previousFinancial?.billing?.totals || {};
    const hasImportedBilling = financial?.billing?.source === 'PLANILHA';
    const collectionRate = Number(billing.collectionRate || 0);
    const billingDueDates = financial?.billing?.dueDates || [];
    const closing = operational?.closing || {};
    const agreementsReport = operational?.agreements || {};
    const operationalResults = operational?.results || {};
    const collectionIndicators = operational?.indicators || {};
    const previousCollectionIndicators = previousOperational?.indicators || {};
    const productivity = Array.isArray(operational?.productivity) ? operational.productivity : [];
    const selectedIsCurrentMonth = month === currentMonth();
    const selectedIsPastMonth = month < currentMonth();
    const [selectedYear, selectedMonthNumber] = month.split('-').map(Number);
    const daysInSelectedMonth = new Date(selectedYear, selectedMonthNumber, 0).getDate();
    const elapsedDays = selectedIsCurrentMonth ? Math.min(new Date().getDate(), daysInSelectedMonth) : (selectedIsPastMonth ? daysInSelectedMonth : 0);
    const expectedProgress = daysInSelectedMonth > 0 ? (elapsedDays / daysInSelectedMonth) * 100 : 0;
    const remainingDays = Math.max(0, daysInSelectedMonth - elapsedDays);
    const projectValue = (actual, inverse = false) => {
        if (inverse || selectedIsPastMonth || elapsedDays <= 0) return Number(actual || 0);
        return (Number(actual || 0) / elapsedDays) * daysInSelectedMonth;
    };
    const statusForGoal = (actual, target, inverse = false) => {
        if (target === '' || target === null || target === undefined) return { label: 'Meta não definida', color: 'warning' };
        const result = Number(actual || 0);
        const goal = Number(target || 0);
        if (inverse) return result <= goal ? { label: 'Dentro da meta', color: 'success' } : { label: 'Acima do limite', color: 'error' };
        if (result >= goal) return { label: 'Meta atingida', color: 'success' };
        if (selectedIsPastMonth) return { label: 'Abaixo da meta', color: 'error' };
        const expectedValue = goal * (expectedProgress / 100);
        return result >= expectedValue * 0.9 ? { label: 'No ritmo', color: 'success' } : { label: 'Em risco', color: 'error' };
    };
    const goalIndicators = [
        {
            key: 'metaRecebimento',
            label: 'Meta de recebimento',
            unit: 'R$',
            actual: Number(collectionIndicators.valorRecuperado || 0),
            result: formatCurrency(collectionIndicators.valorRecuperado || 0),
            previous: Number(previousCollectionIndicators.valorRecuperado || 0),
            detail: 'Valor recuperado em atendimentos de cobrança no mês',
        },
        {
            key: 'metaRecuperacao',
            label: 'Meta de recuperação',
            unit: '%',
            actual: Number(collectionIndicators.percentualRecuperado || 0),
            result: `${Number(collectionIndicators.percentualRecuperado || 0).toFixed(1).replace('.', ',')}%`,
            previous: Number(previousCollectionIndicators.percentualRecuperado || 0),
            detail: `Recuperado sobre ${formatCurrency(collectionIndicators.carteiraTrabalhada || 0)} trabalhados`,
        },
        {
            key: 'limiteInadimplencia',
            label: 'Limite de inadimplência',
            unit: '%',
            actual: Number(billing.delinquencyRate || 0),
            inverse: true,
            result: `${Number(billing.delinquencyRate || 0).toFixed(1).replace('.', ',')}%`,
            previous: Number(previousBilling.delinquencyRate || 0),
            detail: `Títulos vencidos em aberto sobre o faturamento de ${billing.delinquencyYear || month.slice(0, 4)}`,
        },
        {
            key: 'metaAcordos',
            label: 'Meta de acordos',
            unit: 'Qtd.',
            actual: Number(collectionIndicators.acordos || 0),
            result: Number(collectionIndicators.acordos || 0).toLocaleString('pt-BR'),
            previous: Number(previousCollectionIndicators.acordos || 0),
            detail: 'Acordos registrados nos atendimentos de cobrança no mês',
        },
    ];
    const formatGoalMetric = (indicator, value, difference = false) => {
        if (indicator.unit === 'R$') return formatCurrency(value);
        if (indicator.unit === '%') return `${Number(value || 0).toFixed(1).replace('.', ',')}${difference ? ' p.p.' : '%'}`;
        return Number(value || 0).toLocaleString('pt-BR');
    };
    const generateManagementReport = () => {
        const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 36;
        const contentWidth = pageWidth - margin * 2;
        const money = (value) => formatCurrency(value).replace(/\u00a0/g, ' ');
        const metric = (indicator, value) => formatGoalMetric(indicator, value).replace(/\u00a0/g, ' ');
        const periodLabel = month.split('-').reverse().join('/');
        const generatedAt = new Date().toLocaleString('pt-BR');
        const colors = {
            navy: [19, 38, 66],
            cyan: [23, 168, 255],
            red: [226, 76, 76],
            light: [184, 215, 245],
            text: [30, 41, 59],
            muted: [91, 106, 126],
            border: [213, 222, 232],
            soft: [246, 249, 252],
            green: [38, 150, 92],
        };
        const addHeader = (section) => {
            doc.setFillColor(...colors.navy);
            doc.rect(0, 0, pageWidth, 76, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(17);
            doc.text('Relatório Gerencial de Cobrança', margin, 31);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.text(`Competência: ${periodLabel}  |  Emitido em: ${generatedAt}`, margin, 49);
            doc.setTextColor(...colors.cyan);
            doc.setFont('helvetica', 'bold');
            doc.text(section, margin, 65);
            doc.setTextColor(...colors.text);
        };
        const addSectionTitle = (title, y) => {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(...colors.navy);
            doc.text(title, margin, y);
            doc.setDrawColor(...colors.cyan);
            doc.setLineWidth(1.5);
            doc.line(margin, y + 5, pageWidth - margin, y + 5);
        };
        const addSummaryCard = (x, y, width, title, value, detail, accent = colors.cyan) => {
            doc.setFillColor(...colors.soft);
            doc.setDrawColor(...colors.border);
            doc.roundedRect(x, y, width, 78, 5, 5, 'FD');
            doc.setFillColor(...accent);
            doc.roundedRect(x, y, 5, 78, 5, 5, 'F');
            doc.setTextColor(...colors.muted);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.text(title, x + 13, y + 18, { maxWidth: width - 22 });
            doc.setTextColor(...colors.text);
            doc.setFontSize(14);
            doc.text(String(value), x + 13, y + 40, { maxWidth: width - 22 });
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5);
            doc.setTextColor(...colors.muted);
            doc.text(String(detail), x + 13, y + 57, { maxWidth: width - 22 });
        };
        const addGoalCard = (indicator, x, y, width, height) => {
            const target = Number(goals[indicator.key] || 0);
            const current = Number(indicator.actual || 0);
            const prior = Number(indicator.previous || 0);
            const maximum = Math.max(target, current, prior, 1);
            const status = statusForGoal(current, goals[indicator.key], indicator.inverse);
            doc.setFillColor(255, 255, 255);
            doc.setDrawColor(...colors.border);
            doc.roundedRect(x, y, width, height, 6, 6, 'FD');
            doc.setTextColor(...colors.navy);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.text(indicator.label, x + 12, y + 18);
            doc.setFontSize(15);
            doc.text(indicator.result, x + 12, y + 40);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5);
            doc.setTextColor(...colors.muted);
            doc.text(status.label, x + width - 12, y + 18, { align: 'right' });
            const rows = [
                ['Meta', target, colors.light],
                ['Atual', current, colors.cyan],
                ['Anterior', prior, colors.red],
            ];
            rows.forEach(([label, value, color], index) => {
                const rowY = y + 62 + index * 28;
                doc.setTextColor(...colors.muted);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(7.5);
                doc.text(label, x + 12, rowY);
                doc.setFillColor(232, 237, 243);
                doc.roundedRect(x + 62, rowY - 7, width - 132, 8, 3, 3, 'F');
                doc.setFillColor(...color);
                doc.roundedRect(x + 62, rowY - 7, Math.max(1, ((width - 132) * Number(value)) / maximum), 8, 3, 3, 'F');
                doc.setTextColor(...colors.text);
                doc.setFont('helvetica', 'normal');
                doc.text(metric(indicator, value), x + width - 12, rowY, { align: 'right' });
            });
            doc.setTextColor(...colors.muted);
            doc.setFontSize(7.2);
            const note = indicator.inverse
                ? 'Quanto menor o realizado em relação ao limite, melhor.'
                : `Projeção: ${metric(indicator, projectValue(current))}`;
            doc.text(note, x + 12, y + height - 13, { maxWidth: width - 24 });
        };

        addHeader('Indicadores e metas');
        addSectionTitle('Visão executiva das metas', 101);
        const goalGap = 12;
        const goalWidth = (contentWidth - goalGap) / 2;
        goalIndicators.forEach((indicator, index) => {
            const x = margin + (index % 2) * (goalWidth + goalGap);
            const y = 118 + Math.floor(index / 2) * 174;
            addGoalCard(indicator, x, y, goalWidth, 160);
        });
        doc.setFillColor(...colors.soft);
        doc.setDrawColor(...colors.border);
        doc.roundedRect(margin, 474, contentWidth, 66, 5, 5, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(...colors.navy);
        doc.text('Leitura do período', margin + 12, 493);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...colors.muted);
        doc.text(selectedIsCurrentMonth
            ? `${remainingDays} dia(s) restante(s); ${expectedProgress.toFixed(1).replace('.', ',')}% do período transcorrido.`
            : selectedIsPastMonth ? 'Competência encerrada.' : 'Competência futura.', margin + 12, 510);
        doc.text(`Atendimentos aguardando captura e fora dos resultados: ${Number(collectionIndicators.aguardandoCaptura || 0).toLocaleString('pt-BR')} (${money(collectionIndicators.valorAguardandoCaptura)}).`, margin + 12, 526);

        doc.addPage();
        addHeader('Operação mensal da cobrança');
        addSectionTitle('Resumo operacional', 101);
        const summaryGap = 8;
        const summaryWidth = (contentWidth - summaryGap * 3) / 4;
        addSummaryCard(margin, 116, summaryWidth, 'Atendimentos encerrados', Number(closing.fechadasNoMes || 0).toLocaleString('pt-BR'), `${money(closing.valorFechadasNoMes)} em títulos`, colors.green);
        addSummaryCard(margin + (summaryWidth + summaryGap), 116, summaryWidth, 'Valor recuperado', money(closing.recebidoPelaEquipe), `${Number(operationalResults.closed || 0).toLocaleString('pt-BR')} encerramento(s)`, colors.cyan);
        addSummaryCard(margin + (summaryWidth + summaryGap) * 2, 116, summaryWidth, 'Acordos realizados', Number(agreementsReport.count || 0).toLocaleString('pt-BR'), `${money(agreementsReport.value)} negociados`, [139, 109, 177]);
        addSummaryCard(margin + (summaryWidth + summaryGap) * 3, 116, summaryWidth, 'Carteira trabalhada', money(operationalResults.workedValue), `${Number(operationalResults.actions || 0).toLocaleString('pt-BR')} ações`, colors.cyan);
        addSectionTitle('Produtividade por usuário', 222);
        autoTable(doc, {
            startY: 234,
            margin: { left: margin, right: margin },
            head: [['Usuário', 'Aberturas', 'Encerramentos', 'Ações', 'Carteira', 'Acordos', 'Recebido']],
            body: productivity.map((row) => [
                row.usuario,
                `${Number(row.aberturas || 0).toLocaleString('pt-BR')}\n${money(row.valorAberturas)}`,
                `${Number(row.encerramentos || 0).toLocaleString('pt-BR')}\n${money(row.valorEncerramentos)}`,
                Number(row.acoes || 0).toLocaleString('pt-BR'),
                money(row.carteiraTrabalhada),
                `${Number(row.acordos || 0).toLocaleString('pt-BR')}\n${money(row.valorAcordos)}`,
                `${Number(row.pagamentos || 0).toLocaleString('pt-BR')}\n${money(row.valorPagamentos)}`,
            ]),
            theme: 'grid',
            styles: { font: 'helvetica', fontSize: 7, cellPadding: 4, textColor: colors.text, lineColor: colors.border },
            headStyles: { fillColor: colors.navy, textColor: [255, 255, 255], fontStyle: 'bold' },
            alternateRowStyles: { fillColor: colors.soft },
        });

        doc.addPage();
        addHeader('Faturamento e inadimplência');
        addSectionTitle('Resumo financeiro da competência', 101);
        const financialWidth = (contentWidth - 18) / 3;
        addSummaryCard(margin, 116, financialWidth, 'Faturado', money(billing.billed), `${Number(billing.documents || 0).toLocaleString('pt-BR')} títulos`, [139, 109, 177]);
        addSummaryCard(margin + financialWidth + 9, 116, financialWidth, 'Recebido', money(billing.received), `${Number(billing.receivedDocuments || 0).toLocaleString('pt-BR')} títulos baixados`, colors.green);
        addSummaryCard(margin + (financialWidth + 9) * 2, 116, financialWidth, 'Em aberto', money(billing.open), `${Number(billing.openDocuments || 0).toLocaleString('pt-BR')} títulos`, colors.red);
        addSectionTitle('Valores faturados por vencimento', 222);
        autoTable(doc, {
            startY: 234,
            margin: { left: margin, right: margin },
            head: [['Vencimento', 'Títulos', 'Faturado', 'Recebido', 'Em aberto']],
            body: billingDueDates.map((row) => [
                row.dueDateLabel || formatDate(row.dueDate),
                Number(row.documents || 0).toLocaleString('pt-BR'),
                money(row.billed),
                money(row.received),
                money(row.open),
            ]),
            theme: 'grid',
            styles: { font: 'helvetica', fontSize: 8, cellPadding: 5, textColor: colors.text, lineColor: colors.border },
            headStyles: { fillColor: colors.navy, textColor: [255, 255, 255], fontStyle: 'bold' },
            alternateRowStyles: { fillColor: colors.soft },
        });
        const delinquencyY = Math.min((doc.lastAutoTable?.finalY || 280) + 28, 650);
        addSectionTitle(`Inadimplência acumulada de ${billing.delinquencyYear || selectedYear}`, delinquencyY);
        addSummaryCard(margin, delinquencyY + 15, financialWidth, 'Índice de inadimplência', `${Number(billing.delinquencyRate || 0).toFixed(1).replace('.', ',')}%`, 'Sobre o faturamento anual', colors.red);
        addSummaryCard(margin + financialWidth + 9, delinquencyY + 15, financialWidth, 'Valor vencido em aberto', money(billing.delinquent), `${Number(billing.delinquentDocuments || 0).toLocaleString('pt-BR')} boletos`, colors.red);
        addSummaryCard(margin + (financialWidth + 9) * 2, delinquencyY + 15, financialWidth, 'Fonte dos dados', hasImportedBilling ? 'Planilha importada' : 'Sem importação', `Competência ${periodLabel}`, hasImportedBilling ? colors.green : colors.red);

        const totalPages = doc.getNumberOfPages();
        for (let page = 1; page <= totalPages; page += 1) {
            doc.setPage(page);
            doc.setDrawColor(...colors.border);
            doc.line(margin, pageHeight - 28, pageWidth - margin, pageHeight - 28);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5);
            doc.setTextColor(...colors.muted);
            doc.text('Sistema de Gestão do Provedor • Relatório gerado a partir dos dados consolidados do painel', margin, pageHeight - 15);
            doc.text(`Página ${page} de ${totalPages}`, pageWidth - margin, pageHeight - 15, { align: 'right' });
        }
        doc.save(`relatorio-cobranca-${month}.pdf`);
    };

    return (
        <Box sx={{ ...dashboardShellSx, py: 2 }}>
            <Paper variant="outlined" sx={{ ...dashboardHeaderSx, p: 2, mb: 2 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
                    <Box>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <AssessmentRoundedIcon />
                            <Typography variant="h5" fontWeight={900}>Painel gerencial da cobrança</Typography>
                        </Stack>
                        <Typography color="#e8f8ff">
                            Dashboard independente para construir os relatórios e indicadores do setor.
                        </Typography>
                    </Box>
                    <Stack direction="row" flexWrap="wrap" spacing={1} alignItems="center">
                        <TextField
                            size="small"
                            type="month"
                            label="Mês de referência"
                            value={month}
                            onChange={(event) => setMonth(event.target.value)}
                            InputLabelProps={{ shrink: true }}
                            sx={{ minWidth: 160, ...dashboardInputSx }}
                        />
                        <Button
                            size="small"
                            variant="contained"
                            color="secondary"
                            startIcon={<PictureAsPdfRoundedIcon fontSize="small" />}
                            onClick={generateManagementReport}
                            disabled={loading || actionLoading || !financial || !operational}
                            sx={{
                                textTransform: 'none',
                                whiteSpace: 'nowrap',
                                fontWeight: 700,
                                fontSize: '0.8125rem',
                                height: 36,
                                px: 1.5,
                            }}
                        >
                            Gerar relatório PDF
                        </Button>
                        <Button
                            component="label"
                            size="small"
                            variant="contained"
                            color="inherit"
                            startIcon={<FileUploadRoundedIcon fontSize="small" />}
                            disabled={actionLoading}
                            sx={{
                                textTransform: 'none',
                                whiteSpace: 'nowrap',
                                fontWeight: 700,
                                fontSize: '0.8125rem',
                                height: 36,
                                px: 1.5,
                            }}
                        >
                            Importar Excel
                            <input hidden type="file" accept=".xls,.xlsx" onChange={importSpreadsheet} />
                        </Button>
                        {isAdmin && (
                            <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                startIcon={<DeleteForeverRoundedIcon fontSize="small" />}
                                onClick={resetBillingMonth}
                                disabled={actionLoading || financial?.billing?.source !== 'PLANILHA'}
                                sx={{
                                    textTransform: 'none',
                                    whiteSpace: 'nowrap',
                                    fontWeight: 700,
                                    fontSize: '0.8125rem',
                                    height: 36,
                                    px: 1.5,
                                    bgcolor: 'rgba(239, 68, 68, 0.08)',
                                    '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.16)' },
                                }}
                            >
                                Zerar mês
                            </Button>
                        )}
                        <Button
                            size="small"
                            variant="outlined"
                            color="inherit"
                            startIcon={<SyncRoundedIcon fontSize="small" />}
                            onClick={syncSpreadsheet}
                            disabled={actionLoading || financial?.billing?.source !== 'PLANILHA'}
                            sx={{
                                textTransform: 'none',
                                whiteSpace: 'nowrap',
                                fontWeight: 700,
                                fontSize: '0.8125rem',
                                height: 36,
                                px: 1.5,
                            }}
                        >
                            Sincronizar
                        </Button>
                    </Stack>
                </Stack>
            </Paper>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            {loading ? (
                <Stack minHeight={300} alignItems="center" justifyContent="center">
                    <CircularProgress />
                </Stack>
            ) : (
                <Paper variant="outlined" sx={{ ...dashboardPanelSx, p: 2 }}>
                    <Paper
                        variant="outlined"
                        sx={{
                            p: { xs: 2, md: 2.5 },
                            mb: 2.5,
                            borderRadius: 2.5,
                            borderColor: 'rgba(23,226,232,0.4)',
                            background: 'linear-gradient(135deg, rgba(23,226,232,0.10), rgba(139,109,177,0.08))',
                        }}
                    >
                        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={1} mb={2}>
                            <Box>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <FlagRoundedIcon color="primary" />
                                    <Typography variant="h6" fontWeight={900}>Atualização dos indicadores e metas do setor</Typography>
                                </Stack>
                                <Typography variant="caption" sx={dashboardMutedTextSx}>
                                    Metas e acompanhamento gerencial de {month.split('-').reverse().join('/')}
                                </Typography>
                                {goalAudit.atualizadoEm && (
                                    <Typography variant="caption" display="block" sx={dashboardSubtleTextSx}>
                                        Última alteração: {formatDateTime(goalAudit.atualizadoEm)} por {goalAudit.atualizadoPor || 'usuário não identificado'}
                                    </Typography>
                                )}
                            </Box>
                            <Button
                                size="small"
                                variant="contained"
                                startIcon={<SaveRoundedIcon fontSize="small" />}
                                onClick={saveGoals}
                                disabled={actionLoading}
                                sx={{
                                    textTransform: 'none',
                                    whiteSpace: 'nowrap',
                                    fontWeight: 700,
                                    fontSize: '0.8125rem',
                                    height: 36,
                                    px: 1.5,
                                }}
                            >
                                Salvar metas do mês
                            </Button>
                        </Stack>

                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', xl: 'repeat(4, 1fr)' }, gap: 1.5 }}>
                            {goalIndicators.map((indicator) => (
                                <Paper key={indicator.label} variant="outlined" sx={{ p: 1.5, borderRadius: 1.5, bgcolor: 'rgba(255,255,255,0.025)' }}>
                                    <Typography fontWeight={800} mb={1}>{indicator.label}</Typography>
                                    <Stack direction="row" spacing={1}>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            label={`Meta de ${month.split('-').reverse().join('/')}`}
                                            type="number"
                                            value={goals[indicator.key]}
                                            onChange={(event) => setGoals((current) => ({ ...current, [indicator.key]: event.target.value }))}
                                            placeholder="Informe a meta"
                                            InputLabelProps={{ shrink: true }}
                                            inputProps={{ min: 0, max: indicator.unit === '%' ? 100 : undefined, step: indicator.unit === 'Qtd.' ? 1 : 0.01 }}
                                            sx={dashboardInputSx}
                                        />
                                        <TextField
                                            size="small"
                                            label="Unidade"
                                            value={indicator.unit}
                                            InputProps={{ readOnly: true }}
                                            InputLabelProps={{ shrink: true }}
                                            sx={{ width: 92, ...dashboardInputSx }}
                                        />
                                    </Stack>
                                </Paper>
                            ))}
                        </Box>

                        {!hasImportedBilling && (
                            <Alert severity="warning" variant="outlined" sx={{ mt: 1.5 }}>
                                O limite de inadimplência está sem uma base de faturamento importada para a competência selecionada.
                            </Alert>
                        )}
                        {Number(collectionIndicators.aguardandoCaptura || 0) > 0 && (
                            <Alert severity="info" variant="outlined" sx={{ mt: 1.5 }}>
                                {Number(collectionIndicators.aguardandoCaptura).toLocaleString('pt-BR')} atendimento(s), no valor de {formatCurrency(collectionIndicators.valorAguardandoCaptura)}, aguardam a primeira captura e ainda não entram nos resultados da equipe.
                            </Alert>
                        )}

                        <Divider sx={{ my: 2 }} />
                        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1} mb={1.5}>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <TrendingUpRoundedIcon color="primary" />
                                <Typography fontWeight={900}>Resultados sobre as metas</Typography>
                            </Stack>
                            <Typography variant="caption" sx={dashboardMutedTextSx}>
                                {selectedIsCurrentMonth ? `${remainingDays} dia(s) restante(s) • ${expectedProgress.toFixed(1).replace('.', ',')}% do período transcorrido` : selectedIsPastMonth ? 'Período encerrado' : 'Período futuro'}
                            </Typography>
                        </Stack>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', xl: 'repeat(4, 1fr)' }, gap: 1.5 }}>
                            {goalIndicators.map((indicator) => (
                                <Paper
                                    key={`result-${indicator.label}`}
                                    variant="outlined"
                                    sx={{ p: 1.5, borderRadius: 1.5, bgcolor: 'rgba(255,255,255,0.035)', display: 'flex', flexDirection: 'column', minWidth: 0 }}
                                >
                                    <Typography variant="caption" sx={dashboardMutedTextSx}>{indicator.label}</Typography>
                                    <Typography variant="h5" fontWeight={900} my={0.5}>{indicator.result}</Typography>
                                    <Stack component="ul" spacing={0.45} sx={{ m: 0, pl: 2.2, minHeight: 82 }}>
                                        <Typography component="li" variant="caption" sx={dashboardMutedTextSx}>{indicator.detail}</Typography>
                                        {indicator.previous !== null && (
                                            <Typography component="li" variant="caption" sx={dashboardSubtleTextSx}>
                                                Mês anterior: {formatGoalMetric(indicator, indicator.previous)}
                                            </Typography>
                                        )}
                                        {indicator.previous !== null && (
                                            <Typography component="li" variant="caption" sx={dashboardSubtleTextSx}>
                                                Variação: {indicator.actual >= indicator.previous ? '+' : ''}{formatGoalMetric(indicator, indicator.actual - indicator.previous, true)}
                                            </Typography>
                                        )}
                                        {!indicator.inverse && selectedIsCurrentMonth && (
                                            <Typography component="li" variant="caption" sx={dashboardSubtleTextSx}>
                                                Projeção de fechamento: {formatGoalMetric(indicator, projectValue(indicator.actual))}
                                            </Typography>
                                        )}
                                    </Stack>
                                    {goals[indicator.key] !== '' && (
                                        <LinearProgress
                                            variant="determinate"
                                            value={goalProgress(indicator.actual, goals[indicator.key], indicator.inverse)}
                                            color={indicator.inverse
                                                ? (indicator.actual <= Number(goals[indicator.key]) ? 'success' : 'error')
                                                : (indicator.actual >= Number(goals[indicator.key]) ? 'success' : 'primary')}
                                            sx={{ mt: 1.2, height: 8, borderRadius: 5 }}
                                        />
                                    )}
                                    <Divider sx={{ my: 1 }} />
                                    <Stack spacing={0.3} alignItems="flex-start">
                                        <Typography
                                            variant="body2"
                                            fontWeight={800}
                                            color={
                                                statusForGoal(indicator.actual, goals[indicator.key], indicator.inverse).color === 'success'
                                                    ? 'success.main'
                                                    : statusForGoal(indicator.actual, goals[indicator.key], indicator.inverse).color === 'error'
                                                    ? 'error.main'
                                                    : 'warning.main'
                                            }
                                        >
                                            {statusForGoal(indicator.actual, goals[indicator.key], indicator.inverse).label}
                                        </Typography>
                                        {goals[indicator.key] !== '' && !indicator.inverse && (
                                            <Typography variant="caption" sx={dashboardMutedTextSx} fontWeight={600}>
                                                {`${Number(goals[indicator.key]) > 0 ? ((indicator.actual / Number(goals[indicator.key])) * 100).toFixed(1).replace('.', ',') : '0,0'}% da meta`}
                                            </Typography>
                                        )}
                                    </Stack>
                                    <Box sx={{ mt: 'auto', pt: 0.5 }}>
                                        <Divider sx={{ my: 1.2 }} />
                                        <Typography variant="caption" fontWeight={800} display="block" minHeight={20}>
                                            {indicator.inverse ? 'Comparativo — menor que o limite é melhor' : 'Comparativo do indicador'}
                                        </Typography>
                                        <BarChart
                                            height={210}
                                            hideLegend
                                            xAxis={[{ scaleType: 'band', data: ['Meta', 'Atual', 'Anterior'] }]}
                                            yAxis={[{ min: 0, valueFormatter: (value) => formatGoalMetric(indicator, value) }]}
                                            series={[
                                                { data: [Number(goals[indicator.key] || 0), null, null], label: 'Meta', color: '#b8d7f5', valueFormatter: (value) => formatGoalMetric(indicator, value) },
                                                { data: [null, Number(indicator.actual || 0), null], label: 'Mês atual', color: '#17a8ff', valueFormatter: (value) => formatGoalMetric(indicator, value) },
                                                { data: [null, null, Number(indicator.previous || 0)], label: 'Mês anterior', color: '#ff5b5b', valueFormatter: (value) => formatGoalMetric(indicator, value) },
                                            ]}
                                            grid={{ horizontal: true }}
                                            margin={{ left: 58, right: 8, top: 12, bottom: 32 }}
                                            sx={dashboardChartSx}
                                        />
                                    </Box>
                                </Paper>
                            ))}
                        </Box>
                    </Paper>
                    <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 }, mb: 2.5, borderRadius: 2.5 }}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1} mb={2}>
                            <Box>
                                <Typography variant="h6" fontWeight={900}>Operação mensal da cobrança</Typography>
                                <Typography variant="caption" sx={dashboardMutedTextSx}>
                                    Consolidação dos atendimentos e históricos registrados em {month.split('-').reverse().join('/')}
                                </Typography>
                            </Box>
                            <Typography variant="caption" fontWeight={800} color="success.main">• Dados do sistema</Typography>
                        </Stack>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', xl: 'repeat(4, 1fr)' }, gap: 1.5 }}>
                            {[
                                ['Fechamento mensal do setor', `${Number(closing.fechadasNoMes || 0).toLocaleString('pt-BR')} encerradas • ${formatCurrency(closing.valorFechadasNoMes)}`, `${Number(closing.abertasNoMes || 0).toLocaleString('pt-BR')} abertas • ${formatCurrency(closing.valorAbertasNoMes)} • ${formatCurrency(closing.recebidoPelaEquipe)} recebido`],
                                ['Acordos realizados', Number(agreementsReport.count || 0).toLocaleString('pt-BR'), `${formatCurrency(agreementsReport.value)} negociado`],
                                ['Produtividade da equipe', `${productivity.length.toLocaleString('pt-BR')} usuário(s)`, `${Number(operationalResults.actions || 0).toLocaleString('pt-BR')} ações • ${formatCurrency(operationalResults.workedValue)} trabalhados`],
                                ['Resultados mensais', formatCurrency(operationalResults.received), `${Number(operationalResults.opened || 0).toLocaleString('pt-BR')} iniciadas (${formatCurrency(operationalResults.openedValue)}) • ${Number(operationalResults.closed || 0).toLocaleString('pt-BR')} encerradas (${formatCurrency(operationalResults.closedValue)})`],
                            ].map(([label, value, detail]) => (
                                <Paper key={label} variant="outlined" sx={{ p: 1.5, borderRadius: 1.5, bgcolor: 'rgba(255,255,255,0.03)' }}>
                                    <Typography variant="caption" sx={dashboardMutedTextSx}>{label}</Typography>
                                    <Typography variant="h6" fontWeight={900} my={0.6}>{value}</Typography>
                                    <Typography variant="caption" sx={dashboardMutedTextSx}>{detail}</Typography>
                                </Paper>
                            ))}
                        </Box>
                        {productivity.length > 0 && (
                            <Box sx={{ mt: 2 }}>
                                <Typography fontWeight={850} mb={1}>Detalhamento por usuário</Typography>
                                <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' } }}>
                                    {productivity.map((row) => (
                                        <Paper key={row.usuario} variant="outlined" sx={{ p: 1.25, borderRadius: 1.5 }}>
                                            <Typography fontWeight={800}>{row.usuario}</Typography>
                                            <Stack component="ul" spacing={0.35} sx={{ m: 0, mt: 0.7, pl: 2.2 }}>
                                                <Typography component="li" variant="body2"><strong>Aberturas:</strong> {Number(row.aberturas || 0).toLocaleString('pt-BR')} • {formatCurrency(row.valorAberturas)}</Typography>
                                                <Typography component="li" variant="body2"><strong>Encerramentos:</strong> {Number(row.encerramentos || 0).toLocaleString('pt-BR')} • {formatCurrency(row.valorEncerramentos)}</Typography>
                                                <Typography component="li" variant="body2"><strong>Ações:</strong> {Number(row.acoes || 0).toLocaleString('pt-BR')}</Typography>
                                                <Typography component="li" variant="body2"><strong>Clientes:</strong> {Number(row.clientes || 0).toLocaleString('pt-BR')}</Typography>
                                                <Typography component="li" variant="body2"><strong>Carteira trabalhada:</strong> {formatCurrency(row.carteiraTrabalhada)}</Typography>
                                                <Typography component="li" variant="body2"><strong>Acordos:</strong> {Number(row.acordos || 0).toLocaleString('pt-BR')} • {formatCurrency(row.valorAcordos)}</Typography>
                                                <Typography component="li" variant="body2"><strong>Pagamentos:</strong> {Number(row.pagamentos || 0).toLocaleString('pt-BR')} • {formatCurrency(row.valorPagamentos)}</Typography>
                                            </Stack>
                                        </Paper>
                                    ))}
                                </Box>
                            </Box>
                        )}
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, minmax(0, 1fr))' }, gap: 1.5, mt: 2 }}>
                            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.5, minWidth: 0 }}>
                                <Typography fontWeight={850}>Movimentação do mês</Typography>
                                <Typography variant="caption" sx={dashboardMutedTextSx}>Aberturas, encerramentos e acordos registrados</Typography>
                                <BarChart
                                    height={260}
                                    xAxis={[{ scaleType: 'band', data: ['Abertas', 'Encerradas', 'Acordos'] }]}
                                    series={[{ data: [Number(closing.abertasNoMes || 0), Number(closing.fechadasNoMes || 0), Number(agreementsReport.count || 0)], label: 'Quantidade', color: '#17e2e8' }]}
                                    margin={{ left: 45, right: 10, top: 30, bottom: 35 }}
                                    sx={dashboardChartSx}
                                />
                                <Stack spacing={0.35} mt={-1}>
                                    <Typography variant="caption" sx={dashboardMutedTextSx}>Abertas: {formatCurrency(closing.valorAbertasNoMes)}</Typography>
                                    <Typography variant="caption" sx={dashboardMutedTextSx}>Encerradas: {formatCurrency(closing.valorFechadasNoMes)}</Typography>
                                    <Typography variant="caption" sx={dashboardMutedTextSx}>Acordos: {formatCurrency(agreementsReport.value)}</Typography>
                                </Stack>
                            </Paper>
                            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.5, minWidth: 0 }}>
                                <Typography fontWeight={850}>Abertas x encerradas</Typography>
                                <Typography variant="caption" sx={dashboardMutedTextSx}>Distribuição dos atendimentos movimentados</Typography>
                                {(Number(closing.abertasNoMes || 0) + Number(closing.fechadasNoMes || 0)) > 0 ? (
                                    <PieChart
                                        height={260}
                                        series={[{
                                            data: [
                                                { id: 0, label: 'Abertas', value: Number(closing.abertasNoMes || 0), color: '#f6a609' },
                                                { id: 1, label: 'Encerradas', value: Number(closing.fechadasNoMes || 0), color: '#39d98a' },
                                            ],
                                            innerRadius: 48,
                                            paddingAngle: 3,
                                        }]}
                                        slotProps={{ legend: { direction: 'horizontal', position: { vertical: 'bottom', horizontal: 'middle' } } }}
                                        sx={dashboardChartSx}
                                    />
                                ) : (
                                    <Stack height={260} alignItems="center" justifyContent="center"><Typography sx={dashboardMutedTextSx}>Sem movimentações no período.</Typography></Stack>
                                )}
                                <Stack spacing={0.35} mt={-1}>
                                    <Typography variant="caption" sx={dashboardMutedTextSx}>Abertas: {formatCurrency(closing.valorAbertasNoMes)}</Typography>
                                    <Typography variant="caption" sx={dashboardMutedTextSx}>Encerradas: {formatCurrency(closing.valorFechadasNoMes)}</Typography>
                                </Stack>
                            </Paper>
                            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.5, minWidth: 0 }}>
                                <Typography fontWeight={850}>Produtividade por usuário</Typography>
                                <Typography variant="caption" sx={dashboardMutedTextSx}>Resultados atribuídos ao usuário que abriu/assumiu o atendimento</Typography>
                                {productivity.length > 0 ? (
                                    <BarChart
                                        height={260}
                                        xAxis={[{ scaleType: 'band', data: productivity.map((row) => row.usuario) }]}
                                        series={[
                                            { data: productivity.map((row) => Number(row.carteiraTrabalhada || 0)), label: 'Carteira', color: '#17e2e8', valueFormatter: (value) => formatCurrency(value) },
                                            { data: productivity.map((row) => Number(row.valorAcordos || 0)), label: 'Acordos', color: '#a98bd0', valueFormatter: (value) => formatCurrency(value) },
                                            { data: productivity.map((row) => Number(row.valorPagamentos || 0)), label: 'Recebido', color: '#39d98a', valueFormatter: (value) => formatCurrency(value) },
                                        ]}
                                        margin={{ left: 45, right: 10, top: 40, bottom: 55 }}
                                        sx={dashboardChartSx}
                                    />
                                ) : (
                                    <Stack height={260} alignItems="center" justifyContent="center"><Typography sx={dashboardMutedTextSx}>Sem ações no período.</Typography></Stack>
                                )}
                            </Paper>
                        </Box>
                    </Paper>
                    <Paper
                        variant="outlined"
                        sx={{
                            p: { xs: 2, md: 2.5 },
                            mb: 2.5,
                            borderRadius: 2.5,
                            borderColor: 'rgba(139,109,177,0.45)',
                            background: 'linear-gradient(135deg, rgba(139,109,177,0.13), rgba(23,226,232,0.05))',
                        }}
                    >
                        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={2}>
                            <Box sx={{ flex: 1 }}>
                                <Stack direction="row" spacing={1.2} alignItems="center" mb={1.5}>
                                    <Box sx={{ p: 1, borderRadius: 2, display: 'flex', bgcolor: 'rgba(139,109,177,0.18)', color: '#a98bd0' }}>
                                        <AccountBalanceWalletRoundedIcon />
                                    </Box>
                                    <Box>
                                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                            <Typography variant="h6" fontWeight={900}>Relatório de faturamento mensal</Typography>
                                            <Typography
                                                variant="caption"
                                                fontWeight={800}
                                                color={hasImportedBilling ? 'success.main' : 'warning.main'}
                                            >
                                                • {hasImportedBilling ? `${collectionRate.toFixed(1).replace('.', ',')}% recebido` : 'Aguardando importação'}
                                            </Typography>
                                        </Stack>
                                        <Typography variant="caption" sx={dashboardMutedTextSx}>
                                            Competência {month.split('-').reverse().join('/')} • Fonte: {hasImportedBilling ? 'planilha importada' : 'nenhuma importação'}
                                        </Typography>
                                    </Box>
                                </Stack>
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="stretch">
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption" sx={dashboardMutedTextSx}>Faturado</Typography>
                                        <Typography variant="h4" fontWeight={900} color="#a98bd0">
                                            {formatCurrency(billing.billed || 0)}
                                        </Typography>
                                    </Box>
                                    <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="caption" sx={dashboardMutedTextSx}>Recebido</Typography>
                                        <Typography variant="h4" fontWeight={900} color="primary.main">
                                            {formatCurrency(billing.received || 0)}
                                        </Typography>
                                    </Box>
                                </Stack>
                                <Typography mt={1.5} variant="body2" fontWeight={700}>
                                    Falta receber: {formatCurrency(billing.open || 0)}
                                </Typography>
                            </Box>
                            <Stack minWidth={{ md: 190 }} justifyContent="center" spacing={0.7}>
                                <Typography variant="caption" sx={dashboardMutedTextSx}>Títulos da competência</Typography>
                                <Typography variant="h5" fontWeight={900}>{Number(billing.documents || 0).toLocaleString('pt-BR')}</Typography>
                                <Typography variant="caption" sx={dashboardMutedTextSx}>
                                    {Number(billing.receivedDocuments || 0).toLocaleString('pt-BR')} baixados • {Number(billing.openDocuments || 0).toLocaleString('pt-BR')} em aberto{Number(billing.cancelledDocuments || 0) > 0 ? ` • ${Number(billing.cancelledDocuments).toLocaleString('pt-BR')} cancelados no RBX` : ''}
                                </Typography>
                            </Stack>
                        </Stack>
                    </Paper>
                    <Paper
                        variant="outlined"
                        sx={{
                            p: { xs: 2, md: 2.5 },
                            mb: 2.5,
                            borderRadius: 2.5,
                            borderColor: 'rgba(23,226,232,0.35)',
                            background: 'linear-gradient(135deg, rgba(23,226,232,0.08), rgba(139,109,177,0.06))',
                        }}
                    >
                        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1} mb={2}>
                            <Box>
                                <Typography variant="h6" fontWeight={900}>Relatório de valores faturados por vencimento</Typography>
                                <Typography variant="caption" sx={dashboardMutedTextSx}>
                                    Distribuição da competência {month.split('-').reverse().join('/')} conforme a data de vencimento da planilha
                                </Typography>
                            </Box>
                            <Typography
                                variant="caption"
                                fontWeight={800}
                                color={hasImportedBilling ? 'success.main' : 'warning.main'}
                            >
                                • {hasImportedBilling ? `${billingDueDates.length} vencimento(s)` : 'Aguardando importação'}
                            </Typography>
                        </Stack>
                        {billingDueDates.length === 0 ? (
                            <Typography sx={dashboardMutedTextSx}>Importe o faturamento deste mês para visualizar os vencimentos.</Typography>
                        ) : (
                            <Stack spacing={1}>
                                <Box sx={{ display: { xs: 'none', md: 'grid' }, gridTemplateColumns: '120px 1fr 1fr 1fr 120px', gap: 2, px: 1.5 }}>
                                    {['Vencimento', 'Faturado', 'Recebido', 'Falta receber', '% recebido'].map((label) => (
                                        <Typography key={label} variant="caption" fontWeight={800} sx={dashboardMutedTextSx}>{label}</Typography>
                                    ))}
                                </Box>
                                {billingDueDates.map((row) => (
                                    <Paper key={row.dueDate} variant="outlined" sx={{ p: 1.5, borderRadius: 1.5, bgcolor: 'rgba(255,255,255,0.025)' }}>
                                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: '120px 1fr 1fr 1fr 120px' }, gap: 2, alignItems: 'center' }}>
                                            <Box>
                                                <Typography fontWeight={900}>{row.dueDateLabel || formatDate(row.dueDate)}</Typography>
                                                <Typography variant="caption" sx={dashboardMutedTextSx}>{row.dateRange} • {Number(row.documents || 0).toLocaleString('pt-BR')} título(s)</Typography>
                                            </Box>
                                            <Box><Typography variant="caption" sx={{ ...dashboardMutedTextSx, display: { md: 'none' } }}>Faturado</Typography><Typography fontWeight={800}>{formatCurrency(row.billed)}</Typography></Box>
                                            <Box><Typography variant="caption" sx={{ ...dashboardMutedTextSx, display: { md: 'none' } }}>Recebido</Typography><Typography fontWeight={800} color="primary.main">{formatCurrency(row.received)}</Typography></Box>
                                            <Box><Typography variant="caption" sx={{ ...dashboardMutedTextSx, display: { md: 'none' } }}>Falta receber</Typography><Typography fontWeight={800}>{formatCurrency(row.open)}</Typography></Box>
                                            <Typography variant="body2" fontWeight={800} color="success.main">{`${Number(row.collectionRate || 0).toFixed(1).replace('.', ',')}%`}</Typography>
                                        </Box>
                                    </Paper>
                                ))}
                            </Stack>
                        )}
                    </Paper>
                    <Paper
                        variant="outlined"
                        sx={{
                            p: { xs: 2, md: 2.5 },
                            mb: 2.5,
                            borderRadius: 2.5,
                            borderColor: 'rgba(211,71,71,0.4)',
                            background: 'linear-gradient(135deg, rgba(211,71,71,0.10), rgba(139,109,177,0.05))',
                        }}
                    >
                        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} gap={2}>
                            <Box>
                                <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                                    <Typography variant="h6" fontWeight={900}>Relatório de inadimplência atualizado</Typography>
                                    <Typography
                                        variant="caption"
                                        fontWeight={800}
                                        color={Number(billing.delinquentDocuments || 0) > 0 ? 'error.main' : 'success.main'}
                                    >
                                        • {`${Number(billing.delinquencyRate || 0).toFixed(1).replace('.', ',')}% do faturamento`}
                                    </Typography>
                                </Stack>
                                <Typography variant="caption" sx={dashboardMutedTextSx}>
                                    Todos os títulos importados de {billing.delinquencyYear || month.slice(0, 4)} que venceram e continuam sem baixa
                                </Typography>
                            </Box>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} minWidth={{ md: 430 }}>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="caption" sx={dashboardMutedTextSx}>Valor vencido</Typography>
                                    <Typography variant="h5" fontWeight={900} color="error.main">{formatCurrency(billing.delinquent || 0)}</Typography>
                                </Box>
                                <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="caption" sx={dashboardMutedTextSx}>Boletos vencidos</Typography>
                                    <Typography variant="h5" fontWeight={900}>{Number(billing.delinquentDocuments || 0).toLocaleString('pt-BR')}</Typography>
                                </Box>
                            </Stack>
                        </Stack>
                    </Paper>
                </Paper>
            )}
        </Box>
    );
}
