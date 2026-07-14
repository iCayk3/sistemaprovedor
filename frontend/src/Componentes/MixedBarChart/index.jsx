import * as React from 'react';
import { BarChart } from '@mui/x-charts/BarChart';
import { Box, Typography } from '@mui/material';

export default function MixedBarChart({ xLabels, uData }) {
  const hasData = Array.isArray(uData) && uData.some((value) => Number(value) > 0);

  return (
    <Box sx={{ width: '100%', minHeight: 320 }}>
      {hasData ? (
        <BarChart
          height={320}
          series={[{ data: uData, stack: 'stack2', label: 'Total' }]}
          xAxis={[{ data: xLabels, scaleType: 'band' }]}
        />
      ) : (
        <Box sx={{ height: 320, display: 'grid', placeItems: 'center' }}>
          <Typography color="text.secondary">Nenhum dado para exibir neste periodo.</Typography>
        </Box>
      )}
    </Box>
  );
}
