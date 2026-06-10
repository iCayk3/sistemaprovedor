import { CircularProgress, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import styled from "styled-components";
import BasicCard from "../../Componentes/BasicCard";
import DashPizza from "../../Componentes/DashPizza";
import TabelaExibicao from "../../Componentes/TabelaExibicao";
import Api from "../../Services/Api";

const FinStyled = styled.section`
  .fin-table {
    margin-top: 32px;
  }

  .fin-pizza {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 32px;
    text-align: center;
  }
`;

const colunas = [
  { field: "codigo", headerName: "Codigo", width: 80 },
  { field: "nome", headerName: "Nome", width: 400 },
  { field: "valorDebito", headerName: "Debito", width: 100 },
  {
    field: "vencimentoBoleto",
    headerName: "Vencimento",
    width: 120,
    valueFormatter: (params) => {
      const raw = params;
      if (!raw) return "";
      const data = new Date(`${raw}`);
      return data.toLocaleDateString("pt-BR");
    },
  },
  { field: "diasAtrasado", headerName: "Dias atrasado", width: 100 },
  {
    field: "dataBloqueio",
    headerName: "Data bloqueio",
    width: 120,
    valueFormatter: (params) => {
      const raw = params;
      if (!raw) return "";
      const data = new Date(`${raw}`);
      return data.toLocaleDateString("pt-BR");
    },
  },
  { field: "diasBloqueado", headerName: "Dias bloqueado", width: 100 },
  { field: "telComercial", headerName: "Telefone comercial", width: 140 },
  { field: "telResidencial", headerName: "Telefone residencial", width: 140 },
  { field: "telCelular", headerName: "Telefone celular", width: 140 },
  { field: "endereco", headerName: "Rua", width: 400 },
  { field: "numero", headerName: "Numero", width: 120 },
  { field: "complemento", headerName: "Complemento", width: 180 },
  { field: "bairro", headerName: "Bairro", width: 150 },
  { field: "cidade", headerName: "Cidade", width: 200 },
  { field: "uf", headerName: "UF", width: 50 },
  { field: "cep", headerName: "CEP", width: 100 },
  { field: "grupo", headerName: "Praca de cobranca", width: 150 },
];

const UseApi = Api();

const Inadiplentes = () => {
  const [totalInadiplentes, setTotalInadiplentes] = useState({});
  const [inadiplentes, setInadiplentes] = useState({});
  const [clientesInadiplentes, setClientesInadiplentes] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const ttinadiplentes = await UseApi("rbx/boletosabertos/inadiplentes", "POST");
        const cinadiplentes = await UseApi("rbx/boletosabertos/inadiplentes/clientes", "POST");
        const inadip = await UseApi("rbx/boletosabertos?status=B", "POST");
        setTotalInadiplentes(ttinadiplentes);
        setClientesInadiplentes(cinadiplentes);
        setInadiplentes(inadip);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      }
    };

    fetchData();
  }, []);

  const dadosFiltrados = Array.isArray(clientesInadiplentes) ? clientesInadiplentes : [];

  return (
    <FinStyled>
      <div>
        <div className="fin-pizza">
          <Typography variant="h4" component="h2" sx={{ marginTop: 4 }}>
            {totalInadiplentes ? `Total de bloqueados: ${totalInadiplentes.total}` : <CircularProgress size="3rem" />}
          </Typography>
          <DashPizza uri="rbx/boletosabertos/inadiplentes/cidade" metodo="POST" financeiro />
        </div>

        <div className="fin-table">
          <TabelaExibicao rows={dadosFiltrados} columns={colunas} tablefin />
        </div>

        <BasicCard valor={inadiplentes.Valor} titulo="Bloqueados" boletoAberto />
      </div>
    </FinStyled>
  );
};

export default Inadiplentes;
