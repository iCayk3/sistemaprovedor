import { Box, CircularProgress, Typography } from "@mui/material";
import BasicCard from "../../Componentes/BasicCard";
import DashPizza from "../../Componentes/DashPizza";
import { useQuery } from "@tanstack/react-query";
import Api from "../../Services/Api";
import TabelaExibicao from "../../Componentes/TabelaExibicao";

const colunas = [
  { field: 'codigo', headerName: 'Código', width: 90 },
  { field: 'nome', headerName: 'Nome', width: 350 },
  { field: 'valorDebito', headerName: 'Débito', width: 110 },
  {
    field: 'vencimentoBoleto',
    headerName: 'Vencimento',
    width: 120,
    valueFormatter: (params) => {
      const raw = params;
      if (!raw) return '';
      const data = new Date(`${raw}`);
      return data.toLocaleDateString('pt-BR');
    },
  },
  { field: 'diasAtrasado', headerName: 'Dias atrasado', width: 110 },
  { field: 'telComercial', headerName: 'Telefone comercial', width: 140 },
  { field: 'telResidencial', headerName: 'Telefone residencial', width: 140 },
  { field: 'telCelular', headerName: 'Telefone celular', width: 140 },
  { field: 'endereco', headerName: 'Rua', width: 350 },
  { field: 'numero', headerName: 'Número', width: 100 },
  { field: 'complemento', headerName: 'Complemento', width: 160 },
  { field: 'bairro', headerName: 'Bairro', width: 140 },
  { field: 'cidade', headerName: 'Cidade', width: 180 },
  { field: 'uf', headerName: 'UF', width: 60 },
  { field: 'cep', headerName: 'CEP', width: 100 },
  { field: 'grupo', headerName: 'Praça de cobrança', width: 150 },
];

const colunasSemCobra = [
  { field: 'Codigo', headerName: 'Código', width: 90 },
  { field: 'Nome', headerName: 'Nome', width: 350 },
  { field: 'ValorDebito', headerName: 'Débito', width: 110 },
  { field: 'TelComercial', headerName: 'Telefone comercial', width: 140 },
  { field: 'TelResidencial', headerName: 'Telefone residencial', width: 140 },
  { field: 'TelCelular', headerName: 'Telefone celular', width: 140 },
  { field: 'Endereco', headerName: 'Rua', width: 350 },
  { field: 'Numero', headerName: 'Número', width: 100 },
  { field: 'Complemento', headerName: 'Complemento', width: 160 },
  { field: 'Bairro', headerName: 'Bairro', width: 140 },
  { field: 'Cidade', headerName: 'Cidade', width: 180 },
  { field: 'Uf', headerName: 'UF', width: 60 },
  { field: 'Cep', headerName: 'CEP', width: 100 },
  { field: 'Grupo', headerName: 'Praça de cobrança', width: 150 },
];

const UseApi = Api();

export default function Suspensos() {
  const { data: dadosSuspensosResp, isLoading } = useQuery({
    queryKey: ['suspensos', 'dashboard'],
    queryFn: async () => {
      const [ttsuspensos, csuspensos, suspensosData, suspensosSemCobr] = await Promise.all([
        UseApi(`rbx/boletosabertos/inadiplentes?status=S`, 'POST'),
        UseApi('rbx/boletosabertos/inadiplentes/clientes?suspenso=S', 'POST'),
        UseApi('rbx/boletosabertos?status=S', 'POST'),
        UseApi('rbx/suspensosemcobranca', 'POST'),
      ]);

      return {
        total: ttsuspensos,
        clientes: Array.isArray(csuspensos) ? csuspensos : [],
        geral: suspensosData || {},
        semCobranca: Array.isArray(suspensosSemCobr) ? suspensosSemCobr : [],
      };
    },
  });

  const totalSuspensos = dadosSuspensosResp?.total;
  const dadosSuspensos = dadosSuspensosResp?.clientes || [];
  const dadosSemCobranca = dadosSuspensosResp?.semCobranca || [];
  const suspensos = dadosSuspensosResp?.geral || {};

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 2, mt: 2 }}>
        <Typography variant="h5" fontWeight={800}>
          {isLoading ? (
            <CircularProgress size={30} />
          ) : (
            `Total de suspensos: ${totalSuspensos?.total ?? 0}`
          )}
        </Typography>
        <DashPizza
          uri="rbx/boletosabertos/inadiplentes/cidade?suspenso=S"
          metodo="POST"
          financeiro
        />
      </Box>

      <Box sx={{ width: '100%' }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Clientes suspensos
        </Typography>
        <TabelaExibicao
          rows={dadosSuspensos}
          columns={colunas}
          tablefin
          prefix="table-1"
          loading={isLoading}
        />
      </Box>

      <Box sx={{ width: '100%' }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Clientes suspensos sem cobrança
        </Typography>
        <TabelaExibicao
          rows={dadosSemCobranca}
          columns={colunasSemCobra}
          tablefin
          prefix="table-2"
          loading={isLoading}
        />
      </Box>

      <Box>
        <BasicCard valor={suspensos?.Valor} titulo="Suspensos" boletoAberto />
      </Box>
    </Box>
  );
}
