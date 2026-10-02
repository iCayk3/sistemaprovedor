package br.com.w4solution.controle_instalacao.dto.usuarios;

import jakarta.validation.constraints.NotNull;

public record AlterarSupervisorDTO(
        @NotNull(message = "O ID do usuário é obrigatório")
        Long id,

        @NotNull(message = "O indicador de supervisor é obrigatório")
        Boolean supervisor
) {
}
