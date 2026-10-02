package br.com.w4solution.controle_instalacao.dto.evento;

import jakarta.validation.constraints.NotNull;

public record IdDTO(@NotNull(message = "ID é obrigatório") Long id) {
}
