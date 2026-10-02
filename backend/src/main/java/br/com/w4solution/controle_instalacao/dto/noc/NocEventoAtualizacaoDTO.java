package br.com.w4solution.controle_instalacao.dto.noc;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;

public record NocEventoAtualizacaoDTO(
        @NotBlank(message = "O status do problema é obrigatório")
        String statusProblema,

        LocalDateTime fim,
        String observacao
) {
}
