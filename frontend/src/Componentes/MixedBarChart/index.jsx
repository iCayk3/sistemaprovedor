import * as React from 'react';
import { BarChart } from '@mui/x-charts/BarChart';
import { Box, Typography } from '@mui/material';
import ChartValueList from '../ChartValueList';

export default function MixedBarChart({ xLabels, uData }) {
  const hasData = Array.isArray(uData) && uData.some((value) => Number(value) > 0);
  const summaryItems = (xLabels || []).map((label, index) => ({
    label,
    value: Number(uData?.[index] || 0),
    color: '#4454f6',
  }));

  return (
    <Box sx={{ width: '100%', minHeight: 320 }}>
      {hasData ? (
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 260px' },
            alignItems: 'center',
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <BarChart
              height={320}
              series={[{ data: uData, stack: 'stack2', label: 'Total' }]}
              xAxis={[{ data: xLabels, scaleType: 'band' }]}
            />
          </Box>
          <ChartValueList items={summaryItems} showPercent={false} />
        </Box>
      ) : (
        <Box sx={{ height: 320, display: 'grid', placeItems: 'center' }}>
          <Typography color="text.secondary">Nenhum dado para exibir neste periodo.</Typography>
        </Box>
      )}
    </Box>
  );
}
