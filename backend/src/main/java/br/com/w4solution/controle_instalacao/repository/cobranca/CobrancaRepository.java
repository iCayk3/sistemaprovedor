package br.com.w4solution.controle_instalacao.repository.cobranca;

import br.com.w4solution.controle_instalacao.domain.cobranca.Cobranca;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface CobrancaRepository extends JpaRepository<Cobranca, Long> {
    @Query(value = "SELECT pg_advisory_xact_lock(2026090801)", nativeQuery = true)
    Object bloquearGeracaoCobrancas();

    Optional<Cobranca> findTopByProtocoloStartingWithOrderByProtocoloDesc(String prefix);

    List<Cobranca> findAllByCodigoCliente(Integer codigoCliente);

    List<Cobranca> findAllByCodigoClienteAndNumeroContrato(Integer codigoCliente, String numeroContrato);

    Optional<Cobranca> findFirstByDocumentoTituloAndCodigoClienteAndExcluidaFalseOrderByIdDesc(String documentoTitulo, Integer codigoCliente);

    @Query("SELECT c FROM Cobranca c WHERE c.excluida = false " +
            "AND (:podeVerGeral = true OR (c.geradaAutomaticamente = true AND (c.responsavel IS NULL OR TRIM(c.responsavel) = '')) " +
            "     OR LOWER(c.responsavel) = LOWER(:usuario) OR LOWER(c.criadoPor) = LOWER(:usuario)) " +
            "ORDER BY c.data DESC NULLS LAST, c.criadoEm DESC NULLS LAST")
    List<Cobranca> listarCobrancas(@Param("usuario") String usuario, @Param("podeVerGeral") boolean podeVerGeral);

    @Query("SELECT c FROM Cobranca c WHERE c.geradaAutomaticamente = true " +
            "AND c.excluida = false " +
            "AND (c.responsavel IS NULL OR TRIM(c.responsavel) = '') " +
            "AND (c.situacaoAtendimento IS NULL OR LOWER(c.situacaoAtendimento) <> 'fechada') " +
            "AND c.dataVencimento IS NOT NULL AND c.dataVencimento <= :dataLimite " +
            "ORDER BY c.dataVencimento ASC NULLS LAST")
    List<Cobranca> listarAutomaticasDisponiveis(@Param("dataLimite") LocalDate dataLimite);

    @Query("SELECT c FROM Cobranca c WHERE c.excluida = false " +
            "AND (" +
            "  (c.geradaAutomaticamente = true AND LOWER(c.responsavel) = LOWER(:usuario)) " +
            "  OR " +
            "  (c.geradaAutomaticamente = false AND (LOWER(c.responsavel) = LOWER(:usuario) OR LOWER(c.criadoPor) = LOWER(:usuario)))" +
            ") " +
            "ORDER BY c.data DESC NULLS LAST, c.criadoEm DESC NULLS LAST")
    List<Cobranca> listarAcompanhamento(@Param("usuario") String usuario);

    @Query("SELECT c FROM Cobranca c WHERE UPPER(TRIM(c.status)) = 'PAGO' " +
            "AND (:podeVerGeral = true OR (c.geradaAutomaticamente = true AND (c.responsavel IS NULL OR TRIM(c.responsavel) = '')) " +
            "     OR LOWER(c.responsavel) = LOWER(:usuario) OR LOWER(c.criadoPor) = LOWER(:usuario)) " +
            "ORDER BY c.fechadoEm DESC NULLS LAST, c.atualizadoEm DESC NULLS LAST, c.data DESC NULLS LAST")
    List<Cobranca> listarPagas(@Param("usuario") String usuario, @Param("podeVerGeral") boolean podeVerGeral);

    @Query("SELECT c FROM Cobranca c WHERE (:podeVerGeral = true OR (c.geradaAutomaticamente = true AND (c.responsavel IS NULL OR TRIM(c.responsavel) = '')) " +
            "     OR LOWER(c.responsavel) = LOWER(:usuario) OR LOWER(c.criadoPor) = LOWER(:usuario)) " +
            "ORDER BY c.excluidoEm DESC NULLS LAST, c.fechadoEm DESC NULLS LAST, c.atualizadoEm DESC NULLS LAST, c.data DESC NULLS LAST")
    List<Cobranca> listarAuditoria(@Param("usuario") String usuario, @Param("podeVerGeral") boolean podeVerGeral);

    @Query("SELECT c FROM Cobranca c WHERE c.notificacaoEncerramentoPendente = true " +
            "AND LOWER(c.responsavel) = LOWER(:usuario) " +
            "ORDER BY c.notificacaoEncerramentoEm ASC NULLS LAST")
    List<Cobranca> listarNotificacoesEncerramento(@Param("usuario") String usuario);

    @Query("SELECT DISTINCT c.codigoCliente FROM Cobranca c WHERE c.excluida = false " +
            "AND (c.situacaoAtendimento IS NULL OR LOWER(c.situacaoAtendimento) <> 'fechada') " +
            "AND c.codigoCliente IS NOT NULL")
    Set<Integer> findClientesComAtendimentoAberto();

    List<Cobranca> findByStatusIntegracaoRbxAndAbertoNoRbxEmIsNotNull(String statusIntegracaoRbx);

    List<Cobranca> findByGeradaAutomaticamenteTrueAndExcluidaFalseAndCodigoClienteIsNotNullAndDocumentoTituloIsNotNull();

    @Query("SELECT c FROM Cobranca c WHERE c.excluida = false " +
            "AND ((c.criadoEm >= :inicio AND c.criadoEm < :fim) OR (c.fechadoEm >= :inicio AND c.fechadoEm < :fim))")
    List<Cobranca> buscarCobrancasRelatorio(@Param("inicio") LocalDateTime inicio, @Param("fim") LocalDateTime fim);
}
