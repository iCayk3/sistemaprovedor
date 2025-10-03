package br.com.w4solution.controle_instalacao.dto.usuarios;

import br.com.w4solution.controle_instalacao.domain.usuarios.UserRole;

public record AlterarPermissao(Long id, UserRole role) {
}
