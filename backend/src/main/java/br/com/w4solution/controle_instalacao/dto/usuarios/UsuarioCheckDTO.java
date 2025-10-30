package br.com.w4solution.controle_instalacao.dto.usuarios;

import jakarta.validation.constraints.NotBlank;

public record UsuarioCheckDTO(@NotBlank String usuario) {
}
