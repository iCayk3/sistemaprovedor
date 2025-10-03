import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { CircularProgress } from '@mui/material';

export default function BasicCard({ data, valor = 0, titulo, boletoAberto }) {

    const valorFormatado = valor.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    return (
        <Card sx={{ minWidth: 275, marginTop: 4 }}>
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
