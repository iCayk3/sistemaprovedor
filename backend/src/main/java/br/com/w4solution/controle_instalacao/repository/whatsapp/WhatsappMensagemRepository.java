package br.com.w4solution.controle_instalacao.repository.whatsapp;
import br.com.w4solution.controle_instalacao.domain.whatsapp.WhatsappMensagem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
public interface WhatsappMensagemRepository extends JpaRepository<WhatsappMensagem, Long> {
    boolean existsByIdExterno(String idExterno);
    List<WhatsappMensagem> findByConversaIdOrderByEnviadaEmAsc(Long conversaId);
    Optional<WhatsappMensagem> findTopByConversaIdOrderByEnviadaEmDesc(Long conversaId);
    long countByConversaIdAndRecebidaTrueAndEnviadaEmAfter(Long conversaId, Instant depois);
}
