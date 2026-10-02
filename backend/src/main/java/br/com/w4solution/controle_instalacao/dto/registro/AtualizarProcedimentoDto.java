package br.com.w4solution.controle_instalacao.dto.registro;

import jakarta.validation.constraints.NotBlank;

public record AtualizarProcedimentoDto(
        @NotBlank(message = "O nome do procedimento é obrigatório")
        String procedimento,

        @NotBlank(message = "A cor é obrigatória")
        String cor
) {
}
