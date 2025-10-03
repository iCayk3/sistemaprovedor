import { useEffect, useState } from "react";
import BasicCard from "../../Componentes/BasicCard";
import BasicDatePicker from "../../Componentes/BasicDatePicker";
import DashPizza from "../../Componentes/DashPizza";
import styled from "styled-components";
import Api from "../../Services/Api";

const today = new Date();

const FinanceiroStyled = styled.section`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
`

const UseApi = Api()

const Financeiro = () => {

    const [dataConsulta, setDataConsulta] = useState(today.toISOString().slice(0, 10))
    const [boletosBaixados, setBoletosBaixados] = useState({})
    const [boletosAbertos, setBoletosAbertos] = useState({})
    
    useEffect(() => {
            const fetchData = async () => {
                try {
                        const bbaixados = await UseApi(`rbx/boletosbaixados?data=${dataConsulta}`, 'POST')
                        const babertos = await UseApi('rbx/boletosabertos', 'POST');
                    setBoletosBaixados(bbaixados)
                    setBoletosAbertos(babertos)
                } catch (error) {
                    console.error('Erro ao buscar dados:', error);
                }
            };
    
            fetchData();
        }, [dataConsulta]);

    return (
        <FinanceiroStyled>
            <div>
                <BasicDatePicker aoAlterado={(value) => setDataConsulta(value.toISOString().slice(0, 10))} label={"Selecione a data"} />
                <BasicCard data={dataConsulta} valor={boletosBaixados.valor / 2} titulo="Total em valor de boletos liquidados dia" />
                <DashPizza uri={`rbx/boletosbaixadoscidade?data=${dataConsulta}`} metodo="POST" financeiro />
            </div>
            <div>
                <BasicDatePicker aoAlterado={(value) => setDataConsulta(value.toISOString().slice(0, 10))} label={"Selecione a data"} />
                <BasicCard valor={boletosAbertos.Valor} titulo="Total de boletos abertos" boletoAberto />
                <DashPizza uri={`rbx/boletosabertos/cidade`} metodo="POST" financeiro />
            </div>
        </FinanceiroStyled>
    );
};

export default Financeiro;
