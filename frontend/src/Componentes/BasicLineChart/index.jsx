import * as React from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import { styled } from '@mui/material';

const margin = { right: 36 };

const SessaoEstilizada = styled('section')(() => ({
  // Layout personalizado aqui, se necessário
  fontSize : 200
}));

const BasicLineChart = ({xLabels, data}) => {
  return (
    <SessaoEstilizada>
      <LineChart
        height={300}
        series={[
          { data: data},
        ]}
        xAxis={[{ scaleType: 'point', data: xLabels }]}
        yAxis={[{ width: 40 }]}
        margin={margin}
      />
    </SessaoEstilizada>
  );
}

export default BasicLineChart