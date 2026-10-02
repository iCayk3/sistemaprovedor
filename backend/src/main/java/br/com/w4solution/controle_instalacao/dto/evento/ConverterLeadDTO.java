package br.com.w4solution.controle_instalacao.dto.evento;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ConverterLeadDTO(
        @NotNull(message = "O código do cliente é obrigatório")
        Integer codigoCliente,

        @NotBlank(message = "O número do contrato é obrigatório")
        String numeroContrato
) {
}
