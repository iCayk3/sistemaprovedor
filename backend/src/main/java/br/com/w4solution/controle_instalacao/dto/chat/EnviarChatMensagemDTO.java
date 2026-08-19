package br.com.w4solution.controle_instalacao.dto.chat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record EnviarChatMensagemDTO(@NotBlank @Size(max = 4000) String texto) {
}
