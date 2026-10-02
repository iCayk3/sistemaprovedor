package br.com.w4solution.controle_instalacao.dto.usuarios;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ConfigurarIntegracaoRbxDTO(
        @NotNull(message = "ID do usuário é obrigatório")
        Long id,
        @Size(max = 100, message = "Usuário RBX não pode exceder 100 caracteres")
        String usuarioRbx,
        @Size(max = 255, message = "Chave da API não pode exceder 255 caracteres")
        String chaveApi,
        Boolean removerChave
) {
}
