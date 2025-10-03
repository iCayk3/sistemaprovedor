import * as React from 'react';
import { BarChart } from '@mui/x-charts/BarChart';
import dayjs from 'dayjs';
import BasicDatePicker from '../../Componentes/BasicDatePicker';
import { Box } from '@mui/material';
import TabelaResumo from '../../Componentes/TabelaResumo';
import Api from '../../Services/Api';

const chartSetting = {
    yAxis: [
        {
            label: 'Atividades',
            width: 60,
        },
    ],
    height: 250,
};

const today = new Date();
const UseApi = Api();

const DashBoardsComercial = () => {
    const [dataDiario, setDataDiario] = React.useState(today.toISOString().slice(0, 10));
    const [dataMensal, setDataMensal] = React.useState(today.toISOString().slice(0, 10));
    const [atividades, setAtividades] = React.useState([]);
    const [resumoMensal, setResumoMensal] = React.useState([]);

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await UseApi(`atividades/usuario?filtro=${dataDiario}`);
                setAtividades(response);
            } catch (err) {
                console.error(err);
            }
        };
        fetchData();
    }, [dataDiario]);

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const resumoMensal = await UseApi(`atividades/resumo/mensal?data=${dataMensal}`);
                setResumoMensal(resumoMensal);
            } catch (err) {
                console.error(err);
            }
        };
        fetchData();
    }, [dataMensal]);

    const labels = resumoMensal.map(item => item.label.toLowerCase());

    const datasetConvertido = atividades.map(item => {
        const novoItem = { usuario: item.usuario };
        item.atividades.forEach(atividade => {
            const key = atividade.label && atividade.label.toLowerCase();
            novoItem[key] = atividade.value;
        });
        return novoItem;
    });

    const series = labels.map(label => ({
        dataKey: label,
        label: label.charAt(0).toUpperCase() + label.slice(1),
    }));

    const selectData = (even) => {
        setDataMensal(even.toISOString().slice(0, 10));
    };

    const selectDataDiario = (even) => {
        setDataDiario(even.toISOString().slice(0, 10));
    };

    console.log(datasetConvertido)

    return (
        <Box sx={{ display: 'grid' }}>
            <Box sx={{ width: '10rem', marginBottom: 2 }}>
                <BasicDatePicker
                    aoAlterado={(valor) => selectDataDiario(valor)}
                    label={"Selecione a data"}
                    valor={dayjs(dataDiario)}
                />
            </Box>
            <Box sx={{ marginBottom: 2 }}>
                <BarChart
                    dataset={datasetConvertido}
                    xAxis={[{ dataKey: 'usuario' }]}
                    series={series}
                    {...chartSetting}
                />
            </Box>
            <Box sx={{ width: '10rem', marginBottom: 2 }}>
                <BasicDatePicker
                    aoAlterado={(valor) => selectData(valor)}
                    label={"Selecione o mês"}
                    valor={dayjs(dataMensal)}
                    views={['year', 'month']}
                    open={'month'}
                />
            </Box>
            <Box sx={{ width: '40%' }}>
                <TabelaResumo rows={resumoMensal} />
            </Box>
        </Box>
    );
};

export default DashBoardsComercial;
