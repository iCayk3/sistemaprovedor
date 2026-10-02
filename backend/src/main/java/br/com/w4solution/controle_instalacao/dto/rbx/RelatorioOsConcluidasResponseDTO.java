package br.com.w4solution.controle_instalacao.dto.rbx;

import java.util.List;
import java.util.Map;

public record RelatorioOsConcluidasResponseDTO(
        int totalConcluidas,
        long tempoMedioMinutos,
        String tempoMedioFormatado,
        Map<String, Long> totalPorTopico,
        Map<String, Long> totalPorTecnico,
        List<String> topicosDisponiveis,
        List<AtendimentoOsDTO> atendimentos
) {
}
