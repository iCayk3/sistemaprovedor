package br.com.w4solution.controle_instalacao.dto.rbx;

import java.util.List;
import java.util.Map;

public record RelatorioClientesPlanoCidadeDTO(
        int totalGeralContratos,
        int totalClientesUnicos,
        int totalContratosCobrados,
        int totalPessoasCobradas,
        int totalContratosNaoCobrados,
        int totalPessoasNaoCobradas,
        List<String> cidades,
        SecaoPlanoCidadeDTO cobrados,
        SecaoPlanoCidadeDTO naoCobrados,
        SecaoPlanoCidadeDTO consolidado,
        String atualizadoEm
) {
    public record SecaoPlanoCidadeDTO(
            int totalContratos,
            int totalPessoas,
            int totalPlanos,
            Map<String, Integer> totaisPorCidadeContratos,
            Map<String, Integer> totaisPorCidadePessoas,
            List<LinhaPlanoCidadeDTO> linhas,
            List<ItemDistribuicaoDTO> topPlanos,
            List<ItemDistribuicaoDTO> topCidades
    ) {
    }

    public record LinhaPlanoCidadeDTO(
            String plano,
            int totalContratos,
            int totalPessoas,
            boolean cobrado,
            Map<String, Integer> quantidadePorCidade,
            Map<String, Integer> pessoasPorCidade
    ) {
    }

    public record ItemDistribuicaoDTO(
            String label,
            int total,
            double percentual
    ) {
    }
}
