import React from 'react';
import PropTypes from 'prop-types';
import { Box, Paper, Typography } from '@mui/material';
import { formatClientStatus } from './cobrancasUtils';

export default function ClienteRbxPanel({ cliente }) {
    if (!cliente) return null;

    return (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mt: 2 }}>
            <Typography variant="subtitle1" fontWeight={800}>Dados do cliente RBX</Typography>
            <Box
                sx={{
                    display: 'grid',
                    gap: 1,
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(6, minmax(0, 1fr))' },
                    mt: 1,
                }}
            >
                {[
                    ['Código', cliente.codigo],
                    ['Nome', cliente.nome],
                    ['CPF/CNPJ', cliente.cpfCnpj],
                    ['Sigla', cliente.sigla],
                    ['Grupo', cliente.grupo],
                    ['Situação', formatClientStatus(cliente.situacao)],
                ].map(([label, value]) => (
                    <Box key={label}>
                        <Typography variant="caption" color="text.secondary">{label}</Typography>
                        <Typography fontWeight={700}>{value || '-'}</Typography>
                    </Box>
                ))}
            </Box>
        </Paper>
    );
}

ClienteRbxPanel.propTypes = {
    cliente: PropTypes.object,
};
