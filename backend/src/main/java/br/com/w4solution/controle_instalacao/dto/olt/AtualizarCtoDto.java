package br.com.w4solution.controle_instalacao.dto.olt;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AtualizarCtoDto(
        @NotBlank(message = "O identificador/nome da CTO é obrigatório")
        String label,

        String lat,
        String longi,

        @NotNull(message = "A quantidade de portas é obrigatória")
        Integer portas
) {
}
