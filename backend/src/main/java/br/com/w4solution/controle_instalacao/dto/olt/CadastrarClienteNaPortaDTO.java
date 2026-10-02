package br.com.w4solution.controle_instalacao.dto.olt;

import jakarta.validation.constraints.NotNull;

public record CadastrarClienteNaPortaDTO(
        @NotNull(message = "O código do cliente é obrigatório")
        Integer codigo,

        @NotNull(message = "A porta da CTO é obrigatória")
        Long porta,

        String login
) {
}
