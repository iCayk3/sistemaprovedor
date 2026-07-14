package br.com.w4solution.controle_instalacao.repository.eventos;

import br.com.w4solution.controle_instalacao.domain.atividades.Atividade;
import br.com.w4solution.controle_instalacao.dto.evento.AtividadesDTO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;

public interface AtividadeRepository extends JpaRepository<Atividade, Long> {

    @Query("SELECT a.evento, COUNT(a) " +
            "FROM Atividade a " +
            "WHERE a.usuario LIKE %:usuario% " +
            "AND (a.segmento = :segmento OR (:segmento = 'ATIVIDADE' AND a.segmento IS NULL)) " +
            "AND EXTRACT(DAY FROM a.data) = :dia " +
            "AND EXTRACT(MONTH FROM a.data) = :mes " +
            "AND EXTRACT(YEAR FROM a.data) = :ano " +
            "GROUP BY a.evento")
    List<Object[]> encontrarAtividadesPorUsuario(String usuario, String segmento, Integer mes, Integer ano, Integer dia);

    @Query("SELECT a.usuario, a.evento, COUNT(a) " +
            "FROM Atividade a " +
            "WHERE (a.segmento = :segmento OR (:segmento = 'ATIVIDADE' AND a.segmento IS NULL)) " +
            "AND EXTRACT(MONTH FROM a.data) = :mes " +
            "AND EXTRACT(YEAR FROM a.data) = :ano " +
            "GROUP BY a.usuario, a.evento " +
            "ORDER BY a.usuario, a.evento")
    List<Object[]> encontrarAtividadesMensaisPorUsuario(String segmento, Integer mes, Integer ano);

    @Query("SELECT COUNT(a) FROM Atividade a " +
            " WHERE a.evento = :evento" +
            " AND (a.segmento = :segmento OR (:segmento = 'ATIVIDADE' AND a.segmento IS NULL)) " +
            " AND EXTRACT(MONTH FROM a.data) = :monthValue " +
            " AND EXTRACT(YEAR FROM a.data) = :year " +
            " GROUP BY EXTRACT(MONTH FROM a.data), EXTRACT(YEAR FROM a.data) " +
            " ORDER BY COUNT(a) DESC")
    Integer encontrarAtividadesMensal(String evento, String segmento, int monthValue, int year);

    @Query("SELECT a FROM Atividade a WHERE (a.segmento = :segmento OR (:segmento = 'ATIVIDADE' AND a.segmento IS NULL)) AND EXTRACT(MONTH FROM a.data) = :mes AND EXTRACT(YEAR FROM a.data) = :ano ORDER BY a.id DESC")
    List<Atividade> listarAtividadesDoMes(String segmento, Integer ano, Integer mes);
}
