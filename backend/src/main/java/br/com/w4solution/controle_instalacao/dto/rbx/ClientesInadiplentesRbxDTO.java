package br.com.w4solution.controle_instalacao.dto.rbx;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ClientesInadiplentesRbxDTO(
        @JsonProperty("Codigo")
        String codigo,
        @JsonProperty("Nome")
        String nome,
        @JsonProperty("DataBloqueio")
        String dataBloqueio,
        @JsonProperty("DiasBloqueio")
        String diasBloqueado
) {
}
