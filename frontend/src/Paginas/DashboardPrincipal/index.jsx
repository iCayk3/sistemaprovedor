import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
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
                const endpoint = procedimento && procedimento.label
                    ? `registros/totalpormes?servico=${procedimento.label.toUpperCase()}`
                    : `registros/totalpormes`;

                const response = await UseApi(endpoint);

                const labels = [];
                const valores = [];

                if (Array.isArray(response)) {
                    response.forEach((dados) => {
                        labels.push(dados.mes);
                        valores.push(dados.valor);
                    });
                }

                setLabel(labels);
                setData(valores);
            } catch (error) {
                console.error('Erro ao buscar dados:', error);
            }
        };

        fetchData();
    }, [procedimento]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const endpoint = procedimentoService && procedimentoService.label
                    ? `registros/servicos/tecnico/mensal?servico=${procedimentoService.label.toUpperCase()}`
                    : `registros/servicos/tecnico/mensal`;
                
                const response = await UseApi(endpoint);
                const response2 = await UseApi("procedimento");

                const labels = [];
                const valores = [];

                if (Array.isArray(response)) {
                    response.forEach((dados) => {
                        labels.push(dados.equipe);
                        valores.push(dados.valor);
                    });
                }
                setProcedimentos(response2)
                setLabelEquipe(labels); 
                setDataEquipe(valores);
            } catch (error) {
                console.error('Erro ao buscar dados:', error);
            }
        };

        fetchData();
    }, [procedimentoService]);  

    return (
        <>
            <Accordion defaultExpanded={true}>
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="panel1-content"
                    id="panel1-header"
                >
                    <Typography component="span">Gráfico de serviços por mês</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <FieldAutoComplet
                        dadosProcedimento={procedimentos}
                        label={"Procedimento"}
                        aoAlterado={(value) => setProcedimento(value || null)}
                        onInputValueChange={setInputProcedimento}
                        valor={procedimento}
                        inputValue={inputProcedimento}
                    />
                    <BasicLineChart xLabels={label} data={data} />
                </AccordionDetails>
            </Accordion>

            <Accordion defaultExpanded={true}>
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="panel2-content"
                    id="panel2-header"
                >
                    <Typography component="span">Serviços</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <FieldAutoComplet
                        dadosProcedimento={procedimentos}
                        label={"Procedimento"}
                        aoAlterado={(value) => setProcedimentoService(value || null)}
                        onInputValueChange={setInputProcedimentoService}
                        valor={procedimentoService}
                        inputValue={inputProcedimentoService}
                    />
                    <MixedBarChart xLabels={labelEquipe} uData={dataEquipe}/>
                </AccordionDetails>
            </Accordion>
        </>
    );
};

export default DashboardPrincipal;
