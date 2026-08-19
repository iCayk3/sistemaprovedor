package br.com.w4solution.controle_instalacao.repository.whatsapp;
import br.com.w4solution.controle_instalacao.domain.whatsapp.WhatsappConversa;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface WhatsappConversaRepository extends JpaRepository<WhatsappConversa, Long> {
    Optional<WhatsappConversa> findByInstanciaAndNumero(String instancia, String numero);
    List<WhatsappConversa> findAllByOrderByAtualizadaEmDesc();
}
