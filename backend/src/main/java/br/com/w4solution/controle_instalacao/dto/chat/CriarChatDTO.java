package br.com.w4solution.controle_instalacao.dto.chat;

import jakarta.validation.constraints.NotNull;

public record CriarChatDTO(@NotNull Long usuarioId) {
}
