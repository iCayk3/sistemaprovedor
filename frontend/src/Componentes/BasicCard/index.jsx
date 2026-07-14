import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { CircularProgress } from '@mui/material';

export default function BasicCard({ data, valor = 0, titulo, boletoAberto }) {

    const valorFormatado = valor.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    return (
        <Card variant="outlined" sx={{ borderRadius: 2, boxShadow: 'none' }}>
            <CardContent>
                <Typography gutterBottom sx={{ color: 'text.secondary', fontSize: 14 }}>
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
