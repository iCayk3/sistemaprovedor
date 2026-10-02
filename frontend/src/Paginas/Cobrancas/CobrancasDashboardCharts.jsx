import React from 'react';
import PropTypes from 'prop-types';
import {
    Box,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import TimelineRoundedIcon from '@mui/icons-material/TimelineRounded';
import { BarChart, PieChart } from '@mui/x-charts';
import ChartValueList from '../../Componentes/ChartValueList';
import {
    dashboardChartSx,
    dashboardMetricSx,
    dashboardMutedTextSx,
    dashboardPanelSx,
    dashboardSubtleTextSx,
} from '../../Utils/DashboardTheme';
import { formatCurrency, pageGridSx } from './cobrancasUtils';

export default function CobrancasDashboardCharts({
    metrics,
    chartData,
    userFilter,
}) {
    return (
        <>
            <Box sx={{ ...pageGridSx, mb: 2 }}>
                {[
                    ['Cobranças', metrics.total, 'registros no sistema'],
                    ['Em aberto', metrics.abertas, formatCurrency(metrics.valorAberto)],
                    ['Pago no mês', metrics.pagasMes, formatCurrency(metrics.valorPagoMes)],
                    ['Promessas hoje', metrics.promessasHoje, `${metrics.promessasVencidas} vencidas`],
                    ['Pagas', metrics.pagas, `${formatCurrency(metrics.valorPago)} de ${formatCurrency(metrics.valorTotal)}`],
                ].map(([label, value, detail]) => (
                    <Paper
                        variant="outlined"
                        sx={{
                            p: 2,
                            borderRadius: 1.5,
                            ...dashboardMetricSx,
                        }}
                        key={label}
                    >
                        <Stack direction="row" alignItems="center" spacing={1.2}>
                            <TimelineRoundedIcon color="primary" />
                            <Box>
                                <Typography sx={dashboardSubtleTextSx} variant="body2" fontWeight={800}>{label}</Typography>
                                <Typography variant="h5" fontWeight={800}>{value}</Typography>
                                <Typography sx={dashboardMutedTextSx} variant="caption">{detail}</Typography>
                            </Box>
                        </Stack>
                    </Paper>
                ))}
            </Box>

            <Box
                sx={{
                    display: 'grid',
                    gap: 2,
                    gridTemplateColumns: '1fr',
                    mb: 2,
                }}
            >
                <Paper variant="outlined" sx={{ ...dashboardPanelSx, p: 2 }}>
                    <Typography variant="h6" fontWeight={800}>Pagas x em aberto</Typography>
                    <Typography sx={{ ...dashboardSubtleTextSx, mb: 1 }} variant="body2">
                        Visão de auditoria por situação operacional.
                    </Typography>
                    {chartData.auditStatusPie.length ? (
                        <Box
                            sx={{
                                display: 'grid',
                                gap: 2,
                                gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 240px' },
                                alignItems: 'center',
                            }}
                        >
                            <Box sx={{ minWidth: 0 }}>
                                <PieChart
                                    height={260}
                                    series={[{
                                        data: chartData.auditStatusPie,
                                        innerRadius: 45,
                                        paddingAngle: 2,
                                    }]}
                                    slotProps={{ legend: { hidden: true } }}
                                    sx={dashboardChartSx}
                                />
                            </Box>
                            <ChartValueList items={chartData.auditStatusPie} />
                        </Box>
                    ) : (
                        <Stack alignItems="center" justifyContent="center" minHeight={220}>
                            <Typography sx={dashboardMutedTextSx}>Sem dados para exibir.</Typography>
                        </Stack>
                    )}
                </Paper>

                <Paper variant="outlined" sx={{ ...dashboardPanelSx, p: 2 }}>
                    <Typography variant="h6" fontWeight={800}>Valores por situação</Typography>
                    <Typography sx={{ ...dashboardSubtleTextSx, mb: 1 }} variant="body2">
                        Comparativo financeiro entre abertas e pagas.
                    </Typography>
                    {chartData.auditValuePie.length ? (
                        <Box
                            sx={{
                                display: 'grid',
                                gap: 2,
                                gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 260px' },
                                alignItems: 'center',
                            }}
                        >
                            <Box sx={{ minWidth: 0 }}>
                                <PieChart
                                    height={260}
                                    series={[{
                                        data: chartData.auditValuePie,
                                        innerRadius: 45,
                                        paddingAngle: 2,
                                        valueFormatter: (item) => formatCurrency(item.value),
                                    }]}
                                    slotProps={{ legend: { hidden: true } }}
                                    sx={dashboardChartSx}
                                />
                            </Box>
                            <ChartValueList items={chartData.auditValuePie} valueFormatter={formatCurrency} />
                        </Box>
                    ) : (
                        <Stack alignItems="center" justifyContent="center" minHeight={220}>
                            <Typography sx={dashboardMutedTextSx}>Sem dados para exibir.</Typography>
                        </Stack>
                    )}
                </Paper>

                <Paper variant="outlined" sx={{ ...dashboardPanelSx, p: 2 }}>
                    <Typography variant="h6" fontWeight={800}>Status por usuário</Typography>
                    <Typography sx={{ ...dashboardSubtleTextSx, mb: 1 }} variant="body2">
                        {userFilter === 'Todos'
                            ? 'Distribuição de status da fila filtrada. Selecione um usuário para detalhar.'
                            : `Distribuição de status de ${userFilter}.`}
                    </Typography>
                    {chartData.statusPie.length ? (
                        <Box
                            sx={{
                                display: 'grid',
                                gap: 2,
                                gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 240px' },
                                alignItems: 'center',
                            }}
                        >
                            <Box sx={{ minWidth: 0 }}>
                                <PieChart
                                    height={260}
                                    series={[{
                                        data: chartData.statusPie,
                                        innerRadius: 45,
                                        paddingAngle: 2,
                                    }]}
                                    slotProps={{ legend: { hidden: true } }}
                                    sx={dashboardChartSx}
                                />
                            </Box>
                            <ChartValueList items={chartData.statusPie} />
                        </Box>
                    ) : (
                        <Stack alignItems="center" justifyContent="center" minHeight={220}>
                            <Typography sx={dashboardMutedTextSx}>Sem dados para exibir.</Typography>
                        </Stack>
                    )}
                </Paper>

                <Paper variant="outlined" sx={{ ...dashboardPanelSx, p: 2 }}>
                    <Typography variant="h6" fontWeight={800}>Status por usuário (comparativo)</Typography>
                    <Typography sx={{ ...dashboardSubtleTextSx, mb: 1 }} variant="body2">
                        Compare a quantidade de cobranças por status em cada responsável.
                    </Typography>
                    {chartData.userLabels.length && chartData.statusByUserSeries.length ? (
                        <Box
                            sx={{
                                display: 'grid',
                                gap: 2,
                                gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 240px' },
                                alignItems: 'center',
                            }}
                        >
                            <Box sx={{ minWidth: 0 }}>
                                <BarChart
                                    height={260}
                                    xAxis={[{ scaleType: 'band', data: chartData.userLabels }]}
                                    series={chartData.statusByUserSeries}
                                    margin={{ left: 35, right: 10, top: 25, bottom: 70 }}
                                    sx={dashboardChartSx}
                                />
                            </Box>
                            <ChartValueList items={chartData.statusByUserTotals} showPercent={false} />
                        </Box>
                    ) : (
                        <Stack alignItems="center" justifyContent="center" minHeight={220}>
                            <Typography sx={dashboardMutedTextSx}>Sem dados para exibir.</Typography>
                        </Stack>
                    )}
                </Paper>

                <Paper variant="outlined" sx={{ ...dashboardPanelSx, p: 2 }}>
                    <Typography variant="h6" fontWeight={800}>Valor por usuário</Typography>
                    <Typography sx={{ ...dashboardSubtleTextSx, mb: 1 }} variant="body2">
                        Participação em valor por último responsável.
                    </Typography>
                    {chartData.userValuePie.length ? (
                        <Box
                            sx={{
                                display: 'grid',
                                gap: 2,
                                gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 260px' },
                                alignItems: 'center',
                            }}
                        >
                            <Box sx={{ minWidth: 0 }}>
                                <PieChart
                                    height={260}
                                    series={[{
                                        data: chartData.userValuePie,
                                        innerRadius: 45,
                                        paddingAngle: 2,
                                        valueFormatter: (item) => formatCurrency(item.value),
                                    }]}
                                    slotProps={{ legend: { hidden: true } }}
                                    sx={dashboardChartSx}
                                />
                            </Box>
                            <ChartValueList items={chartData.userValuePie} valueFormatter={formatCurrency} />
                        </Box>
                    ) : (
                        <Stack alignItems="center" justifyContent="center" minHeight={220}>
                            <Typography sx={dashboardMutedTextSx}>Sem dados para exibir.</Typography>
                        </Stack>
                    )}
                </Paper>

                <Paper variant="outlined" sx={{ ...dashboardPanelSx, p: 2 }}>
                    <Typography variant="h6" fontWeight={800}>Valor por grupo</Typography>
                    <Typography sx={{ ...dashboardSubtleTextSx, mb: 1 }} variant="body2">
                        Participação em valor por grupo do cliente.
                    </Typography>
                    {chartData.groupValuePie.length ? (
                        <Box
                            sx={{
                                display: 'grid',
                                gap: 2,
                                gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 260px' },
                                alignItems: 'center',
                            }}
                        >
                            <Box sx={{ minWidth: 0 }}>
                                <PieChart
                                    height={260}
                                    series={[{
                                        data: chartData.groupValuePie,
                                        innerRadius: 45,
                                        paddingAngle: 2,
                                        valueFormatter: (item) => formatCurrency(item.value),
                                    }]}
                                    slotProps={{ legend: { hidden: true } }}
                                    sx={dashboardChartSx}
                                />
                            </Box>
                            <ChartValueList items={chartData.groupValuePie} valueFormatter={formatCurrency} />
                        </Box>
                    ) : (
                        <Stack alignItems="center" justifyContent="center" minHeight={220}>
                            <Typography sx={dashboardMutedTextSx}>Sem dados para exibir.</Typography>
                        </Stack>
                    )}
                </Paper>

                <Paper variant="outlined" sx={{ ...dashboardPanelSx, p: 2, gridColumn: '1 / -1' }}>
                    <Typography variant="h6" fontWeight={800}>Resultado individual por usuário</Typography>
                    <Typography sx={{ ...dashboardSubtleTextSx, mb: 1 }} variant="body2">
                        Uma cobrança paga só conta como resultado individual quando o mesmo usuário abriu e concluiu o atendimento.
                    </Typography>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Usuário</TableCell>
                                    <TableCell align="right">Em aberto</TableCell>
                                    <TableCell align="right">Valor em aberto</TableCell>
                                    <TableCell align="right">Pagas pelo mesmo usuário</TableCell>
                                    <TableCell align="right">Valor recuperado</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {chartData.individualRows.map((row) => (
                                    <TableRow key={row.user}>
                                        <TableCell sx={{ fontWeight: 600 }}>{row.user}</TableCell>
                                        <TableCell align="right">{row.openedCount}</TableCell>
                                        <TableCell align="right">{formatCurrency(row.openedValue)}</TableCell>
                                        <TableCell align="right">{row.paidCount}</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700, color: 'success.main' }}>
                                            {formatCurrency(row.paidValue)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {!chartData.individualRows.length && (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center">Sem resultados individuais no período.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            </Box>
        </>
    );
}

CobrancasDashboardCharts.propTypes = {
    metrics: PropTypes.object.isRequired,
    chartData: PropTypes.object.isRequired,
    userFilter: PropTypes.string.isRequired,
};
