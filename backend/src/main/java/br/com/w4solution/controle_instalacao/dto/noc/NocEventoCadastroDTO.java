package br.com.w4solution.controle_instalacao.dto.noc;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record NocEventoCadastroDTO(
        String origem,

        @NotBlank(message = "O tipo do evento é obrigatório")
        String tipoEvento,

        String tecnico,
        String cliente,
        String cidade,
        String bairro,

        @NotNull(message = "A data/hora de início é obrigatória")
        LocalDateTime inicio,

        LocalDateTime fim,

        @NotBlank(message = "O status do problema é obrigatório")
        String statusProblema,

        String observacoes
) {
}
