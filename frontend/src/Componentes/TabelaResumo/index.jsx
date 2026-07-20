import { Box, LinearProgress, Paper, Typography } from '@mui/material';
import { dashboardMutedTextSx, dashboardPanelSx } from '../../Utils/DashboardTheme';

const TabelaResumo = ({ rows, dark = false }) => {
  const safeRows = Array.isArray(rows) ? rows : [];
  const maxValue = Math.max(...safeRows.map((item) => Number(item.value) || 0), 0);

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 1.25,
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, minmax(0, 1fr))',
          xl: 'repeat(3, minmax(0, 1fr))',
        },
      }}
    >
      {safeRows.map((dados, index) => {
        const value = Number(dados.value) || 0;
        const percent = maxValue ? (value / maxValue) * 100 : 0;

        return (
          <Paper
            key={`${dados.label}-${index}`}
            variant="outlined"
            sx={{
              p: 1.5,
              borderRadius: 1.5,
              minWidth: 0,
              ...(dark ? dashboardPanelSx : {}),
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 0.75 }}>
              <Typography variant="body2" fontWeight={700}>{dados.label}</Typography>
              <Typography variant="body2" fontWeight={800}>{value.toLocaleString('pt-BR')}</Typography>
            </Box>
            {maxValue > 0 ? (
              <LinearProgress variant="determinate" value={percent} sx={{ height: 7, borderRadius: 999, bgcolor: dark ? '#dceaf0' : undefined, '& .MuiLinearProgress-bar': { bgcolor: dark ? '#0f4c81' : undefined }, '.dark &': { bgcolor: dark ? 'rgba(255,255,255,0.15)' : undefined, '& .MuiLinearProgress-bar': { bgcolor: dark ? '#17e2e8' : undefined } } }} />
            ) : (
              <Box sx={{ height: 7, borderRadius: 999, bgcolor: dark ? '#dceaf0' : 'action.hover', '.dark &': { bgcolor: dark ? 'rgba(255,255,255,0.15)' : 'action.hover' } }} />
            )}
          </Paper>
        );
      })}
      {!safeRows.length && (
        <Box sx={{ py: 3, textAlign: 'center' }}>
          <Typography sx={dark ? dashboardMutedTextSx : undefined} color={dark ? undefined : 'text.secondary'}>Nenhum dado para exibir.</Typography>
        </Box>
      )}
    </Box>
  );
};

export default TabelaResumo;
