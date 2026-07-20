package br.com.w4solution.controle_instalacao.services.cobranca;

import br.com.w4solution.controle_instalacao.domain.cobranca.Cobranca;
import br.com.w4solution.controle_instalacao.domain.cobranca.CobrancaHistorico;
import br.com.w4solution.controle_instalacao.dto.cobranca.CobrancaAcompanhamentoDTO;
import br.com.w4solution.controle_instalacao.dto.cobranca.CobrancaCadastroDTO;
import br.com.w4solution.controle_instalacao.dto.cobranca.CobrancaDTO;
import br.com.w4solution.controle_instalacao.dto.cobranca.CobrancaExclusaoDTO;
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
                .filter(cobranca -> !Boolean.TRUE.equals(cobranca.getExcluida()))
                .sorted(Comparator.comparing(Cobranca::getData, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(Cobranca::getCriadoEm, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toDto)
                .toList();
    }

    public List<CobrancaDTO> listarPagas() {
        return repository.findAll().stream()
                .filter(cobranca -> "PAGO".equals(String.valueOf(cobranca.getStatus()).trim().toUpperCase()))
                .sorted(Comparator.comparing(Cobranca::getFechadoEm, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(Cobranca::getAtualizadoEm, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(Cobranca::getData, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toDto)
                .toList();
    }

    public CobrancaDTO cadastrar(CobrancaCadastroDTO dto, String usuario) {
        ClienteFiltradoDTO clienteRbx = validarClienteRbx(dto.codigoCliente());
        validarCobrancaEmAndamento(dto.codigoCliente(), null);
        Cobranca cobranca = new Cobranca();
        cobranca.setProtocolo(proximoProtocolo());
        aplicarDados(cobranca, dto);
        aplicarClienteRbx(cobranca, clienteRbx);
        cobranca.setCriadoEm(LocalDateTime.now());
        cobranca.setCriadoPor(fallback(usuario, "sistema"));
        cobranca.setAtualizadoPor(fallback(usuario, "sistema"));
        fecharSeFinalizada(cobranca);
        Cobranca salva = repository.save(cobranca);
        salvarHistorico(salva, null, salva.getStatus(), null, salva.getValor(), fallback(dto.observacao(), "Cobranca cadastrada."), usuario);
        return toDto(salva);
    }

    public CobrancaDTO atualizar(Long id, CobrancaCadastroDTO dto, String usuario) {
        Cobranca cobranca = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Cobranca nao encontrada."));
        validarNaoExcluida(cobranca);
        if (!isEditavel(cobranca.getStatus())) {
            throw new IllegalStateException("Cobranca paga, fechada ou cancelada nao pode ser editada.");
        }
        validarCobrancaEmAndamento(dto.codigoCliente(), cobranca.getId());
        String statusAnterior = cobranca.getStatus();
        BigDecimal valorAnterior = cobranca.getValor();
        aplicarDados(cobranca, dto);
        cobranca.setAtualizadoEm(LocalDateTime.now());
        cobranca.setAtualizadoPor(fallback(usuario, "sistema"));
        fecharSeFinalizada(cobranca);
        Cobranca salva = repository.save(cobranca);
        salvarHistorico(salva, statusAnterior, salva.getStatus(), valorAnterior, salva.getValor(), fallback(dto.observacao(), "Cobranca atualizada."), usuario);
        return toDto(salva);
    }

    public CobrancaDTO acompanhar(Long id, CobrancaAcompanhamentoDTO dto, String usuario) {
        Cobranca cobranca = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Cobranca nao encontrada."));
        validarNaoExcluida(cobranca);
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
        cobranca.setAtualizadoPor(fallback(usuario, "sistema"));
        fecharSeFinalizada(cobranca);
        Cobranca salva = repository.save(cobranca);

        salvarHistorico(salva, statusAnterior, statusNovo, valorAnterior, salva.getValor(), dto.observacao(), usuario);

        return toDto(salva);
    }

    public CobrancaDTO excluir(Long id, CobrancaExclusaoDTO dto, String usuario) {
        Cobranca cobranca = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Cobranca nao encontrada."));
        validarNaoExcluida(cobranca);
        if (!"PAGO".equals(String.valueOf(cobranca.getStatus()).trim().toUpperCase())) {
            throw new IllegalStateException("Somente cobrancas pagas podem ser excluidas.");
        }
        if (dto.motivo() == null || dto.motivo().isBlank()) {
            throw new IllegalArgumentException("Informe o motivo da exclusao.");
        }

        String usuarioAtual = fallback(usuario, "sistema");
        LocalDateTime agora = LocalDateTime.now();
        cobranca.setExcluida(true);
        cobranca.setExcluidoEm(agora);
        cobranca.setExcluidoPor(usuarioAtual);
        cobranca.setMotivoExclusao(dto.motivo().trim());
        cobranca.setAtualizadoEm(agora);
        cobranca.setAtualizadoPor(usuarioAtual);
        Cobranca salva = repository.save(cobranca);

        salvarHistorico(
                salva,
                cobranca.getStatus(),
                "Excluida",
                cobranca.getValor(),
                cobranca.getValor(),
                "Exclusao logica: " + dto.motivo().trim(),
                usuarioAtual
        );

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
        cobranca.setGrupoCliente(dto.grupoCliente());
        cobranca.setData(dto.data() == null ? LocalDate.now() : dto.data());
        cobranca.setDataPromessa(isPromessa(dto.status()) ? dto.dataPromessa() : null);
        cobranca.setValor(dto.valor() == null ? BigDecimal.ZERO : dto.valor());
        cobranca.setStatus(fallback(dto.status(), "Aberto"));
        cobranca.setObservacao(dto.observacao());
    }

    private ClienteFiltradoDTO validarClienteRbx(Integer codigoCliente) {
        if (codigoCliente == null) {
            throw new IllegalArgumentException("Informe um codigo de cliente valido para buscar no RBX.");
        }

        List<ClienteFiltradoDTO> clientes = serviceRbx.buscarClienteId(codigoCliente.longValue());
        if (clientes == null || clientes.isEmpty() || clientes.get(0).nome() == null || clientes.get(0).nome().isBlank()) {
            throw new IllegalArgumentException("Codigo de cliente nao encontrado no RBX.");
        }

        return clientes.get(0);
    }

    private void aplicarClienteRbx(Cobranca cobranca, ClienteFiltradoDTO clienteRbx) {
        cobranca.setCliente(clienteRbx.nome());
        cobranca.setGrupoCliente(fallback(clienteRbx.grupoNome(), clienteRbx.grupo()));
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

    private void salvarHistorico(
            Cobranca cobranca,
            String statusAnterior,
            String statusNovo,
            BigDecimal valorAnterior,
            BigDecimal valorNovo,
            String observacao,
            String usuario
    ) {
        CobrancaHistorico historico = new CobrancaHistorico();
        historico.setCobranca(cobranca);
        historico.setStatusAnterior(statusAnterior);
        historico.setStatusNovo(statusNovo);
        historico.setValorAnterior(valorAnterior);
        historico.setValorNovo(valorNovo);
        historico.setObservacao(observacao);
        historico.setUsuario(fallback(usuario, "sistema"));
        historico.setCriadoEm(LocalDateTime.now());
        historicoRepository.save(historico);
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

    private void validarCobrancaEmAndamento(Integer codigoCliente, Long idAtual) {
        if (codigoCliente == null) {
            return;
        }

        repository.findAllByCodigoCliente(codigoCliente).stream()
                .filter(cobranca -> !Boolean.TRUE.equals(cobranca.getExcluida()))
                .filter(cobranca -> idAtual == null || !cobranca.getId().equals(idAtual))
                .filter(cobranca -> !isStatusPagoOuFechado(cobranca.getStatus()))
                .findFirst()
                .ifPresent(cobranca -> {
                    throw new IllegalStateException("Ja existe uma cobranca em andamento para o codigo informado: " + cobranca.getProtocolo());
                });
    }

    private boolean isStatusPagoOuFechado(String status) {
        String normalizado = String.valueOf(status).trim().toUpperCase();
        return normalizado.equals("PAGO") || normalizado.equals("FECHADO");
    }

    private void validarNaoExcluida(Cobranca cobranca) {
        if (Boolean.TRUE.equals(cobranca.getExcluida())) {
            throw new IllegalStateException("Cobranca excluida nao pode ser alterada.");
        }
    }

    private boolean isPromessa(String status) {
        return "PROMESSA DE PAGAMENTO".equals(String.valueOf(status).trim().toUpperCase());
    }

    private String fallback(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }
}
