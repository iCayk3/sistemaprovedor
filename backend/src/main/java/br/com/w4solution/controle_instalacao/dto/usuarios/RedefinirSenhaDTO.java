package br.com.w4solution.controle_instalacao.dto.usuarios;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RedefinirSenhaDTO(
        Long id,

        @NotBlank(message = "O nome de usuário é obrigatório")
        String usuario,

        @NotBlank(message = "A senha é obrigatória")
        @Size(min = 8, max = 100, message = "A senha deve ter no mínimo 8 caracteres")
        String senha,

        @NotBlank(message = "A confirmação de senha é obrigatória")
        String senhaNovamente
) {
}
