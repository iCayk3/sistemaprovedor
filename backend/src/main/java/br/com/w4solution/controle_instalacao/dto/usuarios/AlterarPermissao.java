package br.com.w4solution.controle_instalacao.dto.usuarios;

import br.com.w4solution.controle_instalacao.domain.usuarios.UserRole;
import jakarta.validation.constraints.NotNull;

public record AlterarPermissao(
        @NotNull(message = "O ID do usuário é obrigatório")
        Long id,

        @NotNull(message = "O nível de permissão é obrigatório")
        UserRole role
) {
}
