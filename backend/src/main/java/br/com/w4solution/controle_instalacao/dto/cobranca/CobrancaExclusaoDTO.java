package br.com.w4solution.controle_instalacao.dto.cobranca;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CobrancaExclusaoDTO(
        @NotBlank(message = "Informe o motivo da exclusão.")
        @Size(max = 500, message = "Motivo da exclusão não pode exceder 500 caracteres")
        String motivo
) {
}
