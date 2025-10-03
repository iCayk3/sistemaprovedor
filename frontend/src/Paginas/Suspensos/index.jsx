import { CircularProgress, Typography, Button, Stack } from "@mui/material";
import BasicCard from "../../Componentes/BasicCard";
import DashPizza from "../../Componentes/DashPizza";
import TableGrid from "../../Componentes/TableGrid";
import FieldAutoComplet from "../../Componentes/FieldAutoComplet";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { exportToExcel, exportToPDF } from "../../Utils/ExportUtils";
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

const colunasSemCobra = [
  { field: 'Codigo', headerName: 'Codigo', width: 80 },
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
  { field: 'Grupo', headerName: 'Praça de cobrança', width: 150 }
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

const Suspensos = () => {
  const [suspensos, setSuspenso] = useState({});
  const [suspensosSemBoleto, setSuspensoSemBoleto] = useState({});
  const [totalSuspensos, setTotalSuspenso] = useState({});
  const [clientesSuspensos, setClienteSuspensos] = useState({});

  const [praca, setPraca] = useState('');
  const [pracaLabel, setPracaLabel] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const ttsuspensos = await UseApi(`rbx/boletosabertos/inadiplentes?status=S`, 'POST')
        const csuspensos = await UseApi('rbx/boletosabertos/inadiplentes/clientes?suspenso=S', 'POST');
        const suspensos = await UseApi('rbx/boletosabertos?status=S', 'POST');
        const suspensosSemCobr = await UseApi('rbx/suspensosemcobranca', 'POST');
        setTotalSuspenso(ttsuspensos)
        setClienteSuspensos(csuspensos)
        setSuspenso(suspensos)
        setSuspensoSemBoleto(suspensosSemCobr)
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      }
    };

    fetchData();
  }, []);

  const dadosFiltrados = Array.isArray(clientesSuspensos)
    ? clientesSuspensos.filter(item =>
      !pracaLabel || item.grupo?.toLowerCase() === pracaLabel.toLowerCase()
    )
    : [];

  const dadosFiltradosSemCobranca = Array.isArray(suspensosSemBoleto)
    ? suspensosSemBoleto.filter(item =>
      !pracaLabel || item.grupo?.toLowerCase() === pracaLabel.toLowerCase()
    )
    : [];

  return (
    <FinStyled>
      <div>
        <div className="fin-pizza">
          <Typography variant="h4" component="h2" sx={{ marginTop: 4 }}>
            {totalSuspensos ? `Total de suspensos: ${totalSuspensos.total}` : <CircularProgress size="3rem" />}
          </Typography>
          <DashPizza uri={`rbx/boletosabertos/inadiplentes/cidade?suspenso=S`} metodo="POST" financeiro />
        </div>

        <div className="fin-table">
          <Typography variant="h4" component="h2" sx={{ marginTop: 4 }}>
            {totalSuspensos ? `Total de suspensos: ${totalSuspensos.total}` : <CircularProgress size="3rem" />}
          </Typography>

          <Stack direction="row" spacing={2} sx={{ marginBottom: 2, marginTop: 2 }}>
            <Button variant="contained" color="primary" onClick={() => exportToExcel(dadosFiltrados, "suspensos")}>
              Exportar Excel
            </Button>
            <Button variant="contained" color="secondary" onClick={() => exportToPDF(colunas, dadosFiltrados, "suspensos")}>
              Exportar PDF
            </Button>
          </Stack>

          <TableGrid id dados={dadosFiltrados} colunasEdit={colunas} financeiro sx={{ marginTop: 4 }} filtro={pracaLabel} prefix={"table-1"} />
        </div>

        <div className="fin-table">

          <Typography variant="h4" component="h2" sx={{ marginTop: 4 }}>
            Cleintes suspensos sem cobranças
          </Typography>

          <Stack direction="row" spacing={2} sx={{ marginBottom: 2, marginTop: 2 }}>
            <Button variant="contained" color="primary" onClick={() => exportToExcel(dadosFiltradosSemCobranca, "suspensos_sem_cobranca")}>
              Exportar Excel
            </Button>
            <Button variant="contained" color="secondary" onClick={() => exportToPDF(colunasSemCobra, dadosFiltradosSemCobranca, "suspensos_sem_cobranca")}>
              Exportar PDF
            </Button>
          </Stack>
          <TableGrid id dados={dadosFiltradosSemCobranca} colunasEdit={colunasSemCobra} financeiro sx={{ marginTop: 4 }} filtro={pracaLabel} prefix={"table-2"} />
        </div>

        <BasicCard valor={suspensos.Valor} titulo="suspensos" boletoAberto />
      </div>
    </FinStyled>
  );
};

export default Suspensos;
