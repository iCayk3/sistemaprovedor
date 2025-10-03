package br.com.w4solution.controle_instalacao.dto.rbx;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record BoletosAbertos(
        @JsonProperty("Valor")
        Double valor,
        @JsonProperty("CliFor")
        String cliente,
        @JsonProperty("Vencimento")
        String vencimento
) {
}
