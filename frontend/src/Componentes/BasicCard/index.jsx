import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { CircularProgress } from '@mui/material';
import { dashboardPanelSx, dashboardSubtleTextSx } from '../../Utils/DashboardTheme';

export default function BasicCard({ data, valor = 0, titulo, boletoAberto, dark = false }) {

    const valorFormatado = valor.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    return (
        <Card
            variant="outlined"
            sx={{
                borderRadius: 1.5,
                boxShadow: 'none',
                ...(dark ? dashboardPanelSx : {}),
            }}
        >
            <CardContent>
                <Typography gutterBottom sx={{ ...(dark ? dashboardSubtleTextSx : { color: 'text.secondary' }), fontSize: 14, fontWeight: 700 }}>
                    {data ? titulo + " " + data.split("-").reverse().join("/") : titulo}
                </Typography>
                <Typography variant="body2">
                    valor:
                </Typography>
                    {valor !== 0 && <Typography variant="h5" component="div">
                        {valorFormatado && boletoAberto ? `R$ -${valorFormatado}` : `R$ ${valorFormatado}`}
                    </Typography>}
                    {valor === 0  && <Typography variant="h5" component="div">
                        R$ {<CircularProgress size="1rem" />}
                    </Typography>}
            </CardContent>
        </Card>
    );
}
