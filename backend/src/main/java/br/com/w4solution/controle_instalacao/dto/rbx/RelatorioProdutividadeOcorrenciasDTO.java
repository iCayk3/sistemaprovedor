package br.com.w4solution.controle_instalacao.dto.rbx;

import java.util.List;
import java.util.Map;

public record RelatorioProdutividadeOcorrenciasDTO(
        String dataInicio,
        String dataFim,
        int totalConcluidas,
        int totalAbortadas,
        int totalGeral,
        int totalUsuariosAtivos,
        List<String> dias,
        List<ProdutividadeUsuarioDTO> usuarios,
        List<OcorrenciaDetalheDTO> ocorrencias
) {

    public record ProdutividadeUsuarioDTO(
            String usuario,
            int totalConcluidas,
            int totalAbortadas,
            int totalGeral,
            Map<String, Integer> concluidasPorDia,
            Map<String, Integer> abortadasPorDia
    ) {}

    public record OcorrenciaDetalheDTO(
            String id,
            String dataHora,
            String dia,
            String usuario,
            String tipo, // "CONCLUIDO" ou "ABORTADO"
            String atendimentoNumero,
            String protocolo,
            String topico,
            String codigoCliente,
            String descricao,
            String latitude,
            String longitude
    ) {}
}
