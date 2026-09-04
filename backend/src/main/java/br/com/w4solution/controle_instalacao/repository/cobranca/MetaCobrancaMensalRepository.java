package br.com.w4solution.controle_instalacao.repository.cobranca;

import br.com.w4solution.controle_instalacao.domain.cobranca.MetaCobrancaMensal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;

public interface MetaCobrancaMensalRepository extends JpaRepository<MetaCobrancaMensal, Long> {
    Optional<MetaCobrancaMensal> findByMesReferencia(LocalDate mesReferencia);
}
