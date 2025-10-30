import { CircularProgress, Typography } from "@mui/material";
import BasicCard from "../../Componentes/BasicCard";
import DashPizza from "../../Componentes/DashPizza";
import { useEffect, useState, useMemo } from "react";
import styled from "styled-components";
import Api from "../../Services/Api";
import TabelaExibicao from "../../Componentes/TabelaExibicao";

const FinStyled = styled.section`
  .fin-table { margin-top: 32px; }
  .fin-pizza {
    display: flex; flex-direction: column; justify-content: center;
    gap: 32px; text-align: center;
  }
`;

const colunas = [
  { field: 'codigo', headerName: 'Código', width: 80 },
  { field: 'nome', headerName: 'Nome', width: 400 },
  { field: 'valorDebito', headerName: 'Débito', width: 100 },
  {
    field: 'vencimentoBoleto',
    headerName: 'Vencimento',
    width: 120,
    valueFormatter: (params) => {
      const raw = params;
      if (!raw) return '';
      const data = new Date(`${raw}`);
      return data.toLocaleDateString('pt-BR');
    }

  },
  { field: 'diasAtrasado', headerName: 'Dias atrasado', width: 100 },
  { field: 'telComercial', headerName: 'Telefone comercial', width: 140 },
  { field: 'telResidencial', headerName: 'Telefone residencial', width: 140 },
  { field: 'telCelular', headerName: 'Telefone celular', width: 140 },
  { field: 'endereco', headerName: 'Rua', width: 400 },
  { field: 'numero', headerName: 'Número', width: 120 },
  { field: 'complemento', headerName: 'Complemento', width: 180 },
  { field: 'bairro', headerName: 'Bairro', width: 150 },
  { field: 'cidade', headerName: 'Cidade', width: 200 },
  { field: 'uf', headerName: 'UF', width: 50 },
  { field: 'cep', headerName: 'CEP', width: 100 },
  { field: 'grupo', headerName: 'Praça de cobrança', width: 150 },
];

const colunasSemCobra = [
  { field: 'Codigo', headerName: 'Código', width: 80 },
  { field: 'Nome', headerName: 'Nome', width: 400 },
  { field: 'ValorDebito', headerName: 'Débito', width: 100 },
  { field: 'TelComercial', headerName: 'Telefone comercial', width: 140 },
  { field: 'TelResidencial', headerName: 'Telefone residencial', width: 140 },
  { field: 'TelCelular', headerName: 'Telefone celular', width: 140 },
  { field: 'Endereco', headerName: 'Rua', width: 400 },
  { field: 'Numero', headerName: 'Número', width: 120 },
  { field: 'Complemento', headerName: 'Complemento', width: 180 },
  { field: 'Bairro', headerName: 'Bairro', width: 150 },
  { field: 'Cidade', headerName: 'Cidade', width: 200 },
  { field: 'Uf', headerName: 'UF', width: 50 },
  { field: 'Cep', headerName: 'CEP', width: 100 },
  { field: 'Grupo', headerName: 'Praça de cobrança', width: 150 },
];

const UseApi = Api();

export default function Suspensos() {
  const [totalSuspensos, setTotalSuspenso] = useState({});
  const [clientesSuspensos, setClienteSuspensos] = useState([]);
  const [suspensosSemBoleto, setSuspensoSemBoleto] = useState([]);
  const [suspensos, setSuspenso] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const ttsuspensos = await UseApi(`rbx/boletosabertos/inadiplentes?status=S`, 'POST');
        const csuspensos = await UseApi('rbx/boletosabertos/inadiplentes/clientes?suspenso=S', 'POST');
        const suspensos = await UseApi('rbx/boletosabertos?status=S', 'POST');
        const suspensosSemCobr = await UseApi('rbx/suspensosemcobranca', 'POST');

        setTotalSuspenso(ttsuspensos);
        setClienteSuspensos(Array.isArray(csuspensos) ? csuspensos : []);
        setSuspensoSemBoleto(Array.isArray(suspensosSemCobr) ? suspensosSemCobr : []);
        setSuspenso(suspensos);
      } catch (e) {
        console.error('Erro ao buscar dados:', e);
      }
    };
    fetchData();
  }, []);

  // Arrays estáveis
  const dadosSuspensos = useMemo(
    () => (Array.isArray(clientesSuspensos) ? clientesSuspensos : []),
    [clientesSuspensos]
  );

  const dadosSemCobranca = useMemo(
    () => (Array.isArray(suspensosSemBoleto) ? suspensosSemBoleto : []),
    [suspensosSemBoleto]
  );

  return (
    <FinStyled>
      <div className="fin-pizza">
        <Typography variant="h4" component="h2" sx={{ marginTop: 4 }}>
          {totalSuspensos?.total
            ? `Total de suspensos: ${totalSuspensos.total}`
            : <CircularProgress size="3rem" />}
        </Typography>
        <DashPizza
          uri={`rbx/boletosabertos/inadiplentes/cidade?suspenso=S`}
          metodo="POST"
          financeiro
        />
      </div>

      <div className="fin-table">
        <Typography variant="h4" component="h2" sx={{ marginTop: 4 }}>
          Clientes suspensos
        </Typography>
        <TabelaExibicao
          rows={dadosSuspensos}
          columns={colunas}
          tablefin
          prefix="table-1"
        />
      </div>

      <div className="fin-table">
        <Typography variant="h4" component="h2" sx={{ marginTop: 4 }}>
          Clientes suspensos sem cobrança
        </Typography>
        <TabelaExibicao
          rows={dadosSemCobranca}
          columns={colunasSemCobra}
          tablefin
          prefix="table-2"
        />
      </div>

      <BasicCard valor={suspensos?.Valor} titulo="Suspensos" boletoAberto />
    </FinStyled>
  );
}
