package br.com.w4solution.controle_instalacao.dto.cobranca;

import br.com.w4solution.controle_instalacao.domain.cobranca.CobrancaConfiguracao;

public record CobrancaConfiguracaoDTO(Boolean permitirFechamentoPorOutroUsuario) {
    public CobrancaConfiguracaoDTO(CobrancaConfiguracao configuracao) {
        this(Boolean.TRUE.equals(configuracao.getPermitirFechamentoPorOutroUsuario()));
    }
}
