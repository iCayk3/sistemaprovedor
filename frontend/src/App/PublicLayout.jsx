// src/Componentes/PublicLayout.jsx
import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';

// Um layout simples para centralizar o conteúdo das páginas públicas
const PublicLayout = () => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="100vh"
  >
    <Outlet /> {/* O Outlet renderizará Login ou Register aqui */}
  </Box>
);

export default PublicLayout;
