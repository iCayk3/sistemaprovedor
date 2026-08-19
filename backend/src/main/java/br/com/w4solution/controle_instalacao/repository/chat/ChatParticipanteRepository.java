package br.com.w4solution.controle_instalacao.repository.chat;

import br.com.w4solution.controle_instalacao.domain.chat.ChatParticipante;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChatParticipanteRepository extends JpaRepository<ChatParticipante, Long> {
    Optional<ChatParticipante> findByConversaIdAndUsuarioId(Long conversaId, Long usuarioId);
    List<ChatParticipante> findByConversaId(Long conversaId);
    List<ChatParticipante> findByUsuarioId(Long usuarioId);
}
