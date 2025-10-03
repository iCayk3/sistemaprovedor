import * as React from 'react';
import { PieChart } from '@mui/x-charts/PieChart';
import styled from 'styled-components';
import Api from '../../Services/Api';
import { CircularProgress } from '@mui/material';

const DivDashEstilizada = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  .itens {
    position: relative;
    align-items: center;
    border-radius: 10px;
    box-shadow: 4px 4px 10px rgba(0, 0, 0, 0.2);
    margin: 8px;
    height: 22.5rem;
  }

  @media only screen and (max-width: 1438px) {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
  }

  @media only screen and (max-width: 998px) {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
  }

  @media only screen and (max-width: 768px) {
    .itens rect {
      display: none;
    }

    .itens tspan {
      display: none;
    }
  }

  @media only screen and (max-width: 600px) {
    .itens rect {
      display: none;
    }

    .itens tspan {
      display: none;
    }
  }
`;

// Cores associadas fixamente aos tipos
const colorMap = {
  "INSTALAÇÃO": "#00F07A",          // Laranja vibrante
  "MUDANÇA DE ENDEREÇO": "#5A76ED", // Turquesa claro
  "SEM INTERNET": "#F0D60D",        // Vermelho escuro
  "LENTIDÃO": "#8338EC",            // Roxo elétrico
  "MUDANCA DE COMODO": "#B55AED",   // Amarelo pastel
  "TROCA DE EQUIPAMENTO": "#CA5AED",// Azul petróleo escuro
  "CANCELAMENTO": "#F00700",        // Verde menta
  "REATIVACAO": "#3A18F0",          // Vermelho coral
  "MIGRACÃO": "#5C3C92",            // Roxo escuro
  "TROCA DE SENHA": "#2EC4B6",      // Verde água
  "OUTROS": "#A9CAED",            // Azul forte
  "Pirabas": "#00F07A",
  "Primavera": "#5A76ED",
  "Santarem novo": "#F0D60D",
  "Quatipuru": "#8338EC",
  "Boa vista": "#B55AED",
  "Magalhães Barata": "#3A18F0",
  "Maracanã": "#5C3C92",
  "Marapanim": "#2EC4B6",
  "Salinopolis": "#A9CAED"
};

const DashPizza = ({ filtro, uri, financeiro, sx, metodo = 'GET' }) => {
  const [data, setData] = React.useState();
  const UseApi = React.useMemo(() => Api(), []);

  React.useEffect(() => {
    let ativo = true;

    const fetchData = async () => {
      try {
        const response = await UseApi(uri, metodo);
        if (ativo) setData(response);
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      }
    };

    fetchData();

    return () => {
      ativo = false;
    };
  }, [uri, filtro]);


  return (
    <DivDashEstilizada>
      {!financeiro && data && Array.isArray(data) && data.map((dados, index) => (
        dados.servicos && dados.servicos.length > 0 &&
        <div key={index} className="itens">
          <h4>{dados.nome}</h4>
          <PieChart
            series={[{
              data: dados.servicos.map(servico => ({
                ...servico,
                color: servico.cor || '#999'
              })),
              highlightScope: { fade: 'global', highlight: 'item' },
              faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' }
            }]}
            height={280}
            sx={sx}
          />
        </div>
      ))}
      {financeiro && data && Array.isArray(data) &&
        <PieChart
          series={[{
            data: data.map(item => ({
              ...item,
              color: colorMap[item.label] || '#999'
            })),
            highlightScope: { fade: 'global', highlight: 'item' },
            faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' }
          }]}
          height={280}
          sx={sx}
        />
      }
      {financeiro && !data && <CircularProgress size="3rem" />}
    </DivDashEstilizada>
  );
};


export default DashPizza;
