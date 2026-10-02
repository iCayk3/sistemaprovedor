package br.com.w4solution.controle_instalacao.dto.evento;

import jakarta.validation.constraints.NotBlank;

public record AtualizarEventoDTO(
        @NotBlank(message = "O nome do evento é obrigatório")
        String evento,

        @NotBlank(message = "O segmento é obrigatório")
        String segmento,

        Boolean encerraAtendimento
) {
}
