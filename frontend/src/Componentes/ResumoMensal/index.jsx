import BasicDatePicker from '../BasicDatePicker';
import TabelaResumo from '../TabelaResumo';
import { Alert, Box, CircularProgress, Paper, Stack, Typography } from '@mui/material';

const ResumoMensal = ({ dataApiCto, loagdinCto, errorCto, aoSelectData }) => {
    if (loagdinCto) {
        return (
            <Stack alignItems="center" py={4}>
                <CircularProgress />
            </Stack>
        );
    }

    if (errorCto) {
        return <Alert severity="error">Erro ao carregar os dados: {errorCto}</Alert>;
    }

    return (
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
            <Stack spacing={2}>
                <Box>
                    <Typography variant="h6" fontWeight={800}>Total mensal</Typography>
                    <Typography color="text.secondary" variant="body2">Resumo de procedimentos no mes selecionado.</Typography>
                </Box>
                <BasicDatePicker label="Ano e mes" views={['year', 'month']} aoAlterado={aoSelectData} open="month" />
                <TabelaResumo rows={Array.isArray(dataApiCto) ? dataApiCto : []} />
            </Stack>
        </Paper>
    );
};

export default ResumoMensal;
