package br.com.w4solution.controle_instalacao.dto.evento;

import jakarta.validation.constraints.NotBlank;

public record NaoConcluirVendaDTO(
        @NotBlank(message = "O motivo da não conclusão é obrigatório")
        String motivo,

        String observacao
) {
}
