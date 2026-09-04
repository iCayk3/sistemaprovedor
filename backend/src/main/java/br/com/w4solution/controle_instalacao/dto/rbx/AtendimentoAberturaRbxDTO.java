package br.com.w4solution.controle_instalacao.dto.rbx;

import java.time.LocalDate;
import java.time.LocalTime;

public record AtendimentoAberturaRbxDTO(
        LocalDate dataAbertura,
        LocalTime horaAbertura,
        String iniciativa,
        String modo,
        String tipoCliente,
        Long cliente,
        Long contrato,
        Long contato,
        Integer prioridade,
        String situacao,
        String tipo,
        Long topico,
        Long fluxo,
        String assunto,
        String ocorrencia
) {
}
