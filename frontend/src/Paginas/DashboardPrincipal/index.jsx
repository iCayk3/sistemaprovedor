import { Box, Paper, Stack, Typography } from '@mui/material';
import MixedBarChart from '../../Componentes/MixedBarChart';
import BasicLineChart from '../../Componentes/BasicLineChart';
import FieldAutoComplet from '../../Componentes/FieldAutoComplet';
import { useEffect, useState } from 'react';
import Api from '../../Services/Api';

const DashboardPrincipal = () => {
    const [procedimento, setProcedimento] = useState(null);
    const [procedimentos, setProcedimentos] = useState(null);
    const [inputProcedimento, setInputProcedimento] = useState('');
    const [procedimentoService, setProcedimentoService] = useState(null);
    const [inputProcedimentoService, setInputProcedimentoService] = useState('');
    const [data, setData] = useState([]);
    const [label, setLabel] = useState([]);
    const [dataEquipe, setDataEquipe] = useState([]);
    const [labelEquipe, setLabelEquipe] = useState([]);
    const UseApi = Api();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const endpoint = procedimento?.label
                    ? `registros/totalpormes?servico=${procedimento.label.toUpperCase()}`
                    : 'registros/totalpormes';
                const response = await UseApi(endpoint);

                setLabel(Array.isArray(response) ? response.map((dados) => dados.mes) : []);
                setData(Array.isArray(response) ? response.map((dados) => dados.valor) : []);
            } catch (error) {
                console.error('Erro ao buscar dados:', error);
                setLabel([]);
                setData([]);
            }
        };

        fetchData();
    }, [procedimento]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const endpoint = procedimentoService?.label
                    ? `registros/servicos/tecnico/mensal?servico=${procedimentoService.label.toUpperCase()}`
                    : 'registros/servicos/tecnico/mensal';
                const response = await UseApi(endpoint);
                const response2 = await UseApi('procedimento');

                setProcedimentos(response2);
                setLabelEquipe(Array.isArray(response) ? response.map((dados) => dados.equipe) : []);
                setDataEquipe(Array.isArray(response) ? response.map((dados) => dados.valor) : []);
            } catch (error) {
                console.error('Erro ao buscar dados:', error);
                setLabelEquipe([]);
                setDataEquipe([]);
            }
        };

        fetchData();
    }, [procedimentoService]);

    return (
        <Box sx={{ display: 'grid', gap: 2 }}>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                <Typography variant="h5" fontWeight={800}>Registros tecnicos</Typography>
                <Typography color="text.secondary">
                    Evolucao mensal dos servicos e distribuicao por equipe tecnica.
                </Typography>
            </Paper>

            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', xl: '1fr 1fr' } }}>
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, minWidth: 0 }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} gap={2} mb={2}>
                        <Box>
                            <Typography variant="h6" fontWeight={800}>Servicos por mes</Typography>
                            <Typography color="text.secondary" variant="body2">Volume historico por procedimento.</Typography>
                        </Box>
                        <Box sx={{ width: { xs: '100%', md: 280 } }}>
                            <FieldAutoComplet
                                dadosProcedimento={procedimentos}
                                label="Procedimento"
                                aoAlterado={(value) => setProcedimento(value || null)}
                                onInputValueChange={setInputProcedimento}
                                valor={procedimento}
                                inputValue={inputProcedimento}
                            />
                        </Box>
                    </Stack>
                    <BasicLineChart xLabels={label} data={data} />
                </Paper>

                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, minWidth: 0 }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} gap={2} mb={2}>
                        <Box>
                            <Typography variant="h6" fontWeight={800}>Servicos por equipe</Typography>
                            <Typography color="text.secondary" variant="body2">Total mensal filtrado por procedimento.</Typography>
                        </Box>
                        <Box sx={{ width: { xs: '100%', md: 280 } }}>
                            <FieldAutoComplet
                                dadosProcedimento={procedimentos}
                                label="Procedimento"
                                aoAlterado={(value) => setProcedimentoService(value || null)}
                                onInputValueChange={setInputProcedimentoService}
                                valor={procedimentoService}
                                inputValue={inputProcedimentoService}
                            />
                        </Box>
                    </Stack>
                    <MixedBarChart xLabels={labelEquipe} uData={dataEquipe} />
                </Paper>
            </Box>
        </Box>
    );
};

export default DashboardPrincipal;
