package br.com.w4solution.controle_instalacao.repository.cobranca;

import br.com.w4solution.controle_instalacao.domain.cobranca.FaturamentoMensalTitulo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface FaturamentoMensalTituloRepository extends JpaRepository<FaturamentoMensalTitulo, Long> {
    List<FaturamentoMensalTitulo> findByMesReferencia(LocalDate mesReferencia);
    List<FaturamentoMensalTitulo> findByMesReferenciaBetween(LocalDate inicio, LocalDate fim);
    List<FaturamentoMensalTitulo> findByBaixadoFalse();
    Optional<FaturamentoMensalTitulo> findFirstByDocumentoAndCodigoClienteAndBaixadoFalseOrderByMesReferenciaDesc(String documento, String codigoCliente);
    boolean existsByMesReferencia(LocalDate mesReferencia);
    void deleteByMesReferencia(LocalDate mesReferencia);
}
