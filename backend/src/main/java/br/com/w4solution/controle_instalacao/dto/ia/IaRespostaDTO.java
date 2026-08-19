package br.com.w4solution.controle_instalacao.dto.ia;

import java.time.Instant;

public record IaRespostaDTO(
        String resposta,
        String modo,
        String modelo,
        Instant geradoEm
) {
}
