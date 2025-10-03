import * as React from 'react';
import { BarChart } from '@mui/x-charts/BarChart';


export default function MixedBarChart({xLabels, uData}) {
  return (
    <BarChart
      height={300}
      series={[
        { data: uData, stack: 'stack2' },
      ]}
      xAxis={[{
        data: xLabels,
        scaleType: 'band',
      }]}
    />
  );
}