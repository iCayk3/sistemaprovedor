package br.com.w4solution.controle_instalacao.repository.cobranca;

import br.com.w4solution.controle_instalacao.domain.cobranca.CobrancaConfiguracao;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CobrancaConfiguracaoRepository extends JpaRepository<CobrancaConfiguracao, Long> {
}
