package br.com.w4solution.controle_instalacao.repository.cobranca;

import br.com.w4solution.controle_instalacao.domain.cobranca.Cobranca;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CobrancaRepository extends JpaRepository<Cobranca, Long> {
    Optional<Cobranca> findTopByProtocoloStartingWithOrderByProtocoloDesc(String prefix);
}
