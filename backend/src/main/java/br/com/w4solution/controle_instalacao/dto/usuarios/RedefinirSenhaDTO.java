package br.com.w4solution.controle_instalacao.dto.usuarios;

import jakarta.validation.constraints.NotBlank;

public record RedefinirSenhaDTO(Long id, String usuario, String senha, String senhaNovamente) {
}
