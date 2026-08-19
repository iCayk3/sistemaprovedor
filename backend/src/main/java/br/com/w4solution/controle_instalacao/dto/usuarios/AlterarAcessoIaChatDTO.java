package br.com.w4solution.controle_instalacao.dto.usuarios;

import jakarta.validation.constraints.NotNull;

public record AlterarAcessoIaChatDTO(@NotNull Long id, boolean habilitado) {
}
