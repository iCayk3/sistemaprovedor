package br.com.w4solution.controle_instalacao.services.eventos;

import br.com.w4solution.controle_instalacao.domain.atividades.Atividade;
import br.com.w4solution.controle_instalacao.domain.usuarios.UserRole;
import br.com.w4solution.controle_instalacao.domain.usuarios.Usuario;
import br.com.w4solution.controle_instalacao.dto.evento.*;
import br.com.w4solution.controle_instalacao.repository.eventos.AtividadeRepository;
import br.com.w4solution.controle_instalacao.repository.eventos.EventoRepository;
import br.com.w4solution.controle_instalacao.repository.usuarios.UsuarioRepository;
import br.com.w4solution.controle_instalacao.services.ExtratorToken;
import br.com.w4solution.controle_instalacao.services.rbx.ServiceRbx;
import br.com.w4solution.controle_instalacao.services.usuarios.TokenService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.scheduling.annotation.Scheduled;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Locale;
import java.util.Set;
import java.time.YearMonth;


@Service
public class AtividadesService {

    private static final List<String> STATUS_EM_CONCILIACAO = List.of("AGUARDANDO_INSTALACAO", "CONVERTIDO");
    private static final Set<String> MOTIVOS_NAO_CONCLUSAO = Set.of(
            "DESISTENCIA_CLIENTE", "SEM_VIABILIDADE_TECNICA", "ENDERECO_INCORRETO",
            "SEM_CONTATO", "PENDENCIA_DOCUMENTAL", "DIVERGENCIA_COMERCIAL", "OUTRO"
    );

    @Autowired
    AtividadeRepository repository;

    @Autowired
    UsuarioRepository usuarioRepository;

    @Autowired
    EventoRepository eventoRepository;

    @Autowired
    TokenService token;

    @Autowired
    ExtratorToken extrator;

    @Autowired
    ServiceRbx serviceRbx;


    public List<AtividadesDTO> cadastrarAtividade(List<CadastrarAtividadesDTO> dados, HttpServletRequest request) {
        if(dados.isEmpty()){
            throw new RuntimeException("Sem dados para cadastrar");
        }

        var usuario = extrator.extrairUsuario(request);

        var atividades = dados.stream()
                .map(a -> prepararAtividade(a, usuario))
                .toList();
        repository.saveAll(atividades);

        return atividades.stream().map(AtividadesDTO::new).toList();
    }

    public AtividadeClienteRbxDTO buscarClienteAtividadeRbx(Integer codigoCliente) {
        if (codigoCliente == null) {
            throw new IllegalArgumentException("Informe o codigo do cliente.");
        }

        var cliente = serviceRbx.buscarClienteId(codigoCliente.longValue()).stream()
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Cliente nao encontrado no RBX."));

        var contrato = serviceRbx.buscarContratoMaisRecenteComValor(codigoCliente)
                .orElseThrow(() -> new IllegalArgumentException("Nenhum contrato com valor encontrado para o cliente."));

        return new AtividadeClienteRbxDTO(
                codigoCliente,
                cliente.nome(),
                grupoCliente(cliente.grupoNome() != null && !cliente.grupoNome().isBlank() ? cliente.grupoNome() : cliente.grupo()),
                contrato.planoDescricao(),
                serviceRbx.valorContrato(contrato)
        );
    }

    public List<AtividadesDTO> listarAtividades(Usuario usuario) {
        return repository.findAll().stream().filter(a -> podeAcessar(a, usuario)).map(AtividadesDTO::new).toList();
    }

    public List<ServicoPorUsuarioDiario> listarAtividadesPorUsuario(String filtro, String segmento, Usuario usuarioAtual) {

        var usuarios = usuarioRepository.encontrarUsuariosPorFragmento(UserRole.COMERCIAL.toString());
        var segmentoNormalizado = normalizarSegmento(segmento);

        return usuarios.stream().filter(u -> podeVerGeral(usuarioAtual) || u.getUsuario().equalsIgnoreCase(usuarioAtual.getUsuario())).map(u -> {
            List<Object[]> resultados = null;

            if(filtro != null){

                LocalDate data = LocalDate.parse(filtro);
                resultados  = repository.encontrarAtividadesPorUsuario(u.getUsuario(), segmentoNormalizado, data.getMonthValue(), data.getYear(), data.getDayOfMonth());

            }else {
                resultados  = repository.encontrarAtividadesPorUsuario(u.getUsuario(), segmentoNormalizado, LocalDate.now().getMonth().getValue(), LocalDate.now().getYear(), LocalDate.now().getDayOfMonth());
            }

            List<TotalAtividadeDTO> atividadesDto = new ArrayList<>();
            for (Object[] resultado : resultados) {
                String procedimento = (String) resultado[0];
                Long quantidade = (Long) resultado[1];
                atividadesDto.add(new TotalAtividadeDTO(procedimento, quantidade));
            }

            return new ServicoPorUsuarioDiario(u.getUsuario(), atividadesDto);
        }).toList();
    }

    public List<AtividadesDTO> listarAlertas(Usuario usuario) {
        return repository.findBySegmentoIgnoreCaseAndRequerAtencaoTrueOrderByUltimaConsultaRbxDesc("LEAD")
                .stream().filter(a -> podeAcessar(a, usuario)).map(AtividadesDTO::new).toList();
    }

    public List<AtividadesDTO> listarLeadsPendentesDoMes(String data, Usuario usuario) {
        var referencia = data == null || data.isBlank() ? LocalDate.now() : LocalDate.parse(data);
        return repository.listarLeadsPendentesDoMes(referencia.getYear(), referencia.getMonthValue())
                .stream().filter(a -> podeAcessar(a, usuario)).map(AtividadesDTO::new).toList();
    }

    public List<String> listarCompetenciasComLeadsPendentes(Usuario usuario) {
        return repository.findAll().stream()
                .filter(a -> "LEAD".equalsIgnoreCase(a.getSegmento()))
                .filter(a -> a.getStatus() == null || "ABERTO".equalsIgnoreCase(a.getStatus()))
                .filter(a -> a.getData() != null)
                .filter(a -> podeAcessar(a, usuario))
                .map(a -> YearMonth.from(a.getData()))
                .distinct()
                .sorted(java.util.Comparator.reverseOrder())
                .map(YearMonth::toString)
                .toList();
    }

    public List<ServicoPorUsuarioDiario> listarAtividadesMensaisPorUsuario(String data, String segmento, Usuario usuarioAtual) {
        var segmentoNormalizado = normalizarSegmento(segmento);
        var dataConvertida = data == null || data.isBlank() ? LocalDate.now() : LocalDate.parse(data);
        var resultados = repository.encontrarAtividadesMensaisPorUsuario(segmentoNormalizado, dataConvertida.getMonthValue(), dataConvertida.getYear());
        Map<String, List<TotalAtividadeDTO>> porUsuario = new LinkedHashMap<>();

        for (Object[] resultado : resultados) {
            String usuario = (String) resultado[0];
            if (!podeVerGeral(usuarioAtual) && !usuario.equalsIgnoreCase(usuarioAtual.getUsuario())) continue;
            String evento = (String) resultado[1];
            Long quantidade = (Long) resultado[2];
            porUsuario.computeIfAbsent(usuario, key -> new ArrayList<>()).add(new TotalAtividadeDTO(evento, quantidade));
        }

        return porUsuario.entrySet().stream()
                .map(entry -> new ServicoPorUsuarioDiario(entry.getKey(), entry.getValue()))
                .toList();
    }

    public List<ResumoMensalDTO> buscarResumoMensalAtividade(String data, String segmento, Usuario usuario) {

        var segmentoNormalizado = normalizarSegmento(segmento);
        var eventos = eventoRepository.encontrarPorSegmento(segmentoNormalizado);
        var dataConvertida = LocalDate.parse(data);
        return eventos.stream().map(e -> {
            var value = podeVerGeral(usuario)
                    ? repository.encontrarAtividadesMensal(e.getEvento(), segmentoNormalizado, dataConvertida.getMonthValue(), dataConvertida.getYear())
                    : repository.encontrarAtividadesMensalPorUsuario(e.getEvento(), segmentoNormalizado, dataConvertida.getMonthValue(), dataConvertida.getYear(), usuario.getUsuario());
            return new ResumoMensalDTO(e.getEvento(), value != null ? value : 0);
        }).toList();
    }

    public List<AtividadesDTO> listarAtividadesPorMes(String data, String segmento, Usuario usuario) {
        var segmentoNormalizado = normalizarSegmento(segmento);
        var referencia = data == null ? LocalDate.now() : LocalDate.parse(data);
        if ("LEAD".equals(segmentoNormalizado)) {
            return repository.findAll().stream()
                    .filter(a -> "LEAD".equalsIgnoreCase(a.getSegmento()))
                    .filter(a -> pertenceAoMesComercial(a, referencia))
                    .filter(a -> podeAcessar(a, usuario)).map(AtividadesDTO::new).toList();
        }
        if(data == null){
            return repository.listarAtividadesDoMes(segmentoNormalizado, LocalDate.now().getYear(), LocalDate.now().getMonthValue()).stream().filter(a -> podeAcessar(a, usuario)).map(AtividadesDTO::new).toList();
        }
        var dataConvertida = LocalDate.parse(data);
        return repository.listarAtividadesDoMes(segmentoNormalizado, dataConvertida.getYear(), dataConvertida.getMonthValue()).stream().filter(a -> podeAcessar(a, usuario)).map(AtividadesDTO::new).toList();
    }

    public List<AtividadesDTO> listarAtividadesPorAno(String data, String segmento, Usuario usuario) {
        var segmentoNormalizado = normalizarSegmento(segmento);
        var dataConvertida = data == null || data.isBlank() ? LocalDate.now() : LocalDate.parse(data);
        if ("LEAD".equals(segmentoNormalizado)) {
            return repository.findAll().stream()
                    .filter(a -> "LEAD".equalsIgnoreCase(a.getSegmento()))
                    .filter(a -> pertenceAoAnoComercial(a, dataConvertida.getYear()))
                    .filter(a -> podeAcessar(a, usuario)).map(AtividadesDTO::new).toList();
        }
        return repository.listarAtividadesDoAno(segmentoNormalizado, dataConvertida.getYear()).stream().filter(a -> podeAcessar(a, usuario)).map(AtividadesDTO::new).toList();
    }

    private boolean pertenceAoMesComercial(Atividade atividade, LocalDate referencia) {
        return mesmaCompetencia(atividade.getData(), referencia)
                || mesmaCompetencia(atividade.getConvertidoEm(), referencia)
                || mesmaCompetencia(atividade.getEfetivadoEm(), referencia)
                || mesmaCompetencia(atividade.getNaoConcluidoEm(), referencia);
    }

    private boolean pertenceAoAnoComercial(Atividade atividade, int ano) {
        return (atividade.getData() != null && atividade.getData().getYear() == ano)
                || (atividade.getConvertidoEm() != null && atividade.getConvertidoEm().getYear() == ano)
                || (atividade.getEfetivadoEm() != null && atividade.getEfetivadoEm().getYear() == ano)
                || (atividade.getNaoConcluidoEm() != null && atividade.getNaoConcluidoEm().getYear() == ano);
    }

    private boolean mesmaCompetencia(LocalDate data, LocalDate referencia) {
        return data != null && data.getYear() == referencia.getYear() && data.getMonthValue() == referencia.getMonthValue();
    }

    private boolean mesmaCompetencia(LocalDateTime data, LocalDate referencia) {
        return data != null && data.getYear() == referencia.getYear() && data.getMonthValue() == referencia.getMonthValue();
    }

    public AtividadesDTO converterLead(Long id, ConverterLeadDTO dto, HttpServletRequest request, Usuario usuario) {
        if (dto.codigoCliente() == null) {
            throw new IllegalArgumentException("Informe o codigo do cliente.");
        }
        if (dto.numeroContrato() == null || dto.numeroContrato().isBlank()) {
            throw new IllegalArgumentException("Selecione o contrato que sera convertido.");
        }

        var atividade = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Lead nao encontrado."));
        validarAcesso(atividade, usuario);

        if (!"LEAD".equalsIgnoreCase(atividade.getSegmento())) {
            throw new IllegalArgumentException("Apenas leads podem ser convertidos em venda.");
        }

        var cliente = serviceRbx.buscarClienteId(dto.codigoCliente().longValue()).stream()
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Cliente nao encontrado no RBX."));

        var contrato = serviceRbx.buscarContrato(dto.codigoCliente(), dto.numeroContrato())
                .filter(item -> !contratoTransferido(item.situacaoDescricao()))
                .orElseThrow(() -> new IllegalArgumentException("Contrato nao encontrado, transferido ou nao pertence ao cliente informado."));

        atividade.setStatus("AGUARDANDO_INSTALACAO");
        atividade.setCodigoCliente(dto.codigoCliente());
        atividade.setCliente(cliente.nome());
        atividade.setGrupoCliente(grupoCliente(cliente.grupoNome() != null && !cliente.grupoNome().isBlank() ? cliente.grupoNome() : cliente.grupo()));
        atividade.setPlano(contrato.planoDescricao());
        atividade.setValorPlano(serviceRbx.valorContrato(contrato));
        atividade.setValor(serviceRbx.valorContrato(contrato));
        atividade.setNumeroContratoRbx(contrato.numero());
        atividade.setConvertidoEm(LocalDateTime.now());
        atividade.setConvertidoPor(extrator.extrairUsuario(request));
        atividade.setMotivoNaoConclusao(null);
        atividade.setObservacaoNaoConclusao(null);
        atividade.setNaoConcluidoEm(null);
        atividade.setNaoConcluidoPor(null);
        atividade.setRequerAtencao(false);
        atualizarSituacaoRbx(atividade, cliente.situacao(), contrato.situacaoDescricao());

        return new AtividadesDTO(repository.save(atividade));
    }

    public List<ContratoLeadRbxDTO> listarContratosParaConversao(Integer codigoCliente) {
        if (codigoCliente == null) throw new IllegalArgumentException("Informe o codigo do cliente.");
        serviceRbx.buscarClienteId(codigoCliente.longValue()).stream().findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Cliente nao encontrado no RBX."));
        var contratos = serviceRbx.buscarContratos(codigoCliente).stream()
                .filter(contrato -> !contratoTransferido(contrato.situacaoDescricao()))
                .map(contrato -> new ContratoLeadRbxDTO(contrato, serviceRbx.valorContrato(contrato)))
                .toList();
        if (contratos.isEmpty()) throw new IllegalArgumentException("Nenhum contrato disponivel para conversao. Contratos transferidos nao sao exibidos.");
        return contratos;
    }

    public AtividadesDTO registrarVendaNaoConcluida(Long id, NaoConcluirVendaDTO dto, HttpServletRequest request, Usuario usuario) {
        var atividade = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Lead nao encontrado."));
        validarAcesso(atividade, usuario);
        if (!"LEAD".equalsIgnoreCase(atividade.getSegmento()) || atividade.getCodigoCliente() == null) {
            throw new IllegalArgumentException("O registro precisa ser um lead vinculado ao RBX.");
        }
        var motivo = dto.motivo() == null ? "" : dto.motivo().trim().toUpperCase(Locale.ROOT);
        if (!MOTIVOS_NAO_CONCLUSAO.contains(motivo)) {
            throw new IllegalArgumentException("Informe um motivo valido para a venda nao concluida.");
        }
        if ("OUTRO".equals(motivo) && (dto.observacao() == null || dto.observacao().isBlank())) {
            throw new IllegalArgumentException("Descreva o motivo quando selecionar Outro.");
        }

        atividade.setStatus("ABERTO");
        atividade.setMotivoNaoConclusao(motivo);
        atividade.setObservacaoNaoConclusao(dto.observacao() == null ? null : dto.observacao().trim());
        atividade.setNaoConcluidoEm(LocalDateTime.now());
        atividade.setNaoConcluidoPor(extrator.extrairUsuario(request));
        atividade.setRequerAtencao(false);
        return new AtividadesDTO(repository.save(atividade));
    }

    @Scheduled(cron = "0 0 9,15 * * *", zone = "America/Sao_Paulo")
    public void conciliarVendasComRbx() {
        repository.findBySegmentoIgnoreCaseAndStatusInAndCodigoClienteIsNotNull("LEAD", STATUS_EM_CONCILIACAO)
                .forEach(atividade -> {
                    try {
                        var cliente = serviceRbx.buscarClienteId(atividade.getCodigoCliente().longValue()).stream().findFirst().orElse(null);
                        var contrato = atividade.getNumeroContratoRbx() == null
                                ? serviceRbx.buscarContratoMaisRecenteComValor(atividade.getCodigoCliente()).orElse(null)
                                : serviceRbx.buscarContrato(atividade.getCodigoCliente(), atividade.getNumeroContratoRbx()).orElse(null);
                        atualizarSituacaoRbx(
                                atividade,
                                cliente == null ? null : cliente.situacao(),
                                contrato == null ? null : contrato.situacaoDescricao()
                        );
                        repository.save(atividade);
                    } catch (RuntimeException ignored) {
                        // Uma falha pontual no RBX nao altera o funil; a proxima execucao tenta novamente.
                    }
                });
    }

    private void atualizarSituacaoRbx(Atividade atividade, String situacaoCliente, String situacaoContrato) {
        boolean clienteNaoEncontrado = situacaoCliente == null || situacaoCliente.isBlank();
        boolean contratoNaoEncontrado = situacaoContrato == null;
        var cliente = normalizarSituacao(situacaoCliente);
        var contrato = normalizarSituacao(situacaoContrato);
        atividade.setSituacaoRbx(cliente);
        atividade.setSituacaoContratoRbx(contrato);
        atividade.setUltimaConsultaRbx(LocalDateTime.now());

        if ("A".equals(cliente)) {
            atividade.setStatus("CONVERTIDO");
            if (atividade.getEfetivadoEm() == null) atividade.setEfetivadoEm(LocalDateTime.now());
            atividade.setRequerAtencao(false);
            return;
        }

        boolean clienteImpedeConclusao = Set.of("C", "I", "N").contains(cliente);
        boolean contratoImpedeConclusao = contrato.contains("CANCEL") || contrato.contains("ENCERR") || contrato.contains("INATIV");
        atividade.setRequerAtencao(clienteNaoEncontrado || contratoNaoEncontrado || clienteImpedeConclusao || contratoImpedeConclusao);
    }

    private String normalizarSituacao(String situacao) {
        return situacao == null ? "" : situacao.trim().toUpperCase(Locale.ROOT);
    }

    private boolean contratoTransferido(String situacao) {
        return normalizarSituacao(situacao).contains("TRANSFERID");
    }

    public void deletarAtividade(Long id, Usuario usuario) {
        var atividade = repository.findById(id).orElseThrow(() -> new IllegalArgumentException("Registro nao encontrado."));
        validarAcesso(atividade, usuario);
        repository.delete(atividade);
    }

    private Atividade prepararAtividade(CadastrarAtividadesDTO dto, String usuario) {
        var atividade = new Atividade(dto, usuario);
        if (!"ATIVIDADE".equalsIgnoreCase(atividade.getSegmento())) {
            return atividade;
        }

        var clienteRbx = buscarClienteAtividadeRbx(dto.codigoCliente());
        atividade.setCodigoCliente(clienteRbx.codigoCliente());
        atividade.setCliente(clienteRbx.cliente());
        atividade.setGrupoCliente(clienteRbx.grupoCliente());
        atividade.setPlano(clienteRbx.plano());
        atividade.setValorPlano(clienteRbx.valorPlano());
        atividade.setValor(clienteRbx.valorPlano());
        return atividade;
    }

    private String normalizarSegmento(String segmento) {
        if(segmento == null || segmento.isBlank()){
            return "ATIVIDADE";
        }
        return segmento.trim().toUpperCase();
    }

    private String grupoCliente(String grupo) {
        if (grupo == null || grupo.isBlank()) {
            return grupo;
        }
        return switch (grupo.trim()) {
            case "9" -> "PADRAO";
            case "10" -> "SJP";
            case "11" -> "PMV";
            case "13" -> "STN";
            case "15" -> "QT";
            case "16" -> "BV";
            case "17" -> "SEM COBRANCA";
            case "26" -> "MB";
            case "32" -> "MRC";
            case "33" -> "MRP";
            case "34" -> "SAL";
            case "36" -> "RADIO - PIRABAS";
            case "40" -> "TESTE";
            case "41" -> "PRE";
            case "42" -> "CON";
            case "43" -> "SOL";
            default -> grupo;
        };
    }

    private boolean podeVerGeral(Usuario usuario) {
        return usuario != null && (usuario.getPermissao() == UserRole.ADMIN || usuario.isSupervisor());
    }

    private boolean podeAcessar(Atividade atividade, Usuario usuario) {
        return podeVerGeral(usuario) || (usuario != null && String.valueOf(atividade.getUsuario()).equalsIgnoreCase(usuario.getUsuario()));
    }

    private void validarAcesso(Atividade atividade, Usuario usuario) {
        if (!podeAcessar(atividade, usuario)) throw new IllegalStateException("Voce nao possui acesso a este registro.");
    }
}

