package br.com.w4solution.controle_instalacao.repository.cobranca;

import br.com.w4solution.controle_instalacao.domain.cobranca.CobrancaHistorico;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CobrancaHistoricoRepository extends JpaRepository<CobrancaHistorico, Long> {
    List<CobrancaHistorico> findAllByCobrancaIdOrderByCriadoEmDesc(Long cobrancaId);
}
