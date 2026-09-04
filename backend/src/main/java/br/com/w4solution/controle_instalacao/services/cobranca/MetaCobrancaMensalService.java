package br.com.w4solution.controle_instalacao.services.cobranca;

import br.com.w4solution.controle_instalacao.domain.cobranca.MetaCobrancaMensal;
import br.com.w4solution.controle_instalacao.dto.cobranca.MetaCobrancaMensalDTO;
import br.com.w4solution.controle_instalacao.repository.cobranca.MetaCobrancaMensalRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
public class MetaCobrancaMensalService {
    private final MetaCobrancaMensalRepository repository;

    public MetaCobrancaMensalService(MetaCobrancaMensalRepository repository) {
        this.repository = repository;
    }

    public MetaCobrancaMensalDTO buscar(LocalDate mes) {
        LocalDate referencia = mes.withDayOfMonth(1);
        return repository.findByMesReferencia(referencia)
                .map(this::dto)
                .orElse(new MetaCobrancaMensalDTO(referencia, null, null, null, null));
    }

    @Transactional
    public MetaCobrancaMensalDTO salvar(LocalDate mes, MetaCobrancaMensalDTO entrada, String usuario) {
        LocalDate referencia = mes.withDayOfMonth(1);
        validarNaoNegativo(entrada.metaRecebimento(), "A meta de recebimento");
        validarPercentual(entrada.metaRecuperacao(), "A meta de recuperação");
        validarPercentual(entrada.limiteInadimplencia(), "O limite de inadimplência");
        if (entrada.metaAcordos() != null && entrada.metaAcordos() < 0) {
            throw new IllegalArgumentException("A meta de acordos não pode ser negativa.");
        }

        MetaCobrancaMensal meta = repository.findByMesReferencia(referencia).orElseGet(MetaCobrancaMensal::new);
        meta.setMesReferencia(referencia);
        meta.setMetaRecebimento(entrada.metaRecebimento());
        meta.setMetaRecuperacao(entrada.metaRecuperacao());
        meta.setLimiteInadimplencia(entrada.limiteInadimplencia());
        meta.setMetaAcordos(entrada.metaAcordos());
        meta.setAtualizadoEm(LocalDateTime.now());
        meta.setAtualizadoPor(usuario);
        return dto(repository.save(meta));
    }

    private void validarNaoNegativo(BigDecimal valor, String campo) {
        if (valor != null && valor.signum() < 0) throw new IllegalArgumentException(campo + " não pode ser negativa.");
    }

    private void validarPercentual(BigDecimal valor, String campo) {
        validarNaoNegativo(valor, campo);
        if (valor != null && valor.compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new IllegalArgumentException(campo + " deve estar entre 0 e 100%.");
        }
    }

    private MetaCobrancaMensalDTO dto(MetaCobrancaMensal meta) {
        return new MetaCobrancaMensalDTO(meta.getMesReferencia(), meta.getMetaRecebimento(),
                meta.getMetaRecuperacao(), meta.getLimiteInadimplencia(), meta.getMetaAcordos());
    }
}
