package br.com.w4solution.controle_instalacao.repository.chat;

import br.com.w4solution.controle_instalacao.domain.chat.ChatConversa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ChatConversaRepository extends JpaRepository<ChatConversa, Long> {
    @Query("select p.conversa from ChatParticipante p where p.usuario.id = :usuarioId order by p.conversa.atualizadaEm desc")
    List<ChatConversa> listarDoUsuario(Long usuarioId);
}
