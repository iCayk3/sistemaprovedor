import PictureAsPdfRoundedIcon from '@mui/icons-material/PictureAsPdfRounded';
import { Button, CircularProgress } from '@mui/material';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useState } from 'react';
import { dashboardHeaderButtonSx } from '../../Utils/DashboardTheme';

const defaultLogoPath = '/imagens/logo.png';
const brandName = 'SOL Provedor';
const reportColor = '#0f4c81';

const reportCss = `
    html, body {
        background: #ffffff !important;
    }

    .pdf-export-report,
    .pdf-export-report * {
        box-shadow: none !important;
        text-shadow: none !important;
    }

    .pdf-export-report {
        width: 1180px !important;
        max-width: 1180px !important;
        padding: 0 !important;
        background: #ffffff !important;
        color: #0f2630 !important;
        font-family: Arial, sans-serif !important;
    }

    .pdf-export-report .pdf-export-ignore,
    .pdf-export-report button,
    .pdf-export-report [role="button"],
    .pdf-export-report .MuiTabs-root,
    .pdf-export-report .MuiFormControl-root,
    .pdf-export-report .MuiToggleButtonGroup-root,
    .pdf-export-report .MuiAutocomplete-root {
        display: none !important;
    }

    .pdf-export-report .MuiBox-root,
    .pdf-export-report .MuiGrid-container,
    .pdf-export-report [style*="grid-template-columns"] {
        grid-template-columns: 1fr !important;
    }

    .pdf-export-report .MuiGrid-root {
        flex-basis: 100% !important;
        max-width: 100% !important;
    }

    .pdf-export-report .commercial-dashboard-title {
        padding: 18px !important;
    }

    .pdf-export-report .commercial-dashboard-title .MuiStack-root {
        flex-direction: row !important;
        align-items: center !important;
        justify-content: space-between !important;
    }

    .pdf-export-report .commercial-dashboard-title .MuiTypography-h4 {
        font-size: 30px !important;
        line-height: 1.1 !important;
    }

    .pdf-export-report .commercial-metric-grid {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 10px !important;
    }

    .pdf-export-report .commercial-metric-card {
        min-height: 84px !important;
        padding: 14px !important;
        break-inside: avoid !important;
        page-break-inside: avoid !important;
    }

    .pdf-export-report .commercial-two-column-grid {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 14px !important;
        align-items: stretch !important;
    }

    .pdf-export-report .commercial-chart-card {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
    }

    .pdf-export-report .commercial-chart-card [style*="grid-template-columns"] {
        grid-template-columns: minmax(0, 1fr) 260px !important;
        align-items: center !important;
    }

    .pdf-export-report .commercial-two-column-grid .commercial-chart-card [style*="grid-template-columns"] {
        grid-template-columns: 1fr !important;
    }

    .pdf-export-report .chart-value-list-row {
        grid-template-columns: 12px minmax(0, 1fr) auto !important;
        min-height: 30px !important;
        padding: 6px 8px !important;
    }

    .pdf-export-report .MuiStack-root {
        align-items: stretch !important;
        max-height: none !important;
        overflow: visible !important;
    }

    .pdf-export-report .MuiPaper-root {
        background: #ffffff !important;
        color: #0f2630 !important;
        border: 1px solid #c9dce2 !important;
        border-radius: 4px !important;
        overflow: visible !important;
    }

    .pdf-export-report .MuiTypography-root,
    .pdf-export-report .MuiTableCell-root,
    .pdf-export-report .MuiInputBase-input,
    .pdf-export-report .MuiSelect-select,
    .pdf-export-report .MuiChip-label {
        color: #0f2630 !important;
    }

    .pdf-export-report .MuiTypography-colorTextSecondary,
    .pdf-export-report .MuiFormHelperText-root,
    .pdf-export-report .MuiInputLabel-root {
        color: #496872 !important;
    }

    .pdf-export-report .MuiTableContainer-root {
        border: 1px solid #c9dce2 !important;
        border-radius: 0 !important;
        overflow: hidden !important;
    }

    .pdf-export-report table {
        border-collapse: collapse !important;
        background: #ffffff !important;
    }

    .pdf-export-report thead .MuiTableCell-root {
        background: ${reportColor} !important;
        color: #ffffff !important;
        font-weight: 700 !important;
        border-color: ${reportColor} !important;
    }

    .pdf-export-report tbody .MuiTableRow-root:nth-of-type(odd) .MuiTableCell-root {
        background: #f3f8fa !important;
    }

    .pdf-export-report tbody .MuiTableCell-root {
        border-color: #c9dce2 !important;
    }

    .pdf-export-report .MuiLinearProgress-root {
        background: #dceaf0 !important;
        border-radius: 8px !important;
    }

    .pdf-export-report .MuiOutlinedInput-root {
        background: #ffffff !important;
    }

    .pdf-export-report .MuiOutlinedInput-notchedOutline {
        border-color: #b9d0d8 !important;
    }

    .pdf-export-report .MuiChartsAxis-line,
    .pdf-export-report .MuiChartsAxis-tick {
        stroke: #31545f !important;
    }

    .pdf-export-report .MuiChartsAxis-tickLabel,
    .pdf-export-report .MuiChartsLegend-label,
    .pdf-export-report .MuiChartsAxis-label {
        fill: #0f2630 !important;
        color: #0f2630 !important;
    }

    .pdf-export-report svg {
        overflow: visible !important;
    }

    .pdf-export-report .MuiCharts-root,
    .pdf-export-report .MuiResponsiveChart-container {
        min-height: 360px !important;
        overflow: visible !important;
    }
`;

function loadImage(src) {
    return new Promise((resolve) => {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.onload = () => resolve(image);
        image.onerror = () => resolve(null);
        image.src = src;
    });
}

const ExportDashboardPdfButton = ({
    targetId,
    title = 'Dashboard',
    fileName = 'dashboard',
    logoPath = defaultLogoPath,
    disabled = false,
    label = 'Exportar PDF',
}) => {
    const [loading, setLoading] = useState(false);

    const handleExport = async () => {
        const element = document.getElementById(targetId);
        if (!element) return;

        setLoading(true);
        try {
            let reportBlocks = [];
            let reportWidth = element.getBoundingClientRect().width;
            const [canvas, logo] = await Promise.all([
                html2canvas(element, {
                    backgroundColor: '#ffffff',
                    scale: Math.min(window.devicePixelRatio || 2, 2),
                    useCORS: true,
                    ignoreElements: (node) => node.classList?.contains('pdf-export-ignore'),
                    onclone: (clonedDocument) => {
                        const clonedElement = clonedDocument.getElementById(targetId);
                        if (clonedElement) {
                            clonedElement.classList.add('pdf-export-report');
                        }
                        const style = clonedDocument.createElement('style');
                        style.innerHTML = reportCss;
                        clonedDocument.head.appendChild(style);

                        if (clonedElement) {
                            const baseRect = clonedElement.getBoundingClientRect();
                            reportWidth = baseRect.width;
                            reportBlocks = Array.from(clonedElement.querySelectorAll('.MuiPaper-root'))
                                .map((block) => {
                                    const rect = block.getBoundingClientRect();
                                    return {
                                        top: Math.max(0, rect.top - baseRect.top),
                                        bottom: Math.max(0, rect.bottom - baseRect.top),
                                    };
                                })
                                .filter((block) => block.bottom - block.top > 40)
                                .sort((a, b) => a.top - b.top);
                        }
                    },
                }),
                loadImage(logoPath),
            ]);

            const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 34;
            const headerHeight = 84;
            const footerHeight = 34;
            const contentWidth = pageWidth - (margin * 2);
            const contentTop = headerHeight + 22;
            const contentHeight = pageHeight - contentTop - footerHeight;
            const sourceHeightPerPage = (contentHeight * canvas.width) / contentWidth;
            const canvasScale = canvas.width / Math.max(1, reportWidth);
            const blocks = reportBlocks.map((block) => ({
                top: block.top * canvasScale,
                bottom: block.bottom * canvasScale,
            }));
            const pageSlices = [];
            let sourceY = 0;

            while (sourceY < canvas.height - 1) {
                const desiredEnd = Math.min(sourceY + sourceHeightPerPage, canvas.height);
                const crossingBlock = blocks.find((block) => (
                    block.top > sourceY + 24
                    && block.top < desiredEnd
                    && block.bottom > desiredEnd
                ));
                const sliceEnd = crossingBlock ? crossingBlock.top : desiredEnd;

                if (sliceEnd <= sourceY + 24) {
                    pageSlices.push({ sourceY, sourceHeight: desiredEnd - sourceY });
                    sourceY = desiredEnd;
                } else {
                    pageSlices.push({ sourceY, sourceHeight: sliceEnd - sourceY });
                    sourceY = sliceEnd;
                }
            }

            for (let page = 0; page < pageSlices.length; page += 1) {
                if (page > 0) doc.addPage('a4', 'portrait');

                doc.setFillColor(reportColor);
                doc.rect(0, 0, pageWidth, headerHeight, 'F');

                if (logo) {
                    const logoHeight = 28;
                    const logoWidth = Math.min(100, (logo.width * logoHeight) / logo.height);
                    doc.addImage(logo, 'PNG', margin, 16, logoWidth, logoHeight);
                }

                doc.setTextColor('#ffffff');
                const textX = logo ? 148 : margin;
                doc.setFontSize(16);
                doc.setFont(undefined, 'bold');
                doc.text(brandName, textX, 28);
                doc.setFontSize(14);
                doc.setFont(undefined, 'bold');
                doc.text(title, textX, 58);
                doc.setFontSize(8);
                doc.setFont(undefined, 'normal');
                doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, pageWidth - margin, 28, { align: 'right' });

                const { sourceY: sliceSourceY, sourceHeight } = pageSlices[page];
                const pageCanvas = document.createElement('canvas');
                pageCanvas.width = canvas.width;
                pageCanvas.height = sourceHeight;
                const context = pageCanvas.getContext('2d');
                context.drawImage(
                    canvas,
                    0,
                    sliceSourceY,
                    canvas.width,
                    sourceHeight,
                    0,
                    0,
                    canvas.width,
                    sourceHeight,
                );

                const pageImageHeight = (sourceHeight * contentWidth) / canvas.width;
                doc.setTextColor('#0f2630');
                doc.addImage(
                    pageCanvas.toDataURL('image/png'),
                    'PNG',
                    margin,
                    contentTop,
                    contentWidth,
                    pageImageHeight,
                );

                doc.setDrawColor('#d7e5ea');
                doc.line(margin, pageHeight - 28, pageWidth - margin, pageHeight - 28);
                doc.setTextColor('#607d87');
                doc.setFontSize(8);
                doc.text('Dashboard local SOL Provedor', margin, pageHeight - 14);
                doc.text(`Pagina ${page + 1} de ${pageSlices.length}`, pageWidth - margin, pageHeight - 12, { align: 'right' });
            }

            doc.save(`${fileName}-${new Date().toISOString().slice(0, 10)}.pdf`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            className="pdf-export-ignore"
            variant="outlined"
            size="small"
            startIcon={loading ? <CircularProgress size={16} /> : <PictureAsPdfRoundedIcon />}
            onClick={handleExport}
            disabled={disabled || loading}
            sx={dashboardHeaderButtonSx}
        >
            {loading ? 'Gerando PDF' : label}
        </Button>
    );
};

export default ExportDashboardPdfButton;
