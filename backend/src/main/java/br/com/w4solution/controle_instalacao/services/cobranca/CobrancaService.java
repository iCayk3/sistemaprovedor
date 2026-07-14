package br.com.w4solution.controle_instalacao.services.cobranca;

import br.com.w4solution.controle_instalacao.domain.cobranca.Cobranca;
import br.com.w4solution.controle_instalacao.domain.cobranca.CobrancaHistorico;
import br.com.w4solution.controle_instalacao.dto.cobranca.CobrancaAcompanhamentoDTO;
import br.com.w4solution.controle_instalacao.dto.cobranca.CobrancaCadastroDTO;
import br.com.w4solution.controle_instalacao.dto.cobranca.CobrancaDTO;
import br.com.w4solution.controle_instalacao.dto.cobranca.CobrancaHistoricoDTO;
import br.com.w4solution.controle_instalacao.dto.rbx.ClienteFiltradoDTO;
import br.com.w4solution.controle_instalacao.repository.cobranca.CobrancaHistoricoRepository;
import br.com.w4solution.controle_instalacao.repository.cobranca.CobrancaRepository;
import br.com.w4solution.controle_instalacao.services.rbx.ServiceRbx;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Service
public class CobrancaService {

    private final CobrancaRepository repository;
    private final CobrancaHistoricoRepository historicoRepository;
    private final ServiceRbx serviceRbx;

    public CobrancaService(CobrancaRepository repository, CobrancaHistoricoRepository historicoRepository, ServiceRbx serviceRbx) {
        this.repository = repository;
        this.historicoRepository = historicoRepository;
        this.serviceRbx = serviceRbx;
    }

    public List<CobrancaDTO> listar() {
        return repository.findAll().stream()
                .sorted(Comparator.comparing(Cobranca::getData, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(Cobranca::getCriadoEm, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toDto)
                .toList();
    }

    public CobrancaDTO cadastrar(CobrancaCadastroDTO dto) {
        Cobranca cobranca = new Cobranca();
        cobranca.setProtocolo(proximoProtocolo());
        aplicarDados(cobranca, dto);
        cobranca.setCriadoEm(LocalDateTime.now());
        fecharSeFinalizada(cobranca);
        return toDto(repository.save(cobranca));
    }

    public CobrancaDTO atualizar(Long id, CobrancaCadastroDTO dto) {
        Cobranca cobranca = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Cobranca nao encontrada."));
        if (!isEditavel(cobranca.getStatus())) {
            throw new IllegalStateException("Cobranca paga, fechada ou cancelada nao pode ser editada.");
        }
        aplicarDados(cobranca, dto);
        cobranca.setAtualizadoEm(LocalDateTime.now());
        fecharSeFinalizada(cobranca);
        return toDto(repository.save(cobranca));
    }

    public CobrancaDTO acompanhar(Long id, CobrancaAcompanhamentoDTO dto, String usuario) {
        Cobranca cobranca = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Cobranca nao encontrada."));
        if (!isEditavel(cobranca.getStatus())) {
            throw new IllegalStateException("Cobranca paga, fechada ou cancelada nao pode ser alterada no acompanhamento.");
        }
        if (dto.observacao() == null || dto.observacao().isBlank()) {
            throw new IllegalArgumentException("Informe o que foi realizado no acompanhamento.");
        }

        String statusAnterior = cobranca.getStatus();
        BigDecimal valorAnterior = cobranca.getValor();
        String statusNovo = fallback(dto.status(), cobranca.getStatus());
        if (isPromessa(statusNovo) && dto.dataPromessa() == null) {
            throw new IllegalArgumentException("Informe a data da promessa de pagamento.");
        }
        BigDecimal valorNovo = statusNovo.equals("Em negociacao")
                ? (dto.valor() == null ? cobranca.getValor() : dto.valor())
                : cobranca.getValor();

        cobranca.setStatus(statusNovo);
        cobranca.setDataPromessa(isPromessa(statusNovo) ? dto.dataPromessa() : null);
        cobranca.setValor(valorNovo == null ? BigDecimal.ZERO : valorNovo);
        cobranca.setAtualizadoEm(LocalDateTime.now());
        fecharSeFinalizada(cobranca);
        Cobranca salva = repository.save(cobranca);

        CobrancaHistorico historico = new CobrancaHistorico();
        historico.setCobranca(salva);
        historico.setStatusAnterior(statusAnterior);
        historico.setStatusNovo(statusNovo);
        historico.setValorAnterior(valorAnterior);
        historico.setValorNovo(salva.getValor());
        historico.setObservacao(dto.observacao());
        historico.setUsuario(fallback(usuario, "sistema"));
        historico.setCriadoEm(LocalDateTime.now());
        historicoRepository.save(historico);

        return toDto(salva);
    }

    public ClienteFiltradoDTO buscarClienteRbx(Long codigo) {
        List<ClienteFiltradoDTO> clientes = serviceRbx.buscarClienteId(codigo);
        if (clientes == null || clientes.isEmpty()) {
            throw new IllegalArgumentException("Cliente nao encontrado no RBX.");
        }
        return clientes.get(0);
    }

    private void aplicarDados(Cobranca cobranca, CobrancaCadastroDTO dto) {
        cobranca.setAcao(fallback(dto.acao(), "Contato"));
        cobranca.setCodigoCliente(dto.codigoCliente());
        cobranca.setCliente(dto.cliente());
        cobranca.setData(dto.data() == null ? LocalDate.now() : dto.data());
        cobranca.setDataPromessa(isPromessa(dto.status()) ? dto.dataPromessa() : null);
        cobranca.setValor(dto.valor() == null ? BigDecimal.ZERO : dto.valor());
        cobranca.setStatus(fallback(dto.status(), "Aberto"));
        cobranca.setObservacao(dto.observacao());
    }

    private CobrancaDTO toDto(Cobranca cobranca) {
        List<CobrancaHistoricoDTO> historico = historicoRepository.findAllByCobrancaIdOrderByCriadoEmDesc(cobranca.getId()).stream()
                .map(CobrancaHistoricoDTO::new)
                .toList();
        return new CobrancaDTO(cobranca, historico);
    }

    private void fecharSeFinalizada(Cobranca cobranca) {
        if (isEditavel(cobranca.getStatus())) {
            cobranca.setFechadoEm(null);
            return;
        }
        if (cobranca.getFechadoEm() == null) {
            cobranca.setFechadoEm(LocalDateTime.now());
        }
    }

    private String proximoProtocolo() {
        int year = LocalDateTime.now().getYear();
        String prefix = "COB-" + year + "-";
        int next = repository.findTopByProtocoloStartingWithOrderByProtocoloDesc(prefix)
                .map(Cobranca::getProtocolo)
                .map(protocolo -> protocolo.substring(prefix.length()))
                .map(Integer::parseInt)
                .orElse(0) + 1;
        return prefix + String.format("%04d", next);
    }

    private boolean isEditavel(String status) {
        if (status == null) {
            return true;
        }
        String normalizado = status.trim().toUpperCase();
        return !normalizado.equals("PAGO") && !normalizado.equals("FECHADO") && !normalizado.equals("CANCELADO");
    }

    private boolean isPromessa(String status) {
        return "PROMESSA DE PAGAMENTO".equals(String.valueOf(status).trim().toUpperCase());
    }

    private String fallback(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }
}
