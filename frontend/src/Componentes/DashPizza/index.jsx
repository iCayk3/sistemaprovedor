import * as React from 'react';
import { PieChart } from '@mui/x-charts/PieChart';
import Api from '../../Services/Api';
import { Box, CircularProgress, Paper, Typography } from '@mui/material';

const colorMap = {
  "INSTALAÃ‡ÃƒO": "#00F07A",
  "MUDANÃ‡A DE ENDEREÃ‡O": "#5A76ED",
  "SEM INTERNET": "#F0D60D",
  "LENTIDÃƒO": "#8338EC",
  "MUDANCA DE COMODO": "#B55AED",
  "TROCA DE EQUIPAMENTO": "#CA5AED",
  "CANCELAMENTO": "#F00700",
  "REATIVACAO": "#3A18F0",
  "MIGRACÃƒO": "#5C3C92",
  "TROCA DE SENHA": "#2EC4B6",
  "OUTROS": "#A9CAED",
  "Pirabas": "#00F07A",
  "Primavera": "#5A76ED",
  "Santarem novo": "#F0D60D",
  "Quatipuru": "#8338EC",
  "Boa vista": "#B55AED",
  "MagalhÃ£es Barata": "#3A18F0",
  "MaracanÃ£": "#5C3C92",
  "Marapanim": "#2EC4B6",
  "Salinopolis": "#A9CAED",
};

const EmptyState = () => (
  <Box sx={{ minHeight: 280, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
    <Typography color="text.secondary">Nenhum dado para exibir.</Typography>
  </Box>
);

const DashPizza = ({ filtro, uri, financeiro, sx, metodo = 'GET' }) => {
  const [data, setData] = React.useState();
  const [loading, setLoading] = React.useState(true);
  const UseApi = React.useMemo(() => Api(), []);

  React.useEffect(() => {
    let ativo = true;

    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await UseApi(uri, metodo);
        if (ativo) setData(response);
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
        if (ativo) setData([]);
      } finally {
        if (ativo) setLoading(false);
      }
    };

    fetchData();

    return () => {
      ativo = false;
    };
  }, [uri, filtro, metodo, UseApi]);

  if (loading) {
    return (
      <Box sx={{ minHeight: 280, display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (financeiro) {
    const chartData = Array.isArray(data)
      ? data.map((item) => ({ ...item, color: colorMap[item.label] || '#7192ff' }))
      : [];

    return chartData.length ? (
      <Box sx={{ width: '100%', minHeight: 320 }}>
        <PieChart
          series={[{
            data: chartData,
            highlightScope: { fade: 'global', highlight: 'item' },
            faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
          }]}
          height={320}
          sx={sx}
        />
      </Box>
    ) : <EmptyState />;
  }

  const equipes = Array.isArray(data) ? data.filter((dados) => dados.servicos?.length > 0) : [];

  return equipes.length ? (
    <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' } }}>
      {equipes.map((dados, index) => (
        <Paper key={`${dados.nome}-${index}`} variant="outlined" sx={{ p: 2, borderRadius: 2, minWidth: 0 }}>
          <Typography variant="subtitle1" fontWeight={800} mb={1}>{dados.nome}</Typography>
          <PieChart
            series={[{
              data: dados.servicos.map((servico) => ({ ...servico, color: servico.cor || '#7192ff' })),
              highlightScope: { fade: 'global', highlight: 'item' },
              faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
            }]}
            height={300}
            sx={sx}
          />
        </Paper>
      ))}
    </Box>
  ) : <EmptyState />;
};

export default DashPizza;
