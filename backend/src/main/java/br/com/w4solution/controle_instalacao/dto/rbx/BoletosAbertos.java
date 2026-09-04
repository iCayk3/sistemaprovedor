package br.com.w4solution.controle_instalacao.dto.rbx;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record BoletosAbertos(
        @JsonProperty("Valor")
        Double valor,
        @JsonProperty("CliFor")
        String cliente,
        @JsonProperty("Vencimento")
        String vencimento,
        @JsonProperty("ContratosVinculados")
        @JsonAlias({"Contrato", "Contrato_Numero", "Numero_Contrato", "ContratoNumero"})
        String contratosVinculados,
        @JsonProperty("Documento")
        @JsonAlias({"Numero", "Numero_Documento", "Documento_Numero"})
        String documento
) {
    public BoletosAbertos(Double valor, String cliente, String vencimento) {
        this(valor, cliente, vencimento, null, null);
    }
}
