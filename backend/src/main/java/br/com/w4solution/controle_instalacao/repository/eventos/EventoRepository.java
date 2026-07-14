package br.com.w4solution.controle_instalacao.repository.eventos;

import br.com.w4solution.controle_instalacao.domain.atividades.Evento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface EventoRepository extends JpaRepository<Evento, Long> {

    @Query("SELECT e FROM Evento e WHERE e.segmento = :segmento OR (:segmento = 'ATIVIDADE' AND e.segmento IS NULL) ORDER BY e.evento")
    List<Evento> encontrarPorSegmento(String segmento);
}
