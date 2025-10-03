package br.com.w4solution.controle_instalacao.dto.cliente;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ClienteRbxDTO(

        @JsonProperty("Codigo")
        String codigo,

        @JsonProperty("Nome")
        String nome,

        @JsonProperty("TelComercial")
        String telComercial,

        @JsonProperty("TelResidencial")
        String telResidencial,

        @JsonProperty("TelCelular")
        String telCelular,

        @JsonProperty("Endereco")
        String endereco,

        @JsonProperty("Numero")
        String numero,

        @JsonProperty("Complemento")
        String complemento,

        @JsonProperty("Bairro")
        String bairro,

        @JsonProperty("Cidade")
        String cidade,

        @JsonProperty("UF")
        String uf,

        @JsonProperty("CEP")
        String cep,

        @JsonProperty("Grupo")
        String grupo,

        @JsonProperty("Situacao")
        String situacao

) {
        public String grupoNome() {
                return converterIdEmNome(grupo);
        }

        private static String converterIdEmNome(String id) {
                return switch (id) {
                        case "10", "36" -> "Pirabas";
                        case "11" -> "Primavera";
                        case "13" -> "Santarém Novo";
                        case "15" -> "Quatipuru";
                        case "16" -> "Boa Vista";
                        case "26" -> "Magalhães Barata";
                        case "32" -> "Maracanã";
                        case "33" -> "Marapanim";
                        case "34" -> "Salinópolis";
                        default -> "";
                };
        }
}
