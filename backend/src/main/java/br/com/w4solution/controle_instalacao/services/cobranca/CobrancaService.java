package br.com.w4solution.controle_instalacao.services.cobranca;

import br.com.w4solution.controle_instalacao.domain.cobranca.Cobranca;
import br.com.w4solution.controle_instalacao.domain.cobranca.CobrancaHistorico;
import br.com.w4solution.controle_instalacao.domain.cobranca.CobrancaConfiguracao;
import br.com.w4solution.controle_instalacao.domain.cobranca.FaturamentoMensalTitulo;
import br.com.w4solution.controle_instalacao.dto.cobranca.CobrancaAcompanhamentoDTO;
import br.com.w4solution.controle_instalacao.dto.cobranca.CobrancaCadastroDTO;
import br.com.w4solution.controle_instalacao.dto.cobranca.CobrancaClienteRbxDTO;
import br.com.w4solution.controle_instalacao.dto.cobranca.CobrancaContratoRbxDTO;
import br.com.w4solution.controle_instalacao.dto.cobranca.CobrancaDTO;
import br.com.w4solution.controle_instalacao.dto.cobranca.CobrancaExclusaoDTO;
import br.com.w4solution.controle_instalacao.dto.cobranca.CobrancaEncerramentoNotificacaoDTO;
import br.com.w4solution.controle_instalacao.dto.cobranca.CobrancaHistoricoDTO;
import br.com.w4solution.controle_instalacao.dto.cobranca.CobrancaLembreteDTO;
import br.com.w4solution.controle_instalacao.dto.cobranca.CobrancaConfiguracaoDTO;
import br.com.w4solution.controle_instalacao.dto.cobranca.FilaInadimplenteDTO;
import br.com.w4solution.controle_instalacao.dto.rbx.ClienteFiltradoDTO;
import br.com.w4solution.controle_instalacao.dto.rbx.AtendimentoAberturaRbxDTO;
import br.com.w4solution.controle_instalacao.dto.rbx.AtendimentoEncerramentoRbxDTO;
import br.com.w4solution.controle_instalacao.domain.usuarios.Usuario;
import br.com.w4solution.controle_instalacao.repository.cobranca.CobrancaHistoricoRepository;
import br.com.w4solution.controle_instalacao.repository.cobranca.CobrancaRepository;
import br.com.w4solution.controle_instalacao.repository.cobranca.CobrancaConfiguracaoRepository;
import br.com.w4solution.controle_instalacao.repository.cobranca.FaturamentoMensalTituloRepository;
import br.com.w4solution.controle_instalacao.repository.eventos.EventoRepository;
import br.com.w4solution.controle_instalacao.services.rbx.ServiceRbx;
import br.com.w4solution.controle_instalacao.services.rbx.RbxAtendimentoClient;
import br.com.w4solution.controle_instalacao.services.usuarios.UsuarioService;
import org.springframework.stereotype.Service;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import jakarta.transaction.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class CobrancaService {

    private static final ZoneId FUSO_BRASILIA = ZoneId.of("America/Sao_Paulo");
    private static final DateTimeFormatter DATA_HORA_PT_BR = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");
    private static final long DIAS_ATRASO_FILA_AUTOMATICA = 7;

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
    private final FaturamentoMensalTituloRepository faturamentoRepository;
    private final RbxAtendimentoClient atendimentoClient;
    private final UsuarioService usuarioService;

    public CobrancaService(CobrancaRepository repository, CobrancaHistoricoRepository historicoRepository, ServiceRbx serviceRbx,
                           EventoRepository eventoRepository, CobrancaConfiguracaoRepository configuracaoRepository,
                           FaturamentoMensalTituloRepository faturamentoRepository, RbxAtendimentoClient atendimentoClient,
                           UsuarioService usuarioService) {
        this.repository = repository;
        this.historicoRepository = historicoRepository;
        this.serviceRbx = serviceRbx;
        this.eventoRepository = eventoRepository;
        this.configuracaoRepository = configuracaoRepository;
        this.faturamentoRepository = faturamentoRepository;
        this.atendimentoClient = atendimentoClient;
        this.usuarioService = usuarioService;
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

    public List<CobrancaDTO> listarAutomaticasDisponiveis() {
        LocalDate hoje = LocalDate.now();
        return repository.findAll().stream()
                .filter(cobranca -> Boolean.TRUE.equals(cobranca.getGeradaAutomaticamente()))
                .filter(cobranca -> atrasoMinimoAtingido(cobranca.getDataVencimento(), hoje))
                .filter(cobranca -> cobranca.getResponsavel() == null || cobranca.getResponsavel().isBlank())
                .filter(cobranca -> !Boolean.TRUE.equals(cobranca.getExcluida()))
                .filter(cobranca -> !"Fechada".equalsIgnoreCase(cobranca.getSituacaoAtendimento()))
                .sorted(Comparator.comparing(Cobranca::getDataVencimento, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(this::toDto)
                .toList();
    }

    public List<CobrancaDTO> listarAcompanhamento(String usuario) {
        return repository.findAll().stream()
                .filter(cobranca -> !Boolean.TRUE.equals(cobranca.getExcluida()))
                .filter(cobranca -> {
                    if (!Boolean.TRUE.equals(cobranca.getGeradaAutomaticamente())) {
                        return String.valueOf(cobranca.getResponsavel()).equalsIgnoreCase(String.valueOf(usuario))
                                || String.valueOf(cobranca.getCriadoPor()).equalsIgnoreCase(String.valueOf(usuario));
                    }
                    return cobranca.getResponsavel() != null
                            && cobranca.getResponsavel().equalsIgnoreCase(String.valueOf(usuario));
                })
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

    public List<CobrancaEncerramentoNotificacaoDTO> notificacoesEncerramento(String usuario) {
        return repository.findAll().stream()
                .filter(cobranca -> Boolean.TRUE.equals(cobranca.getNotificacaoEncerramentoPendente()))
                .filter(cobranca -> String.valueOf(cobranca.getResponsavel()).equalsIgnoreCase(String.valueOf(usuario)))
                .sorted(Comparator.comparing(Cobranca::getNotificacaoEncerramentoEm,
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .map(CobrancaEncerramentoNotificacaoDTO::new)
                .toList();
    }

    public void confirmarNotificacaoEncerramento(Long id, String usuario) {
        Cobranca cobranca = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Cobranca nao encontrada."));
        if (!String.valueOf(cobranca.getResponsavel()).equalsIgnoreCase(String.valueOf(usuario))) {
            throw new IllegalStateException("Este aviso pertence ao responsável pela cobrança.");
        }
        cobranca.setNotificacaoEncerramentoPendente(false);
        repository.save(cobranca);
    }

    private LocalDateTime ultimaMovimentacao(Cobranca cobranca) {
        return cobranca.getAtualizadoEm() != null ? cobranca.getAtualizadoEm() : cobranca.getCriadoEm();
    }

    @Transactional
    public CobrancaDTO cadastrar(CobrancaCadastroDTO dto, String usuario) {
        repository.bloquearGeracaoCobrancas();
        CobrancaClienteRbxDTO dadosRbx = buscarClienteRbx(dto.codigoCliente() == null ? null : dto.codigoCliente().longValue());
        ClienteFiltradoDTO clienteRbx = dadosRbx.cliente();
        validarContratoEBoleto(dto, dadosRbx);
        validarCobrancaEmAndamento(dto.codigoCliente(), dto.numeroContrato(), null);
        Cobranca cobranca = new Cobranca();
        cobranca.setProtocolo(proximoProtocolo());
        aplicarDados(cobranca, dto);
        aplicarClienteRbx(cobranca, clienteRbx);
        cobranca.setCriadoEm(LocalDateTime.now());
        cobranca.setCriadoPor(fallback(usuario, "sistema"));
        cobranca.setAtualizadoPor(fallback(usuario, "sistema"));
        fecharSeFinalizada(cobranca);
        Cobranca salva = repository.save(cobranca);
        vincularTituloImportado(salva);
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
        validarCobrancaEmAndamento(dto.codigoCliente(), dto.numeroContrato(), cobranca.getId());
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
        prepararFechamentoRbx(salva);
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
        prepararFechamentoRbx(salva);

        return toDto(salva);
    }

    public CobrancaDTO capturar(Long id, Usuario usuarioLogado) {
        String usuario = usuarioLogado == null ? "sistema" : usuarioLogado.getUsuario();
        Cobranca cobranca = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Cobranca nao encontrada."));
        validarNaoExcluida(cobranca);
        if ("Fechada".equalsIgnoreCase(cobranca.getSituacaoAtendimento())) {
            throw new IllegalStateException("Este atendimento já está fechado.");
        }
        String atual = cobranca.getResponsavel();
        if (atual != null && !atual.isBlank() && !atual.equalsIgnoreCase(usuario)) {
            throw new IllegalStateException("Este atendimento já foi capturado por " + atual + ".");
        }
        if (atual == null || atual.isBlank()) {
            cobranca.setResponsavel(fallback(usuario, "sistema"));
            cobranca.setCapturadoEm(LocalDateTime.now());
            identificarContratoDoTitulo(cobranca);
            cobranca.setStatusIntegracaoRbx("PREPARANDO_ABERTURA_RBX");
            cobranca.setAtualizadoEm(LocalDateTime.now());
            cobranca.setAtualizadoPor(fallback(usuario, "sistema"));
            repository.save(cobranca);
            salvarHistorico(cobranca, cobranca.getStatus(), cobranca.getStatus(), cobranca.getValor(), cobranca.getValor(),
                    "Atendimento capturado. Preparando abertura no RBX para o cliente e contrato da cobrança.", usuario);
        }
        if ((cobranca.getAtendimentoRbxNumero() == null || cobranca.getAtendimentoRbxNumero().isBlank())
                && Boolean.TRUE.equals(cobranca.getGeradaAutomaticamente())) {
            abrirAtendimentoRbx(cobranca, usuarioLogado, usuario);
        }
        return toDto(cobranca);
    }

    private void abrirAtendimentoRbx(Cobranca cobranca, Usuario usuarioLogado, String usuario) {
        try {
            Long cliente = cobranca.getCodigoCliente() == null ? null : cobranca.getCodigoCliente().longValue();
            Long contrato = numeroLong(cobranca.getNumeroContrato());
            if (cliente == null) throw new IllegalStateException("A cobrança não possui código de cliente para abertura no RBX.");
            if (contrato == null) throw new IllegalStateException("Não foi possível identificar o contrato do boleto para abertura no RBX.");
            String valorBoleto = cobranca.getValor() == null
                    ? "valor não informado"
                    : NumberFormat.getCurrencyInstance(new Locale("pt", "BR")).format(cobranca.getValor());
            String vencimentoBoleto = cobranca.getDataVencimento() == null
                    ? "vencimento não informado"
                    : cobranca.getDataVencimento().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
            String assunto = "Chamado do sistema de controle - cobrança " + cobranca.getProtocolo()
                    + " - " + valorBoleto + " - vencimento " + vencimentoBoleto;
            String ocorrencia = "Cobrança aberta pelo sistema de controle. Protocolo local: " + cobranca.getProtocolo()
                    + "; cliente: " + cobranca.getCodigoCliente()
                    + "; contrato: " + cobranca.getNumeroContrato()
                    + "; boleto: " + fallback(cobranca.getDocumentoTitulo(), "não informado")
                    + "; vencimento: " + vencimentoBoleto
                    + "; valor: " + valorBoleto + ".";
            var resultado = atendimentoClient.abrir(new AtendimentoAberturaRbxDTO(
                    LocalDate.now(), LocalTime.now(), "A", "T", "C", cliente, contrato,
                    null, 1, "A", "A", 187L, null, assunto, ocorrencia
            ), usuarioService.credenciaisRbx(usuarioLogado));
            cobranca.setAtendimentoRbxNumero(resultado.numeroAtendimento());
            cobranca.setAtendimentoRbxProtocolo(resultado.protocolo());
            cobranca.setStatusIntegracaoRbx("ABERTO_RBX");
            cobranca.setAbertoNoRbxEm(LocalDateTime.now());
            cobranca.setErroIntegracaoRbx(null);
            repository.save(cobranca);
            salvarHistorico(cobranca, cobranca.getStatus(), cobranca.getStatus(), cobranca.getValor(), cobranca.getValor(),
                    "Atendimento aberto no RBX. Número: " + resultado.numeroAtendimento() + ".", usuario);
        } catch (Exception e) {
            cobranca.setStatusIntegracaoRbx("ERRO_ABERTURA_RBX");
            cobranca.setErroIntegracaoRbx(e.getMessage());
            repository.save(cobranca);
            salvarHistorico(cobranca, cobranca.getStatus(), cobranca.getStatus(), cobranca.getValor(), cobranca.getValor(),
                    "Falha ao abrir atendimento no RBX: " + e.getMessage(), usuario);
        }
    }

    private Long numeroLong(String valor) {
        try {
            String digitos = String.valueOf(valor).replaceAll("\\D", "");
            return digitos.isBlank() ? null : Long.valueOf(digitos);
        } catch (Exception e) {
            return null;
        }
    }

    @Transactional
    public void reconciliarTitulosImportados(List<FaturamentoMensalTitulo> titulos) {
        repository.bloquearGeracaoCobrancas();
        LocalDate hoje = LocalDate.now();
        for (FaturamentoMensalTitulo titulo : titulos) {
            if (titulo.isBaixado()) finalizarAutomaticamentePorPagamento(titulo);
            else if (atrasoMinimoAtingido(titulo.getVencimento(), hoje)) gerarAtendimentoAutomatico(titulo);
        }
    }

    private boolean atrasoMinimoAtingido(LocalDate vencimento, LocalDate hoje) {
        return vencimento != null && !vencimento.isAfter(hoje.minusDays(DIAS_ATRASO_FILA_AUTOMATICA));
    }

    private void gerarAtendimentoAutomatico(FaturamentoMensalTitulo titulo) {
        Integer codigo = inteiro(titulo.getCodigoCliente());
        if (codigo == null) return;
        if (titulo.getCobrancaId() != null) return;
        var existente = repository.findFirstByDocumentoTituloAndCodigoClienteAndExcluidaFalseOrderByIdDesc(
                titulo.getDocumento(), codigo);
        if (existente.isPresent()) {
            titulo.setCobrancaId(existente.get().getId());
            faturamentoRepository.save(titulo);
            return;
        }
        Cobranca cobranca = new Cobranca();
        cobranca.setProtocolo(proximoProtocolo());
        cobranca.setAcao("Cobrança automática");
        cobranca.setCodigoCliente(codigo);
        cobranca.setDocumentoTitulo(titulo.getDocumento());
        cobranca.setCliente(titulo.getNomeCliente());
        cobranca.setGrupoCliente(titulo.getGrupo());
        cobranca.setData(LocalDate.now());
        cobranca.setDataVencimento(titulo.getVencimento());
        cobranca.setValor(titulo.getValorFaturado() == null ? BigDecimal.ZERO : titulo.getValorFaturado());
        cobranca.setStatus("Cobrança emitida");
        cobranca.setSituacaoAtendimento("Aberta");
        cobranca.setObservacao("Atendimento aberto automaticamente pelo sistema a partir de boleto importado vencido e sem baixa.");
        cobranca.setGeradaAutomaticamente(true);
        cobranca.setCriadoEm(LocalDateTime.now());
        cobranca.setCriadoPor("sistema");
        cobranca.setAtualizadoPor("sistema");
        cobranca.setStatusIntegracaoRbx("AGUARDANDO_CAPTURA");
        Cobranca salva = repository.save(cobranca);
        titulo.setCobrancaId(salva.getId());
        faturamentoRepository.save(titulo);
        salvarHistorico(salva, null, salva.getStatus(), null, salva.getValor(), cobranca.getObservacao(), "sistema");
    }

    @Transactional
    public int removerAutomaticasNaoCapturadas(List<FaturamentoMensalTitulo> titulos) {
        int removidas = 0;
        for (FaturamentoMensalTitulo titulo : titulos) {
            if (titulo.getCobrancaId() == null) continue;
            Cobranca cobranca = repository.findById(titulo.getCobrancaId()).orElse(null);
            if (cobranca == null
                    || !Boolean.TRUE.equals(cobranca.getGeradaAutomaticamente())
                    || (cobranca.getResponsavel() != null && !cobranca.getResponsavel().isBlank())
                    || (cobranca.getAtendimentoRbxNumero() != null && !cobranca.getAtendimentoRbxNumero().isBlank())) {
                continue;
            }
            historicoRepository.deleteAllByCobrancaId(cobranca.getId());
            repository.delete(cobranca);
            removidas++;
        }
        return removidas;
    }

    @Transactional
    public int corrigirDuplicidadesAutomaticas() {
        repository.bloquearGeracaoCobrancas();
        Map<String, List<Cobranca>> grupos = repository.findAll().stream()
                .filter(item -> Boolean.TRUE.equals(item.getGeradaAutomaticamente()))
                .filter(item -> !Boolean.TRUE.equals(item.getExcluida()))
                .filter(item -> item.getCodigoCliente() != null)
                .filter(item -> item.getDocumentoTitulo() != null && !item.getDocumentoTitulo().isBlank())
                .collect(Collectors.groupingBy(item -> item.getCodigoCliente() + "|" + normalizarNumero(item.getDocumentoTitulo())));
        int corrigidas = 0;
        for (List<Cobranca> duplicadas : grupos.values()) {
            if (duplicadas.size() < 2) continue;
            duplicadas.sort(Comparator
                    .comparing((Cobranca item) -> item.getResponsavel() != null && !item.getResponsavel().isBlank()).reversed()
                    .thenComparing(item -> item.getAtendimentoRbxNumero() != null && !item.getAtendimentoRbxNumero().isBlank(), Comparator.reverseOrder())
                    .thenComparing(Cobranca::getId));
            Cobranca principal = duplicadas.get(0);
            Set<Long> idsDuplicados = duplicadas.stream().skip(1).map(Cobranca::getId).collect(Collectors.toSet());
            faturamentoRepository.findAll().stream()
                    .filter(titulo -> titulo.getCobrancaId() != null && idsDuplicados.contains(titulo.getCobrancaId()))
                    .forEach(titulo -> titulo.setCobrancaId(principal.getId()));
            for (Cobranca duplicada : duplicadas.subList(1, duplicadas.size())) {
                if ((duplicada.getResponsavel() == null || duplicada.getResponsavel().isBlank())
                        && (duplicada.getAtendimentoRbxNumero() == null || duplicada.getAtendimentoRbxNumero().isBlank())) {
                    historicoRepository.deleteAllByCobrancaId(duplicada.getId());
                    repository.delete(duplicada);
                } else {
                    duplicada.setExcluida(true);
                    duplicada.setExcluidoEm(LocalDateTime.now());
                    duplicada.setExcluidoPor("sistema");
                    duplicada.setMotivoExclusao("Duplicidade automática corrigida pelo sistema; registro principal " + principal.getProtocolo() + ".");
                    repository.save(duplicada);
                }
                corrigidas++;
            }
        }
        return corrigidas;
    }

    @Transactional
    @EventListener(ApplicationReadyEvent.class)
    public void corrigirDuplicidadesAutomaticasAoIniciar() {
        corrigirDuplicidadesAutomaticas();
    }

    private void finalizarAutomaticamentePorPagamento(FaturamentoMensalTitulo titulo) {
        if (titulo.getCobrancaId() == null) return;
        repository.findById(titulo.getCobrancaId()).ifPresent(cobranca -> {
            if ("Fechada".equalsIgnoreCase(cobranca.getSituacaoAtendimento())) return;
            String anterior = cobranca.getStatus();
            cobranca.setStatus("Pago");
            cobranca.setSituacaoAtendimento("Fechada");
            cobranca.setValorPago(titulo.getValorFaturado());
            cobranca.setFechadoEm(LocalDateTime.now());
            cobranca.setAtualizadoEm(LocalDateTime.now());
            cobranca.setAtualizadoPor("sistema");
            repository.save(cobranca);
            salvarHistorico(cobranca, anterior, "Pago", cobranca.getValor(), cobranca.getValor(),
                    "Pagamento identificado automaticamente na sincronização do faturamento.", "sistema");
            prepararFechamentoRbx(cobranca);
            criarNotificacaoEncerramentoAutomatico(cobranca);
        });
    }

    private void criarNotificacaoEncerramentoAutomatico(Cobranca cobranca) {
        if (cobranca.getResponsavel() == null || cobranca.getResponsavel().isBlank()) return;
        String valorPago = NumberFormat.getCurrencyInstance(new Locale("pt", "BR"))
                .format(cobranca.getValorPago() == null ? BigDecimal.ZERO : cobranca.getValorPago());
        boolean fechadoRbx = "FECHADO_RBX".equals(cobranca.getStatusIntegracaoRbx());
        String resultadoRbx = fechadoRbx
                ? "O atendimento " + fallback(cobranca.getAtendimentoRbxNumero(), "") + " também foi encerrado no RBX."
                : "A cobrança foi encerrada localmente; situação do RBX: "
                    + fallback(cobranca.getStatusIntegracaoRbx(), "não iniciado") + ".";
        cobranca.setNotificacaoEncerramentoMensagem("Pagamento identificado automaticamente para "
                + fallback(cobranca.getCliente(), "cliente não informado") + " (" + cobranca.getProtocolo()
                + "). Valor pago: " + valorPago + ". " + resultadoRbx);
        cobranca.setNotificacaoEncerramentoEm(LocalDateTime.now());
        cobranca.setNotificacaoEncerramentoPendente(true);
        repository.save(cobranca);
    }

    private void identificarContratoDoTitulo(Cobranca cobranca) {
        if (cobranca.getNumeroContrato() != null || cobranca.getCodigoCliente() == null || cobranca.getDocumentoTitulo() == null) return;
        try {
            buscarClienteRbx(cobranca.getCodigoCliente().longValue()).contratos().stream()
                    .filter(contrato -> contrato.boletos().stream().anyMatch(boleto ->
                            Objects.equals(normalizarNumero(boleto.documento()), normalizarNumero(cobranca.getDocumentoTitulo()))))
                    .findFirst().ifPresent(contrato -> cobranca.setNumeroContrato(contrato.numero()));
        } catch (Exception e) {
            cobranca.setErroIntegracaoRbx("Contrato não identificado na captura: " + e.getMessage());
        }
    }

    private void prepararFechamentoRbx(Cobranca cobranca) {
        if (!"Fechada".equalsIgnoreCase(cobranca.getSituacaoAtendimento())) return;
        boolean atendimentoRbxAberto = "ABERTO_RBX".equals(cobranca.getStatusIntegracaoRbx());
        if (atendimentoRbxAberto && cobranca.getAtendimentoRbxNumero() != null && !cobranca.getAtendimentoRbxNumero().isBlank()) {
            cobranca.setStatusIntegracaoRbx("AGUARDANDO_FECHAMENTO_RBX");
        } else if (cobranca.getCapturadoEm() != null) {
            cobranca.setStatusIntegracaoRbx("FINALIZADO_SEM_ABERTURA_RBX");
        }
        cobranca.setSolucaoRbxPreparada(montarSolucaoRbx(cobranca));
        repository.save(cobranca);
        if (atendimentoRbxAberto) encerrarAtendimentoRbx(cobranca);
    }

    @EventListener(ApplicationReadyEvent.class)
    public void encerrarAtendimentosPendentesAoIniciar() {
        repository.findAll().stream()
                .filter(cobranca -> "AGUARDANDO_FECHAMENTO_RBX".equals(cobranca.getStatusIntegracaoRbx()))
                .filter(cobranca -> cobranca.getAbertoNoRbxEm() != null)
                .forEach(this::encerrarAtendimentoRbx);
    }

    private void encerrarAtendimentoRbx(Cobranca cobranca) {
        try {
            Long causa = 76L; // Verificação Financeira
            atendimentoClient.encerrar(cobranca.getAtendimentoRbxNumero(),
                    new AtendimentoEncerramentoRbxDTO(causa, cobranca.getSolucaoRbxPreparada(), LocalDateTime.now(FUSO_BRASILIA)),
                    usuarioService.credenciaisRbx(cobranca.getResponsavel()));
            cobranca.setStatusIntegracaoRbx("FECHADO_RBX");
            cobranca.setFechadoNoRbxEm(LocalDateTime.now());
            cobranca.setErroIntegracaoRbx(null);
            repository.save(cobranca);
            salvarHistorico(cobranca, cobranca.getStatus(), cobranca.getStatus(), cobranca.getValor(), cobranca.getValor(),
                    "Atendimento encerrado no RBX. Causa: " + causa + ".", cobranca.getResponsavel());
        } catch (Exception e) {
            cobranca.setStatusIntegracaoRbx("ERRO_FECHAMENTO_RBX");
            cobranca.setErroIntegracaoRbx(e.getMessage());
            repository.save(cobranca);
            salvarHistorico(cobranca, cobranca.getStatus(), cobranca.getStatus(), cobranca.getValor(), cobranca.getValor(),
                    "Falha ao encerrar atendimento no RBX: " + e.getMessage(), cobranca.getResponsavel());
        }
    }

    private String montarSolucaoRbx(Cobranca cobranca) {
        StringBuilder texto = new StringBuilder("Histórico do atendimento ").append(cobranca.getProtocolo()).append("\n");
        if ("PAGO".equals(String.valueOf(cobranca.getStatus()).trim().toUpperCase())) {
            BigDecimal valorPago = cobranca.getValorPago() == null ? BigDecimal.ZERO : cobranca.getValorPago();
            texto.append("Valor pago: ")
                    .append(NumberFormat.getCurrencyInstance(new Locale("pt", "BR")).format(valorPago))
                    .append("\n");
        } else {
            texto.append("Status final: ").append(fallback(cobranca.getStatus(), "Não informado")).append("\n");
        }
        historicoRepository.findAllByCobrancaIdOrderByCriadoEmDesc(cobranca.getId()).stream()
                .sorted(Comparator.comparing(CobrancaHistorico::getCriadoEm, Comparator.nullsLast(Comparator.naturalOrder())))
                .forEach(item -> texto.append("\n").append(formatarDataHoraBrasilia(item.getCriadoEm())).append(" - ")
                        .append(fallback(item.getUsuario(), "sistema")).append(" - ")
                        .append(fallback(item.getStatusNovo(), "Sem alteração de status")).append(": ")
                        .append(fallback(item.getObservacao(), "Sem observação")));
        return texto.toString();
    }

    private String formatarDataHoraBrasilia(LocalDateTime dataHoraUtc) {
        if (dataHoraUtc == null) return "Data não informada";
        return dataHoraUtc.atZone(ZoneOffset.UTC)
                .withZoneSameInstant(FUSO_BRASILIA)
                .format(DATA_HORA_PT_BR);
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
        if (codigo == null) {
            throw new IllegalArgumentException("Informe um codigo de cliente valido para buscar no RBX.");
        }
        List<ClienteFiltradoDTO> clientes = serviceRbx.buscarClienteId(codigo);
        if (clientes == null || clientes.isEmpty()) {
            throw new IllegalArgumentException("Cliente nao encontrado no RBX.");
        }
        var boletos = serviceRbx.buscarBoletosAbertosDoCliente(codigo);
        var contratos = serviceRbx.buscarContratos(codigo.intValue()).stream()
                .map(contrato -> new CobrancaContratoRbxDTO(
                        contrato.numero(),
                        contrato.planoDescricao(),
                        contrato.situacaoDescricao(),
                        boletos.stream()
                                .filter(boleto -> contratoVinculado(contrato.numero(), boleto.contratosVinculados()))
                                .toList()
                ))
                .filter(contrato -> !contrato.boletos().isEmpty())
                .toList();
        return new CobrancaClienteRbxDTO(clientes.get(0), contratos);
    }

    private void aplicarDados(Cobranca cobranca, CobrancaCadastroDTO dto) {
        cobranca.setAcao(fallback(dto.acao(), "Contato"));
        cobranca.setCodigoCliente(dto.codigoCliente());
        if (dto.numeroContrato() != null && !dto.numeroContrato().isBlank()) {
            cobranca.setNumeroContrato(dto.numeroContrato().trim());
        }
        if (dto.documentoTitulo() != null && !dto.documentoTitulo().isBlank()) {
            cobranca.setDocumentoTitulo(dto.documentoTitulo().trim());
        }
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

    private void validarContratoEBoleto(CobrancaCadastroDTO dto, CobrancaClienteRbxDTO dadosRbx) {
        if (dto.numeroContrato() == null || dto.numeroContrato().isBlank()) {
            throw new IllegalArgumentException("Selecione um contrato com boleto em aberto.");
        }
        var contrato = dadosRbx.contratos().stream()
                .filter(item -> mesmoContrato(item.numero(), dto.numeroContrato()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("O contrato selecionado nao possui boleto em aberto no RBX."));
        boolean boletoValido = contrato.boletos().stream().anyMatch(boleto ->
                (dto.documentoTitulo() == null || dto.documentoTitulo().isBlank()
                        || Objects.equals(String.valueOf(boleto.documento()).trim(), dto.documentoTitulo().trim()))
                        && Objects.equals(boleto.vencimento(), String.valueOf(dto.dataVencimento()))
                        && boleto.valor() != null
                        && dto.valor() != null
                        && BigDecimal.valueOf(boleto.valor()).compareTo(dto.valor()) == 0
        );
        if (!boletoValido) {
            throw new IllegalArgumentException("Selecione um boleto em aberto valido para o contrato informado.");
        }
    }

    private void vincularTituloImportado(Cobranca cobranca) {
        if (cobranca.getDocumentoTitulo() == null || cobranca.getCodigoCliente() == null) return;
        faturamentoRepository.findFirstByDocumentoAndCodigoClienteAndBaixadoFalseOrderByMesReferenciaDesc(
                cobranca.getDocumentoTitulo(), String.valueOf(cobranca.getCodigoCliente())
        ).ifPresent(titulo -> {
            titulo.setCobrancaId(cobranca.getId());
            titulo.setNumeroContrato(cobranca.getNumeroContrato());
            faturamentoRepository.save(titulo);
        });
    }

    public List<FilaInadimplenteDTO> filaInadimplentes() {
        LocalDate hoje = LocalDate.now();
        List<Cobranca> cobrancas = repository.findAll();
        Set<Integer> clientesComAtendimento = cobrancas.stream()
                .filter(item -> !Boolean.TRUE.equals(item.getExcluida()))
                .filter(item -> !"Fechada".equalsIgnoreCase(item.getSituacaoAtendimento()))
                .map(Cobranca::getCodigoCliente).filter(Objects::nonNull).collect(Collectors.toSet());

        return faturamentoRepository.findByBaixadoFalse().stream()
                .filter(titulo -> atrasoMinimoAtingido(titulo.getVencimento(), hoje))
                .filter(titulo -> titulo.getCodigoCliente() != null && !titulo.getCodigoCliente().isBlank())
                .collect(Collectors.groupingBy(titulo -> titulo.getCodigoCliente().trim()))
                .entrySet().stream().map(entry -> {
                    List<FaturamentoMensalTitulo> titulos = entry.getValue();
                    BigDecimal valor = titulos.stream().map(FaturamentoMensalTitulo::getValorFaturado)
                            .filter(Objects::nonNull).reduce(BigDecimal.ZERO, BigDecimal::add);
                    LocalDate maisAntigo = titulos.stream().map(FaturamentoMensalTitulo::getVencimento).min(LocalDate::compareTo).orElse(null);
                    Integer codigo = inteiro(entry.getKey());
                    return new FilaInadimplenteDTO(entry.getKey(), titulos.get(0).getNomeCliente(), titulos.size(), valor,
                            maisAntigo, codigo != null && clientesComAtendimento.contains(codigo));
                })
                .sorted(Comparator.comparing(FilaInadimplenteDTO::valorVencido).reversed())
                .toList();
    }

    @Transactional
    public Map<String, Object> relatorioOperacional(LocalDate mes) {
        LocalDate inicio = mes.withDayOfMonth(1);
        LocalDate fim = inicio.plusMonths(1);
        List<Cobranca> todasCobrancas = repository.findAll().stream()
                .filter(item -> !Boolean.TRUE.equals(item.getExcluida()))
                .toList();
        List<Cobranca> cobrancas = todasCobrancas.stream()
                .filter(this::possuiDonoRelatorio)
                .toList();
        List<Cobranca> criadas = cobrancas.stream().filter(item -> dentroDoMes(item.getCriadoEm(), inicio, fim)).toList();
        List<Cobranca> fechadas = cobrancas.stream().filter(item -> dentroDoMes(item.getFechadoEm(), inicio, fim)).toList();
        List<CobrancaHistorico> movimentos = historicoRepository.findAll().stream()
                .filter(item -> dentroDoMes(item.getCriadoEm(), inicio, fim))
                .filter(item -> item.getCobranca() != null && possuiDonoRelatorio(item.getCobranca()))
                .toList();
        List<CobrancaHistorico> acordos = movimentos.stream()
                .filter(item -> contem(item.getStatusNovo(), "PROMESSA") || contem(item.getObservacao(), "ACORDO"))
                .filter(item -> item.getCobranca() != null && !Boolean.TRUE.equals(item.getCobranca().getExcluida()))
                .collect(Collectors.collectingAndThen(Collectors.toMap(item -> item.getCobranca().getId(), item -> item, (a, b) -> a), map -> map.values().stream().toList()));

        BigDecimal recebido = fechadas.stream().filter(item -> contem(item.getStatus(), "PAGO"))
                .map(item -> item.getValorPago() != null ? item.getValorPago() : item.getValor())
                .filter(Objects::nonNull).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal valorAcordos = acordos.stream().map(CobrancaHistorico::getCobranca).map(Cobranca::getValor)
                .filter(Objects::nonNull).reduce(BigDecimal.ZERO, BigDecimal::add);

        Set<Long> cobrancasTrabalhadasIds = movimentos.stream()
                .map(CobrancaHistorico::getCobranca)
                .filter(Objects::nonNull)
                .map(Cobranca::getId)
                .collect(Collectors.toSet());
        BigDecimal carteiraTrabalhada = cobrancas.stream()
                .filter(item -> cobrancasTrabalhadasIds.contains(item.getId()))
                .map(Cobranca::getValor).filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal percentualRecuperado = carteiraTrabalhada.signum() > 0
                ? recebido.multiply(BigDecimal.valueOf(100)).divide(carteiraTrabalhada, 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        LocalDate inicioAno = LocalDate.of(inicio.getYear(), 1, 1);
        LocalDate fimAno = inicioAno.plusYears(1);
        List<Cobranca> carteiraAnual = cobrancas.stream()
                .filter(item -> dentroDoMes(item.getCriadoEm(), inicioAno, fimAno))
                .toList();
        BigDecimal valorCarteiraAnual = carteiraAnual.stream().map(Cobranca::getValor)
                .filter(Objects::nonNull).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal saldoInadimplenteAnual = carteiraAnual.stream()
                .filter(item -> !"Fechada".equalsIgnoreCase(item.getSituacaoAtendimento()))
                .map(Cobranca::getValor).filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal percentualInadimplente = valorCarteiraAnual.signum() > 0
                ? saldoInadimplenteAnual.multiply(BigDecimal.valueOf(100))
                    .divide(valorCarteiraAnual, 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        Map<String, Map<String, Object>> produtividade = new LinkedHashMap<>();
        movimentos.stream().collect(Collectors.groupingBy(item -> donoAtendimento(item.getCobranca()))).entrySet().stream()
                .sorted(Map.Entry.comparingByKey()).forEach(entry -> {
                    List<CobrancaHistorico> itens = entry.getValue();
                    List<Cobranca> cobrancasDoUsuario = itens.stream()
                            .map(CobrancaHistorico::getCobranca)
                            .filter(Objects::nonNull)
                            .filter(item -> !Boolean.TRUE.equals(item.getExcluida()))
                            .distinct()
                            .toList();
                    List<Cobranca> acordosDoUsuario = itens.stream()
                            .filter(item -> contem(item.getStatusNovo(), "PROMESSA") || contem(item.getObservacao(), "ACORDO"))
                            .map(CobrancaHistorico::getCobranca)
                            .filter(Objects::nonNull)
                            .filter(item -> !Boolean.TRUE.equals(item.getExcluida()))
                            .distinct()
                            .toList();
                    List<Cobranca> pagamentosDoUsuario = itens.stream()
                            .filter(item -> contem(item.getStatusNovo(), "PAGO"))
                            .map(CobrancaHistorico::getCobranca)
                            .filter(Objects::nonNull)
                            .filter(item -> !Boolean.TRUE.equals(item.getExcluida()))
                            .distinct()
                            .toList();
                    Map<String, Object> linha = new LinkedHashMap<>();
                    linha.put("usuario", entry.getKey());
                    linha.put("acoes", itens.size());
                    linha.put("clientes", cobrancasDoUsuario.stream().map(Cobranca::getCodigoCliente).filter(Objects::nonNull).distinct().count());
                    linha.put("carteiraTrabalhada", cobrancasDoUsuario.stream().map(Cobranca::getValor).filter(Objects::nonNull).reduce(BigDecimal.ZERO, BigDecimal::add));
                    List<Cobranca> abertasDoUsuario = criadas.stream().filter(item -> donoAtendimento(item).equals(entry.getKey())).toList();
                    List<Cobranca> fechadasDoUsuario = fechadas.stream().filter(item -> donoAtendimento(item).equals(entry.getKey())).toList();
                    linha.put("aberturas", abertasDoUsuario.size());
                    linha.put("valorAberturas", abertasDoUsuario.stream().map(Cobranca::getValor).filter(Objects::nonNull).reduce(BigDecimal.ZERO, BigDecimal::add));
                    linha.put("encerramentos", fechadasDoUsuario.size());
                    linha.put("valorEncerramentos", fechadasDoUsuario.stream().map(Cobranca::getValor).filter(Objects::nonNull).reduce(BigDecimal.ZERO, BigDecimal::add));
                    linha.put("acordos", acordosDoUsuario.size());
                    linha.put("valorAcordos", acordosDoUsuario.stream().map(Cobranca::getValor).filter(Objects::nonNull).reduce(BigDecimal.ZERO, BigDecimal::add));
                    linha.put("pagamentos", pagamentosDoUsuario.size());
                    linha.put("valorPagamentos", pagamentosDoUsuario.stream()
                            .map(item -> item.getValorPago() != null ? item.getValorPago() : item.getValor())
                            .filter(Objects::nonNull).reduce(BigDecimal.ZERO, BigDecimal::add));
                    produtividade.put(entry.getKey(), linha);
                });

        Map<String, Object> fechamento = new LinkedHashMap<>();
        fechamento.put("abertasNoMes", criadas.size());
        fechamento.put("valorAbertasNoMes", criadas.stream().map(Cobranca::getValor).filter(Objects::nonNull).reduce(BigDecimal.ZERO, BigDecimal::add));
        fechamento.put("fechadasNoMes", fechadas.size());
        fechamento.put("valorFechadasNoMes", fechadas.stream().map(Cobranca::getValor).filter(Objects::nonNull).reduce(BigDecimal.ZERO, BigDecimal::add));
        fechamento.put("recebidoPelaEquipe", recebido);
        fechamento.put("saldoAtendimentosAbertos", cobrancas.stream().filter(item -> !"Fechada".equalsIgnoreCase(item.getSituacaoAtendimento())).map(Cobranca::getValor).filter(Objects::nonNull).reduce(BigDecimal.ZERO, BigDecimal::add));

        Map<String, Object> indicadores = new LinkedHashMap<>();
        indicadores.put("valorRecuperado", recebido);
        indicadores.put("carteiraTrabalhada", carteiraTrabalhada);
        indicadores.put("percentualRecuperado", percentualRecuperado);
        indicadores.put("saldoInadimplenteAnual", saldoInadimplenteAnual);
        indicadores.put("valorCarteiraAnual", valorCarteiraAnual);
        indicadores.put("percentualInadimplente", percentualInadimplente);
        indicadores.put("ano", inicio.getYear());
        indicadores.put("acordos", acordos.size());
        List<Cobranca> aguardandoCaptura = todasCobrancas.stream()
                .filter(item -> Boolean.TRUE.equals(item.getGeradaAutomaticamente()))
                .filter(item -> !possuiDonoRelatorio(item))
                .filter(item -> !"Fechada".equalsIgnoreCase(item.getSituacaoAtendimento()))
                .toList();
        indicadores.put("aguardandoCaptura", aguardandoCaptura.size());
        indicadores.put("valorAguardandoCaptura", aguardandoCaptura.stream().map(Cobranca::getValor)
                .filter(Objects::nonNull).reduce(BigDecimal.ZERO, BigDecimal::add));

        return Map.of(
                "period", inicio.toString().substring(0, 7),
                "closing", fechamento,
                "agreements", Map.of("count", acordos.size(), "value", valorAcordos),
                "indicators", indicadores,
                "productivity", produtividade.values(),
                "results", Map.of(
                        "actions", movimentos.size(),
                        "workedValue", carteiraTrabalhada,
                        "opened", criadas.size(),
                        "openedValue", fechamento.get("valorAbertasNoMes"),
                        "closed", fechadas.size(),
                        "closedValue", fechamento.get("valorFechadasNoMes"),
                        "received", recebido
                )
        );
    }

    private String donoAtendimento(Cobranca cobranca) {
        if (cobranca == null) return "sistema";
        return fallback(cobranca.getResponsavel(), fallback(cobranca.getCriadoPor(), "sistema"));
    }

    private boolean possuiDonoRelatorio(Cobranca cobranca) {
        return !"sistema".equalsIgnoreCase(donoAtendimento(cobranca));
    }

    private boolean dentroDoMes(LocalDateTime data, LocalDate inicio, LocalDate fim) {
        return data != null && !data.toLocalDate().isBefore(inicio) && data.toLocalDate().isBefore(fim);
    }

    private boolean contem(String texto, String trecho) {
        return String.valueOf(texto).toUpperCase().contains(trecho);
    }

    private Integer inteiro(String valor) {
        try {
            String somenteDigitos = String.valueOf(valor).replaceAll("\\D", "");
            return somenteDigitos.isBlank() ? null : Integer.valueOf(somenteDigitos);
        } catch (Exception ignored) {
            return null;
        }
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
        String responsavel = cobranca.getResponsavel();
        String dono = responsavel == null || responsavel.isBlank() ? cobranca.getCriadoPor() : responsavel;
        if (!String.valueOf(dono).equalsIgnoreCase(String.valueOf(usuario))) {
            throw new IllegalStateException("Somente o usuario responsavel pela cobranca pode fecha-la ou marca-la como paga.");
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

    private void validarCobrancaEmAndamento(Integer codigoCliente, String numeroContrato, Long idAtual) {
        if (codigoCliente == null || numeroContrato == null || numeroContrato.isBlank()) {
            return;
        }

        repository.findAllByCodigoClienteAndNumeroContrato(codigoCliente, numeroContrato.trim()).stream()
                .filter(cobranca -> !Boolean.TRUE.equals(cobranca.getExcluida()))
                .filter(cobranca -> idAtual == null || !cobranca.getId().equals(idAtual))
                .filter(cobranca -> !"Fechada".equalsIgnoreCase(cobranca.getSituacaoAtendimento()))
                .filter(cobranca -> !isStatusPagoOuFechado(cobranca.getStatus()))
                .findFirst()
                .ifPresent(cobranca -> {
                    throw new IllegalStateException("Ja existe uma cobranca em andamento para este contrato: " + cobranca.getProtocolo());
                });
    }

    private boolean mesmoContrato(String numeroContrato, String contratoBoleto) {
        return Objects.equals(normalizarNumero(numeroContrato), normalizarNumero(contratoBoleto));
    }

    private boolean contratoVinculado(String numeroContrato, String contratosVinculados) {
        if (contratosVinculados == null || contratosVinculados.isBlank()) {
            return false;
        }
        return List.of(contratosVinculados.split(",")).stream()
                .map(String::trim)
                .anyMatch(contrato -> mesmoContrato(numeroContrato, contrato));
    }

    private String normalizarNumero(String valor) {
        return String.valueOf(valor == null ? "" : valor).replaceAll("\\D", "");
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
        String responsavel = cobranca.getResponsavel();
        boolean aguardandoCaptura = Boolean.TRUE.equals(cobranca.getGeradaAutomaticamente())
                && (responsavel == null || responsavel.isBlank());
        return podeVerGeral
                || aguardandoCaptura
                || String.valueOf(responsavel).equalsIgnoreCase(String.valueOf(usuario))
                || String.valueOf(cobranca.getCriadoPor()).equalsIgnoreCase(String.valueOf(usuario));
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
