import React from 'react';
import BasicDatePicker from '../BasicDatePicker';
import styled from 'styled-components';
import TabelaResumo from '../TabelaResumo';

const DivTableComponent = styled.div`
        display: block;
        justify-content: center;
        align-items: center;
        /* background-color: #fff; */
        /* padding: 4px; */
        border-radius: 8px;
        position: relative;

        table {
            width: 100%;
            /* border-collapse: collapse; */
            box-sizing: border-box;
            /* margin-bottom: 128px; */
        }
        th, td {
            border-radius: 8px;
            border: 1px solid #dbe9ff;
            padding: 6px;
            text-align: left;
        }
        th {
            background-color: #7192ff;
        }
        td {
            text-align: center;
        }

        @media only screen and (max-width: 1438px) {
               
        }
        @media only screen and (max-width: 998px) {
            
        }
        @media only screen and (max-width: 768px) {
                
        }
        @media only screen and (max-width: 600px) {
            h1 {
                font-size: 14px;
            }
        }

    `

const ResumoMensal = ({dataApiCto, loagdinCto, errorCto, aoSelectData}) => {

    if (loagdinCto) return <p>Carregando...</p>;
    if (errorCto) return <p>Erro ao carregar os dados: {errorCto}</p>;

    if (!dataApiCto || typeof dataApiCto !== 'object') {
        return <p>Nenhum dado disponível.</p>;
    }

    return (
        <DivTableComponent>
            <h1>Total mensal</h1>
            <section><TabelaResumo rows={dataApiCto} /></section>
            <BasicDatePicker label={"Selecione o ano e mês"} views={['year','month']} aoAlterado={aoSelectData} open={'month'}/>
        </DivTableComponent>
    );
};

export default ResumoMensal;