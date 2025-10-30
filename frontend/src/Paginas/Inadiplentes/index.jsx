import { CircularProgress, Typography, Button, Stack } from "@mui/material";
import BasicCard from "../../Componentes/BasicCard";
import DashPizza from "../../Componentes/DashPizza";
import TableGrid from "../../Componentes/TableGrid";
import FieldAutoComplet from "../../Componentes/FieldAutoComplet";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { exportToExcel, exportToPDF } from "../../Utils/ExportUtils";
import Api from "../../Services/Api";
import TabelaExibicao from "../../Componentes/TabelaExibicao";
import TextFiltro from "../../Componentes/TextFiltro";

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
`

const colunas = [
  { field: 'codigo', headerName: 'Codigo', width: 80 },
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
  {
    field: 'dataBloqueio',
    headerName: 'Data bloqueio',
    width: 120,
    valueFormatter: (params) => {
      const raw = params;
      if (!raw) return '';
      const data = new Date(`${raw}`);
      return data.toLocaleDateString('pt-BR');
    }

  },
  { field: 'diasBloqueado', headerName: 'Dias bloqueado', width: 100 },
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
  { field: 'grupo', headerName: 'Praça de cobrança', width: 150 }
];

const procedimentos = [
  { id: "Pirabas", label: "Pirabas" },
  { id: "Primavera", label: "Primavera" },
  { id: "Santarém Novo", label: "Santarém Novo" },
  { id: "Quatipuru", label: "Quatipuru" },
  { id: "Boa Vista", label: "Boa Vista" },
  { id: "Magalhães Barata", label: "Magalhães Barata" },
  { id: "Maracanã", label: "Maracanã" },
  { id: "Marapanim", label: "Marapanim" },
  { id: "Salinópolis", label: "Salinópolis" }
];

const UseApi = Api()

const Inadiplentes = () => {

  const [totalInadiplentes, setTotalInadiplentes] = useState({});
  const [inadiplentes, setInadiplentes] = useState({});
  const [clientesInadiplentes, setClientesInadiplentes] = useState({});

  const [filtro, setFiltro] = useState('');
  const [pracaLabel, setPracaLabel] = useState('');


  useEffect(() => {
    const fetchData = async () => {
      try {
        const ttinadiplentes = await UseApi(`rbx/boletosabertos/inadiplentes`, 'POST')
        const cinadiplentes = await UseApi('rbx/boletosabertos/inadiplentes/clientes', 'POST');
        const inadip = await UseApi('rbx/boletosabertos?status=B', 'POST');
        setTotalInadiplentes(ttinadiplentes)
        setClientesInadiplentes(cinadiplentes)
        setInadiplentes(inadip)
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      }
    };

    fetchData();
  }, []);

  const dadosFiltrados = Array.isArray(clientesInadiplentes)
    ? clientesInadiplentes.filter(item =>
      !pracaLabel || item.grupo?.toLowerCase() === pracaLabel.toLowerCase()
    )
    : [];

  return (
    <FinStyled>
      <div>
        <div className="fin-pizza">
          <Typography variant="h4" component="h2" sx={{ marginTop: 4 }}>
            {totalInadiplentes ? `Total de bloqueados: ${totalInadiplentes.total}` : <CircularProgress size="3rem" />}
          </Typography>
          <DashPizza uri={`rbx/boletosabertos/inadiplentes/cidade`} metodo="POST" financeiro />
        </div>

        <div className="fin-table">
          {/* <TextFiltro onChange={setFiltro}/> */}
          <TabelaExibicao rows={dadosFiltrados} columns={colunas} tablefin filtroExterno={filtro}/>
        </div>

        <BasicCard valor={inadiplentes.Valor} titulo="Bloqueados" boletoAberto />
      </div>
    </FinStyled>
  );
};

export default Inadiplentes;
