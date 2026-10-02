package br.com.w4solution.controle_instalacao.repository.cobranca;

import br.com.w4solution.controle_instalacao.domain.cobranca.CobrancaHistorico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

public interface CobrancaHistoricoRepository extends JpaRepository<CobrancaHistorico, Long> {
    List<CobrancaHistorico> findAllByCobrancaIdOrderByCriadoEmDesc(Long cobrancaId);

    void deleteAllByCobrancaId(Long cobrancaId);

    @Query("SELECT h FROM CobrancaHistorico h WHERE h.cobranca.id IN :cobrancaIds ORDER BY h.criadoEm DESC")
    List<CobrancaHistorico> findAllByCobrancaIdInOrderByCriadoEmDesc(@Param("cobrancaIds") Collection<Long> cobrancaIds);

    @Query("SELECT h FROM CobrancaHistorico h JOIN FETCH h.cobranca c WHERE h.criadoEm >= :inicio AND h.criadoEm < :fim")
    List<CobrancaHistorico> buscarMovimentosNoPeriodo(@Param("inicio") LocalDateTime inicio, @Param("fim") LocalDateTime fim);
}
