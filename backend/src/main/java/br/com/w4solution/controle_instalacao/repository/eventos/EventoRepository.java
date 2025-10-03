package br.com.w4solution.controle_instalacao.repository.eventos;

import br.com.w4solution.controle_instalacao.domain.atividades.Evento;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventoRepository extends JpaRepository<Evento, Long> {
}
