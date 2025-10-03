package br.com.w4solution.controle_instalacao.dto.cliente;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record BoletosBaixadosRbxDTO(
        @JsonProperty("CodigoPessoa")
        String codigoPessoa,
        @JsonProperty("ValorBaixado")
        String valorBaixado
) {
}
