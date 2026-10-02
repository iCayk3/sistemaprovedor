import { Box, CircularProgress, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import BasicCard from "../../Componentes/BasicCard";
import DashPizza from "../../Componentes/DashPizza";
import TabelaExibicao from "../../Componentes/TabelaExibicao";
import Api from "../../Services/Api";

const colunas = [
  { field: "codigo", headerName: "Código", width: 90 },
  { field: "nome", headerName: "Nome", width: 350 },
  { field: "valorDebito", headerName: "Débito", width: 110 },
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
  { field: "diasAtrasado", headerName: "Dias atrasado", width: 110 },
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
  { field: "diasBloqueado", headerName: "Dias bloqueado", width: 110 },
  { field: "telComercial", headerName: "Telefone comercial", width: 140 },
  { field: "telResidencial", headerName: "Telefone residencial", width: 140 },
  { field: "telCelular", headerName: "Telefone celular", width: 140 },
  { field: "endereco", headerName: "Rua", width: 350 },
  { field: "numero", headerName: "Número", width: 100 },
  { field: "complemento", headerName: "Complemento", width: 160 },
  { field: "bairro", headerName: "Bairro", width: 140 },
  { field: "cidade", headerName: "Cidade", width: 180 },
  { field: "uf", headerName: "UF", width: 60 },
  { field: "cep", headerName: "CEP", width: 100 },
  { field: "grupo", headerName: "Praça de cobrança", width: 150 },
];

const UseApi = Api();

const Inadiplentes = () => {
  const { data: dadosInadimplentes, isLoading } = useQuery({
    queryKey: ['inadiplentes', 'dashboard'],
    queryFn: async () => {
      const [ttinadiplentes, cinadiplentes, inadip] = await Promise.all([
        UseApi("rbx/boletosabertos/inadiplentes", "POST"),
        UseApi("rbx/boletosabertos/inadiplentes/clientes", "POST"),
        UseApi("rbx/boletosabertos?status=B", "POST"),
      ]);
      return {
        total: ttinadiplentes,
        clientes: Array.isArray(cinadiplentes) ? cinadiplentes : [],
        geral: inadip || {},
      };
    },
  });

  const totalInadiplentes = dadosInadimplentes?.total;
  const clientesInadiplentes = dadosInadimplentes?.clientes || [];
  const inadiplentes = dadosInadimplentes?.geral || {};

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 2, mt: 2 }}>
        <Typography variant="h5" fontWeight={800}>
          {isLoading ? (
            <CircularProgress size={30} />
          ) : (
            `Total de bloqueados: ${totalInadiplentes?.total ?? 0}`
          )}
        </Typography>
        <DashPizza uri="rbx/boletosabertos/inadiplentes/cidade" metodo="POST" financeiro />
      </Box>

      <Box sx={{ width: '100%' }}>
        <TabelaExibicao rows={clientesInadiplentes} columns={colunas} tablefin loading={isLoading} />
      </Box>

      <Box>
        <BasicCard valor={inadiplentes.Valor} titulo="Bloqueados" boletoAberto />
      </Box>
    </Box>
  );
};

export default Inadiplentes;
