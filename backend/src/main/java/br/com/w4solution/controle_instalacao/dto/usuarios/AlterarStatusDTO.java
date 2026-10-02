package br.com.w4solution.controle_instalacao.dto.usuarios;

import br.com.w4solution.controle_instalacao.domain.usuarios.Status;
import jakarta.validation.constraints.NotNull;

public record AlterarStatusDTO(
        @NotNull(message = "O ID do usuário é obrigatório")
        Long id,

        @NotNull(message = "O status é obrigatório")
        Status status
) {
}
