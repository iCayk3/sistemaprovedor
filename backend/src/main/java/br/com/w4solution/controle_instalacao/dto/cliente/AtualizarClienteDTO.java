package br.com.w4solution.controle_instalacao.dto.cliente;

import jakarta.validation.constraints.NotNull;

public record AtualizarClienteDTO(
        @NotNull(message = "O ID do cliente é obrigatório")
        Long id,
        String nome,
        Long idPorta
) {
}
