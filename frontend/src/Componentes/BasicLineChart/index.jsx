import * as React from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import { Box, Typography } from '@mui/material';
import ChartValueList from '../ChartValueList';

const margin = { right: 36 };

const BasicLineChart = ({ xLabels, data }) => {
  const hasData = Array.isArray(data) && data.some((value) => Number(value) > 0);
  const summaryItems = (xLabels || []).map((label, index) => ({
    label,
    value: Number(data?.[index] || 0),
    color: '#4454f6',
  }));

  return (
    <Box sx={{ width: '100%', minHeight: 320 }}>
      {hasData ? (
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 240px' },
            alignItems: 'center',
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <LineChart
              height={320}
              series={[{ data, label: 'Registros', area: true }]}
              xAxis={[{ scaleType: 'point', data: xLabels }]}
              yAxis={[{ width: 40 }]}
              margin={margin}
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
};

export default BasicLineChart;
