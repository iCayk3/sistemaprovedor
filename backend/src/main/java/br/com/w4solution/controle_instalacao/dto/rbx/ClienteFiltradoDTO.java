package br.com.w4solution.controle_instalacao.dto.rbx;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ClienteFiltradoDTO(
        @JsonProperty("Codigo")
        String codigo,
        @JsonProperty("Nome")
        String nome,
        @JsonProperty("CNPJ_CNPF")
        String cpfCnpj,
        @JsonProperty("Sigla")
        String sigla,
        @JsonProperty("Grupo")
        String grupo,
        @JsonProperty("Grupo_Nome")
        String grupoNome,
        @JsonProperty("Situacao")
        String situacao
) {
}
