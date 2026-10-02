package br.com.w4solution.controle_instalacao.dto.evento;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record CadastrarAtividadesDTO(
        String cliente,

        @NotNull(message = "A data da atividade é obrigatória")
        LocalDate data,

        @NotBlank(message = "O evento é obrigatório")
        String evento,

        @NotBlank(message = "O segmento é obrigatório")
        String segmento,

        Double valor,
        String status,
        Integer codigoCliente,
        String grupoCliente,
        String plano,
        Double valorPlano
) {
}
