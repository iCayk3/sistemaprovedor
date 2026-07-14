import * as React from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import { Box, Typography } from '@mui/material';

const margin = { right: 36 };

const BasicLineChart = ({ xLabels, data }) => {
  const hasData = Array.isArray(data) && data.some((value) => Number(value) > 0);

  return (
    <Box sx={{ width: '100%', minHeight: 320 }}>
      {hasData ? (
        <LineChart
          height={320}
          series={[{ data, label: 'Registros', area: true }]}
          xAxis={[{ scaleType: 'point', data: xLabels }]}
          yAxis={[{ width: 40 }]}
          margin={margin}
        />
      ) : (
        <Box sx={{ height: 320, display: 'grid', placeItems: 'center' }}>
          <Typography color="text.secondary">Nenhum dado para exibir neste periodo.</Typography>
        </Box>
      )}
    </Box>
  );
};

export default BasicLineChart;
