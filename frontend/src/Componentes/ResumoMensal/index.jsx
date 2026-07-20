import BasicDatePicker from '../BasicDatePicker';
import TabelaResumo from '../TabelaResumo';
import { Alert, Box, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import { dashboardInputSx, dashboardPanelSx, dashboardSubtleTextSx } from '../../Utils/DashboardTheme';

const ResumoMensal = ({ dataApiCto, loagdinCto, errorCto, aoSelectData, dark = false }) => {
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
        <Paper variant="outlined" sx={{ ...(dark ? dashboardPanelSx : {}), p: 2.5, borderRadius: dark ? 1.5 : 2 }}>
            <Stack spacing={2}>
                <Box>
                    <Typography variant="h6" fontWeight={800}>Total mensal</Typography>
                    <Typography sx={dark ? dashboardSubtleTextSx : undefined} color={dark ? undefined : 'text.secondary'} variant="body2">Resumo de procedimentos no mes selecionado.</Typography>
                </Box>
                <BasicDatePicker label="Ano e mes" views={['year', 'month']} aoAlterado={aoSelectData} open="month" textFieldSx={dark ? dashboardInputSx : undefined} />
                <TabelaResumo rows={Array.isArray(dataApiCto) ? dataApiCto : []} dark={dark} />
            </Stack>
        </Paper>
    );
};

export default ResumoMensal;
