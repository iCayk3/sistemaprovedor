package br.com.w4solution.controle_instalacao.dto.cliente;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record GrupoClientesDTO(
        @JsonProperty("Codigo")
        String codigo,
        @JsonProperty("Nome")
        String nome
) {
}
