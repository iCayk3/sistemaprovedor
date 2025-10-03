package br.com.w4solution.controle_instalacao.dto.usuarios;

import br.com.w4solution.controle_instalacao.domain.usuarios.Status;

public record AlterarStatusDTO(Long id, Status status) {
}
