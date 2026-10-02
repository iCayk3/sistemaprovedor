package br.com.w4solution.controle_instalacao.dto.registro;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CadastroRegistroDTO(
        @NotNull(message = "O código do cliente é obrigatório")
        Integer codigo,

        Long olt,
        Long porta,
        Long cto,

        @NotNull(message = "O técnico/equipe é obrigatório")
        Long tecnico,

        @NotBlank(message = "A data do registro é obrigatória")
        String dataregistro,

        @NotBlank(message = "O procedimento é obrigatório")
        String procedimento,

        String ctoAntiga,
        String localidade,
        String observacao,
        String login,
        String mac
) {
}
