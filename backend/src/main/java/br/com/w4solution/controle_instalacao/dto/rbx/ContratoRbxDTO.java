package br.com.w4solution.controle_instalacao.dto.rbx;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ContratoRbxDTO(
        @JsonProperty("Cliente_Codigo")
        String clienteCodigo,
        @JsonProperty("Cliente_Nome")
        String clienteNome,
        @JsonProperty("Numero")
        String numero,
        @JsonProperty("Plano_Descricao")
        String planoDescricao,
        @JsonProperty("ValorLiquido")
        String valorLiquido,
        @JsonProperty("ValorBruto")
        String valorBruto,
        @JsonProperty("Situacao_Descricao")
        String situacaoDescricao
) {
}
