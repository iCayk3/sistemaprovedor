package br.com.w4solution.controle_instalacao.dto.usuarios;

public record ConfigurarIntegracaoRbxDTO(
        Long id,
        String usuarioRbx,
        String chaveApi,
        Boolean removerChave
) {
}
