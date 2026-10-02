package br.com.w4solution.controle_instalacao.dto.rbx.radius;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;
import java.time.LocalTime;

public record ConsultaAuditoriaIpDTO(
        @NotBlank(message = "O endereço IP é obrigatório.")
        String ip,
        LocalDate data,
        LocalTime hora,
        String dataInicio,
        String dataFim
) {}
