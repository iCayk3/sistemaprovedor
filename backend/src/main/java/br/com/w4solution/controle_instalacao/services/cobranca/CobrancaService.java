package br.com.w4solution.controle_instalacao.services.cobranca;

import br.com.w4solution.controle_instalacao.domain.cobranca.Cobranca;
import br.com.w4solution.controle_instalacao.domain.cobranca.CobrancaHistorico;
import br.com.w4solution.controle_instalacao.domain.cobranca.CobrancaConfiguracao;
import br.com.w4solution.controle_instalacao.dto.cobranca.CobrancaAcompanhamentoDTO;
import br.com.w4solution.controle_instalacao.dto.cobranca.CobrancaCadastroDTO;
import br.com.w4solution.controle_instalacao.dto.cobranca.CobrancaClienteRbxDTO;
import br.com.w4solution.controle_instalacao.dto.cobranca.CobrancaDTO;
import br.com.w4solution.controle_instalacao.dto.cobranca.CobrancaExclusaoDTO;
import br.com.w4solution.controle_instalacao.dto.cobranca.CobrancaHistoricoDTO;
import br.com.w4solution.controle_instalacao.dto.cobranca.CobrancaLembreteDTO;
import br.com.w4solution.controle_instalacao.dto.cobranca.CobrancaConfiguracaoDTO;
import br.com.w4solution.controle_instalacao.dto.rbx.ClienteFiltradoDTO;
import br.com.w4solution.controle_instalacao.repository.cobranca.CobrancaHistoricoRepository;
import br.com.w4solution.controle_instalacao.repository.cobranca.CobrancaRepository;
import br.com.w4solution.controle_instalacao.repository.cobranca.CobrancaConfiguracaoRepository;
import br.com.w4solution.controle_instalacao.repository.eventos.EventoRepository;
import br.com.w4solution.controle_instalacao.services.rbx.ServiceRbx;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Service
public class CobrancaService {

    private static final List<String> STATUS_PERMITIDOS = List.of(
            "Cobrança emitida",
            "Promessa de pagamento",
            "Sem retorno",
            "Pago",
            "Cancelado"
    );

    private final CobrancaRepository repository;
    private final CobrancaHistoricoRepository historicoRepository;
    private final ServiceRbx serviceRbx;
    private final EventoRepository eventoRepository;
    private final CobrancaConfiguracaoRepository configuracaoRepository;

    public CobrancaService(CobrancaRepository repository, CobrancaHistoricoRepository historicoRepository, ServiceRbx serviceRbx, EventoRepository eventoRepository, CobrancaConfiguracaoRepository configuracaoRepository) {
        this.repository = repository;
        this.historicoRepository = historicoRepository;
        this.serviceRbx = serviceRbx;
        this.eventoRepository = eventoRepository;
        this.configuracaoRepository = configuracaoRepository;
    }

    public CobrancaConfiguracaoDTO buscarConfiguracao() {
        return new CobrancaConfiguracaoDTO(configuracao());
    }

    public CobrancaConfiguracaoDTO atualizarConfiguracao(CobrancaConfiguracaoDTO dto) {
        CobrancaConfiguracao configuracao = configuracao();
        configuracao.setPermitirFechamentoPorOutroUsuario(Boolean.TRUE.equals(dto.permitirFechamentoPorOutroUsuario()));
        return new CobrancaConfiguracaoDTO(configuracaoRepository.save(configuracao));
    }

    public List<CobrancaDTO> listar(String usuario, boolean podeVerGeral) {
        return repository.findAll().stream()
                .filter(cobranca -> podeAcessar(cobranca, usuario, podeVerGeral))
                .filter(cobranca -> !Boolean.TRUE.equals(cobranca.getExcluida()))
                .sorted(Comparator.comparing(Cobranca::getData, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(Cobranca::getCriadoEm, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toDto)
                .toList();
    }

    public List<CobrancaDTO> listarPagas(String usuario, boolean podeVerGeral) {
        return repository.findAll().stream()
                .filter(cobranca -> podeAcessar(cobranca, usuario, podeVerGeral))
                .filter(cobranca -> "PAGO".equals(String.valueOf(cobranca.getStatus()).trim().toUpperCase()))
                .sorted(Comparator.comparing(Cobranca::getFechadoEm, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(Cobranca::getAtualizadoEm, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(Cobranca::getData, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toDto)
                .toList();
    }

    public List<CobrancaDTO> listarAuditoria(String usuario, boolean podeVerGeral) {
        return repository.findAll().stream()
                .filter(cobranca -> podeAcessar(cobranca, usuario, podeVerGeral))
                .sorted(Comparator.comparing(Cobranca::getExcluidoEm, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(Cobranca::getFechadoEm, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(Cobranca::getAtualizadoEm, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(Cobranca::getData, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toDto)
                .toList();
    }

    public CobrancaLembreteDTO lembretesPendentes(String usuario, boolean podeVerGeral) {
        LocalDateTime limite = LocalDateTime.now().minusDays(7);
        long quantidade = repository.findAll().stream()
                .filter(cobranca -> podeAcessar(cobranca, usuario, podeVerGeral))
                .filter(cobranca -> !Boolean.TRUE.equals(cobranca.getExcluida()))
                .filter(cobranca -> !"Fechada".equalsIgnoreCase(cobranca.getSituacaoAtendimento()))
                .filter(cobranca -> isEditavel(cobranca.getStatus()))
                .filter(cobranca -> ultimaMovimentacao(cobranca) != null && !ultimaMovimentacao(cobranca).isAfter(limite))
                .count();
        return new CobrancaLembreteDTO(quantidade);
    }

    private LocalDateTime ultimaMovimentacao(Cobranca cobranca) {
        return cobranca.getAtualizadoEm() != null ? cobranca.getAtualizadoEm() : cobranca.getCriadoEm();
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

    public CobrancaDTO atualizar(Long id, CobrancaCadastroDTO dto, String usuario, boolean admin, boolean podeVerGeral) {
        Cobranca cobranca = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Cobranca nao encontrada."));
        validarNaoExcluida(cobranca);
        validarAcesso(cobranca, usuario, podeVerGeral);
        if ("Fechada".equalsIgnoreCase(cobranca.getSituacaoAtendimento()) || !isEditavel(cobranca.getStatus())) {
            throw new IllegalStateException("Cobranca paga, fechada ou cancelada nao pode ser editada.");
        }
        validarCobrancaEmAndamento(dto.codigoCliente(), cobranca.getId());
        String statusAnterior = cobranca.getStatus();
        BigDecimal valorAnterior = cobranca.getValor();
        validarPermissaoFechamento(cobranca, dto.status(), usuario, admin);
        aplicarDados(cobranca, dto);
        if (!permiteAlterarValorOriginal(cobranca.getStatus())) {
            cobranca.setValor(valorAnterior);
        }
        cobranca.setAtualizadoEm(LocalDateTime.now());
        cobranca.setAtualizadoPor(fallback(usuario, "sistema"));
        fecharSeFinalizada(cobranca);
        Cobranca salva = repository.save(cobranca);
        salvarHistorico(salva, statusAnterior, salva.getStatus(), valorAnterior, salva.getValor(), fallback(dto.observacao(), "Cobranca atualizada."), usuario);
        return toDto(salva);
    }

    public CobrancaDTO acompanhar(Long id, CobrancaAcompanhamentoDTO dto, String usuario, boolean admin, boolean podeVerGeral) {
        Cobranca cobranca = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Cobranca nao encontrada."));
        validarNaoExcluida(cobranca);
        validarAcesso(cobranca, usuario, podeVerGeral);
        if ("Fechada".equalsIgnoreCase(cobranca.getSituacaoAtendimento()) || !isEditavel(cobranca.getStatus())) {
            throw new IllegalStateException("Cobranca paga, fechada ou cancelada nao pode ser alterada no acompanhamento.");
        }
        if (dto.observacao() == null || dto.observacao().isBlank()) {
            throw new IllegalArgumentException("Informe o que foi realizado no acompanhamento.");
        }

        String statusAnterior = cobranca.getStatus();
        BigDecimal valorAnterior = cobranca.getValor();
        String statusNovo = validarStatus(fallback(dto.status(), cobranca.getStatus()));
        validarPermissaoFechamento(cobranca, statusNovo, usuario, admin);
        if (isPromessa(statusNovo) && dto.dataPromessa() == null) {
            throw new IllegalArgumentException("Informe a data da promessa de pagamento.");
        }
        BigDecimal valorNovo = permiteAlterarValorOriginal(statusNovo) && dto.valor() != null
                ? dto.valor()
                : cobranca.getValor();

        cobranca.setStatus(statusNovo);
        aplicarValorPago(cobranca, dto.valorPago());
        aplicarSituacaoAtendimento(cobranca);
        cobranca.setDataPromessa(isPromessa(statusNovo) ? dto.dataPromessa() : null);
        cobranca.setValor(valorNovo == null ? BigDecimal.ZERO : valorNovo);
        cobranca.setAtualizadoEm(LocalDateTime.now());
        cobranca.setAtualizadoPor(fallback(usuario, "sistema"));
        fecharSeFinalizada(cobranca);
        Cobranca salva = repository.save(cobranca);

        salvarHistorico(salva, statusAnterior, statusNovo, valorAnterior, salva.getValor(), dto.observacao(), usuario);

        return toDto(salva);
    }

    public CobrancaDTO excluir(Long id, CobrancaExclusaoDTO dto, String usuario, boolean podeVerGeral) {
        Cobranca cobranca = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Cobranca nao encontrada."));
        validarNaoExcluida(cobranca);
        validarAcesso(cobranca, usuario, podeVerGeral);
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

    public CobrancaClienteRbxDTO buscarClienteRbx(Long codigo) {
        List<ClienteFiltradoDTO> clientes = serviceRbx.buscarClienteId(codigo);
        if (clientes == null || clientes.isEmpty()) {
            throw new IllegalArgumentException("Cliente nao encontrado no RBX.");
        }
        return new CobrancaClienteRbxDTO(
                clientes.get(0),
                serviceRbx.buscarBoletoAbertoMaisRecente(codigo).orElse(null)
        );
    }

    private void aplicarDados(Cobranca cobranca, CobrancaCadastroDTO dto) {
        cobranca.setAcao(fallback(dto.acao(), "Contato"));
        cobranca.setCodigoCliente(dto.codigoCliente());
        cobranca.setCliente(dto.cliente());
        cobranca.setGrupoCliente(dto.grupoCliente());
        cobranca.setData(dto.data() == null ? LocalDate.now() : dto.data());
        if (dto.dataVencimento() == null) {
            throw new IllegalArgumentException("Informe a data de vencimento.");
        }
        cobranca.setDataVencimento(dto.dataVencimento());
        cobranca.setDataPromessa(isPromessa(dto.status()) ? dto.dataPromessa() : null);
        cobranca.setValor(dto.valor() == null ? BigDecimal.ZERO : dto.valor());
        cobranca.setStatus(validarStatus(fallback(dto.status(), "Cobrança emitida")));
        aplicarValorPago(cobranca, dto.valorPago());
        aplicarSituacaoAtendimento(cobranca);
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
        if (!"Fechada".equalsIgnoreCase(cobranca.getSituacaoAtendimento())) {
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

    private void aplicarSituacaoAtendimento(Cobranca cobranca) {
        String normalizado = String.valueOf(cobranca.getStatus()).trim().toUpperCase();
        boolean encerra = normalizado.equals("PAGO") || normalizado.equals("CANCELADO") || normalizado.equals("FECHADO");
        if (!encerra) {
            encerra = eventoRepository.encontrarPorSegmento("COBRANCA_STATUS").stream()
                    .filter(evento -> evento.getEvento().equalsIgnoreCase(cobranca.getStatus()))
                    .anyMatch(evento -> Boolean.TRUE.equals(evento.getEncerraAtendimento()));
        }
        cobranca.setSituacaoAtendimento(encerra ? "Fechada" : "Aberta");
    }

    private void validarPermissaoFechamento(Cobranca cobranca, String statusNovo, String usuario, boolean admin) {
        if (!statusEncerraAtendimento(statusNovo) || admin || Boolean.TRUE.equals(configuracao().getPermitirFechamentoPorOutroUsuario())) {
            return;
        }
        if (!String.valueOf(cobranca.getCriadoPor()).equalsIgnoreCase(String.valueOf(usuario))) {
            throw new IllegalStateException("Somente o usuario que abriu a cobranca pode fecha-la ou marca-la como paga.");
        }
    }

    private boolean statusEncerraAtendimento(String status) {
        String normalizado = String.valueOf(status).trim().toUpperCase();
        if (normalizado.equals("PAGO") || normalizado.equals("CANCELADO") || normalizado.equals("FECHADO")) {
            return true;
        }
        return eventoRepository.encontrarPorSegmento("COBRANCA_STATUS").stream()
                .filter(evento -> evento.getEvento().equalsIgnoreCase(status))
                .anyMatch(evento -> Boolean.TRUE.equals(evento.getEncerraAtendimento()));
    }

    private CobrancaConfiguracao configuracao() {
        return configuracaoRepository.findById(1L).orElseGet(() -> configuracaoRepository.save(new CobrancaConfiguracao()));
    }

    private void aplicarValorPago(Cobranca cobranca, BigDecimal valorPago) {
        if (!"PAGO".equals(String.valueOf(cobranca.getStatus()).trim().toUpperCase())) {
            cobranca.setValorPago(null);
            return;
        }
        if (valorPago == null || valorPago.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Informe um valor pago valido.");
        }
        cobranca.setValorPago(valorPago);
    }

    private void validarCobrancaEmAndamento(Integer codigoCliente, Long idAtual) {
        if (codigoCliente == null) {
            return;
        }

        repository.findAllByCodigoCliente(codigoCliente).stream()
                .filter(cobranca -> !Boolean.TRUE.equals(cobranca.getExcluida()))
                .filter(cobranca -> idAtual == null || !cobranca.getId().equals(idAtual))
                .filter(cobranca -> !"Fechada".equalsIgnoreCase(cobranca.getSituacaoAtendimento()))
                .filter(cobranca -> !isStatusPagoOuFechado(cobranca.getStatus()))
                .findFirst()
                .ifPresent(cobranca -> {
                    throw new IllegalStateException("Ja existe uma cobranca em andamento para o codigo informado: " + cobranca.getProtocolo());
                });
    }

    private boolean isStatusPagoOuFechado(String status) {
        String normalizado = String.valueOf(status).trim().toUpperCase();
        return normalizado.equals("PAGO") || normalizado.equals("FECHADO") || normalizado.equals("CANCELADO");
    }

    private void validarNaoExcluida(Cobranca cobranca) {
        if (Boolean.TRUE.equals(cobranca.getExcluida())) {
            throw new IllegalStateException("Cobranca excluida nao pode ser alterada.");
        }
    }

    private boolean podeAcessar(Cobranca cobranca, String usuario, boolean podeVerGeral) {
        return podeVerGeral || String.valueOf(cobranca.getCriadoPor()).equalsIgnoreCase(String.valueOf(usuario));
    }

    private void validarAcesso(Cobranca cobranca, String usuario, boolean podeVerGeral) {
        if (!podeAcessar(cobranca, usuario, podeVerGeral)) {
            throw new IllegalStateException("Voce nao possui acesso a esta cobranca.");
        }
    }

    private boolean isPromessa(String status) {
        return "PROMESSA DE PAGAMENTO".equals(String.valueOf(status).trim().toUpperCase());
    }

    private boolean permiteAlterarValorOriginal(String status) {
        String normalizado = String.valueOf(status).trim().toUpperCase();
        return normalizado.equals("NEGOCIACAO")
                || normalizado.equals("NEGOCIAÇÃO")
                || normalizado.equals("EM NEGOCIACAO")
                || normalizado.equals("EM NEGOCIAÇÃO")
                || normalizado.equals("PROMESSA DE PAGAMENTO");
    }

    private String validarStatus(String status) {
        var statusPadrao = STATUS_PERMITIDOS.stream()
                .filter(statusPermitido -> statusPermitido.equalsIgnoreCase(status.trim()))
                .findFirst();
        if (statusPadrao.isPresent()) {
            return statusPadrao.get();
        }
        return eventoRepository.encontrarPorSegmento("COBRANCA_STATUS").stream()
                .map(evento -> evento.getEvento().trim())
                .filter(statusConfigurado -> statusConfigurado.equalsIgnoreCase(status.trim()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Status de cobranca invalido ou nao configurado."));
    }

    private String fallback(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }
}
