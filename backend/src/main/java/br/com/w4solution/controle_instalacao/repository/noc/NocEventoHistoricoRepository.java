package br.com.w4solution.controle_instalacao.repository.noc;

import br.com.w4solution.controle_instalacao.domain.noc.NocEventoHistorico;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NocEventoHistoricoRepository extends JpaRepository<NocEventoHistorico, Long> {
    List<NocEventoHistorico> findAllByEventoIdOrderByCriadoEmDesc(Long eventoId);
}
