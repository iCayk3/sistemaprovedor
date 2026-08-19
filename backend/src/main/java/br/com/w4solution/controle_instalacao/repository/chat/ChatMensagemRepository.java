package br.com.w4solution.controle_instalacao.repository.chat;

import br.com.w4solution.controle_instalacao.domain.chat.ChatMensagem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface ChatMensagemRepository extends JpaRepository<ChatMensagem, Long> {
    List<ChatMensagem> findByConversaIdOrderByEnviadaEmAsc(Long conversaId);
    Optional<ChatMensagem> findTopByConversaIdOrderByEnviadaEmDesc(Long conversaId);

    @Query("select count(m) from ChatMensagem m where m.conversa.id = :conversaId and m.autor.id <> :usuarioId and m.enviadaEm > :depoisDe")
    long contarNaoLidas(Long conversaId, Long usuarioId, Instant depoisDe);
}
