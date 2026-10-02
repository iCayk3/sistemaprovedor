package br.com.w4solution.controle_instalacao.services.rbx;

import br.com.w4solution.controle_instalacao.dto.cliente.ClienteRbxDTO;
import br.com.w4solution.controle_instalacao.dto.rbx.AtendimentoOsDTO;
import br.com.w4solution.controle_instalacao.dto.rbx.ContratoRbxDTO;
import br.com.w4solution.controle_instalacao.dto.rbx.RelatorioClientesPlanoCidadeDTO;
import br.com.w4solution.controle_instalacao.dto.rbx.RelatorioOsConcluidasResponseDTO;
import br.com.w4solution.controle_instalacao.dto.rbx.RelatorioProdutividadeOcorrenciasDTO;
import com.fasterxml.jackson.core.type.TypeReference;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class RbxRelatoriosService {

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final Pattern DIACRITICS_PATTERN = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");

    private final IntegracaoRbx integracaoRbx;
    private final String chaveApi;

    public RbxRelatoriosService(IntegracaoRbx integracaoRbx,
                                @Value("${api.service.integration.rbx.chave}") String chaveApi) {
        this.integracaoRbx = integracaoRbx;
        this.chaveApi = chaveApi;
    }

    /**
     * Retorna a lista de tópicos disponíveis no período.
     */
    public List<String> buscarTopicosDisponiveis(LocalDate inicio, LocalDate fim) {
        LocalDate dataInicio = (inicio != null) ? inicio : LocalDate.now().minusDays(30);
        LocalDate dataFim = (fim != null) ? fim : LocalDate.now();

        List<Map<String, Object>> atendimentos = buscarAtendimentosRbxCache(dataInicio, dataFim);

        return atendimentos.stream()
                .map(item -> text(item, "Topico"))
                .filter(topico -> !topico.isBlank())
                .distinct()
                .sorted(String.CASE_INSENSITIVE_ORDER)
                .toList();
    }

    /**
     * Relatório de atendimentos com OS Concluídas por intervalo de datas e tópicos selecionados.
     */
    public RelatorioOsConcluidasResponseDTO relatorioOsConcluidas(LocalDate dataInicio,
                                                                 LocalDate dataFim,
                                                                 List<String> topicos,
                                                                 String search) {
        if (dataInicio == null) dataInicio = LocalDate.now().withDayOfMonth(1);
        if (dataFim == null) dataFim = LocalDate.now();

        if (dataInicio.isAfter(dataFim)) {
            LocalDate temp = dataInicio;
            dataInicio = dataFim;
            dataFim = temp;
        }

        List<Map<String, Object>> todosAtendimentos = buscarAtendimentosRbxCache(dataInicio, dataFim);

        // Conjunto de tópicos normalizados para filtro (se fornecido)
        Set<String> topicosFiltro = new HashSet<>();
        if (topicos != null && !topicos.isEmpty()) {
            for (String t : topicos) {
                if (t != null && !t.isBlank()) {
                    // Divide caso venha separado por vírgula
                    for (String part : t.split(",")) {
                        String clean = part.trim().toLowerCase(Locale.ROOT);
                        if (!clean.isBlank()) {
                            topicosFiltro.add(clean);
                        }
                    }
                }
            }
        }

        String searchLower = (search != null && !search.isBlank()) ? search.trim().toLowerCase(Locale.ROOT) : null;

        List<AtendimentoOsDTO> listaFiltrada = new ArrayList<>();
        Map<String, Long> totalPorTopico = new HashMap<>();
        Map<String, Long> totalPorTecnico = new HashMap<>();
        long somaDuracaoMinutos = 0;
        int contagemDuracao = 0;

        // Lista de tópicos disponíveis no lote consultado
        Set<String> topicosEncontrados = new TreeSet<>(String.CASE_INSENSITIVE_ORDER);

        for (Map<String, Object> item : todosAtendimentos) {
            String situacaoOs = text(item, "Situacao_OS").toUpperCase(Locale.ROOT);
            String encerramentoDataHora = text(item, "Encerramento_DataHora");
            String solucao = text(item, "Solucao");
            String topico = fallback(text(item, "Topico"), "Sem tópico");

            // Critério de OS Concluída: Situação 'C' ou encerramento registrado com solução
            boolean osConcluida = "C".equals(situacaoOs) || (!encerramentoDataHora.isBlank() && !solucao.isBlank());
            if (!osConcluida) {
                continue;
            }

            topicosEncontrados.add(topico);

            // Filtro por tópicos (se algum selecionado)
            if (!topicosFiltro.isEmpty() && !topicosFiltro.contains(topico.trim().toLowerCase(Locale.ROOT))) {
                continue;
            }

            String numero = text(item, "Numero");
            String protocolo = text(item, "Protocolo");
            String aberturaDataHora = text(item, "Abertura_DataHora");
            String aberturaUsuario = fallback(text(item, "Abertura_Usuario"), "Não informado");
            String tecnico = fallback(text(item, "Designacao_Usuario"), fallback(text(item, "Designacao_Grupo_Nome"), "Não designado"));
            String assunto = text(item, "Assunto");
            String causa = fallback(text(item, "Causa"), "Não informada");
            String codigoCliente = text(item, "CodigoCliente");
            String tipoCliente = text(item, "TipoCliente");
            String tipo = text(item, "Tipo");

            // Filtro de busca textual (se fornecido)
            if (searchLower != null) {
                boolean match = numero.toLowerCase(Locale.ROOT).contains(searchLower)
                        || protocolo.toLowerCase(Locale.ROOT).contains(searchLower)
                        || codigoCliente.toLowerCase(Locale.ROOT).contains(searchLower)
                        || tecnico.toLowerCase(Locale.ROOT).contains(searchLower)
                        || topico.toLowerCase(Locale.ROOT).contains(searchLower)
                        || assunto.toLowerCase(Locale.ROOT).contains(searchLower)
                        || solucao.toLowerCase(Locale.ROOT).contains(searchLower);
                if (!match) {
                    continue;
                }
            }

            // Cálculo de duração em minutos
            Long duracaoMinutos = calcularDuracaoMinutos(aberturaDataHora, encerramentoDataHora);
            String duracaoFormatada = formatarDuracao(duracaoMinutos);

            if (duracaoMinutos != null && duracaoMinutos >= 0) {
                somaDuracaoMinutos += duracaoMinutos;
                contagemDuracao++;
            }

            totalPorTopico.merge(topico, 1L, Long::sum);
            totalPorTecnico.merge(tecnico, 1L, Long::sum);

            listaFiltrada.add(new AtendimentoOsDTO(
                    numero,
                    protocolo,
                    aberturaDataHora,
                    encerramentoDataHora,
                    duracaoMinutos,
                    duracaoFormatada,
                    aberturaUsuario,
                    tecnico,
                    "C",
                    "Concluída",
                    topico,
                    assunto,
                    solucao,
                    causa,
                    codigoCliente,
                    tipoCliente,
                    tipo
            ));
        }

        // Ordena atendimentos do mais recente para o mais antigo
        listaFiltrada.sort((a, b) -> Objects.compare(b.encerramentoDataHora(), a.encerramentoDataHora(), Comparator.nullsLast(Comparator.naturalOrder())));

        long tempoMedioMinutos = (contagemDuracao > 0) ? (somaDuracaoMinutos / contagemDuracao) : 0;
        String tempoMedioFormatado = formatarDuracao(tempoMedioMinutos);

        return new RelatorioOsConcluidasResponseDTO(
                listaFiltrada.size(),
                tempoMedioMinutos,
                tempoMedioFormatado,
                totalPorTopico,
                totalPorTecnico,
                new ArrayList<>(topicosEncontrados),
                listaFiltrada
        );
    }

    /**
     * Cache do lote de atendimentos por período no RBX.
     */
    @Cacheable(value = "rbx_atendimentos_periodo", key = "#dataInicio.toString() + '_' + #dataFim.toString()")
    public List<Map<String, Object>> buscarAtendimentosRbxCache(LocalDate dataInicio, LocalDate dataFim) {
        String filtro = "Atendimentos.Data_AB >= '%s' AND Atendimentos.Data_AB <= '%s'".formatted(dataInicio, dataFim);
        String body = """
                {
                   "ConsultaAtendimentos": {
                      "Autenticacao": {
                         "ChaveIntegracao": "%s"
                      },
                      "Filtro": "%s"
                   }
                }
                """.formatted(chaveApi, filtro);

        try {
            return integracaoRbx.fazerRequest(body, new TypeReference<RespostaAPI<Map<String, Object>>>() {});
        } catch (Exception e) {
            throw new RuntimeException("Erro ao consultar atendimentos no RBX: " + e.getMessage(), e);
        }
    }

    public static final Set<String> USUARIOS_GRUPO_TECNICO = Set.of(
            "andrehenrique",
            "classic",
            "cleilton",
            "gol.mgb",
            "gol.pmv",
            "gol.qt",
            "gol.sb",
            "gol.sjp",
            "gol.sjp03",
            "gol02.sjp",
            "golpmv02",
            "johnny",
            "lailson",
            "strada.branca.mgb",
            "strada.mgb",
            "strada.sjp",
            "william"
    );

    /**
     * Relatório de Produtividade dos Usuários / Equipes baseado em Ocorrências de OS (Concluído e Abortado) por dia.
     */
    public RelatorioProdutividadeOcorrenciasDTO relatorioProdutividadeOcorrencias(LocalDate dataInicio, LocalDate dataFim) {
        return relatorioProdutividadeOcorrencias(dataInicio, dataFim, true);
    }

    @Cacheable(value = "rbx_produtividade_ocorrencias", key = "(#dataInicio != null ? #dataInicio.toString() : '') + '_' + (#dataFim != null ? #dataFim.toString() : '') + '_' + #apenasGrupoTecnico")
    public RelatorioProdutividadeOcorrenciasDTO relatorioProdutividadeOcorrencias(LocalDate dataInicio, LocalDate dataFim, boolean apenasGrupoTecnico) {
        if (dataInicio == null) dataInicio = LocalDate.now().minusDays(1);
        if (dataFim == null) dataFim = LocalDate.now();

        if (dataInicio.isAfter(dataFim)) {
            LocalDate temp = dataInicio;
            dataInicio = dataFim;
            dataFim = temp;
        }

        String filtro = "Data >= '%s 00:00:00' AND Data <= '%s 23:59:59' AND (Descricao LIKE '%%Conclu%%' OR Descricao LIKE '%%Abort%%')"
                .formatted(dataInicio, dataFim);

        String body = """
                {
                   "ConsultaOcorrenciasAtendimentos": {
                      "Autenticacao": {
                         "ChaveIntegracao": "%s"
                      },
                      "Filtro": "%s"
                   }
                }
                """.formatted(chaveApi, filtro);

        List<Map<String, Object>> ocorrenciasRaw;
        try {
            ocorrenciasRaw = integracaoRbx.fazerRequest(body, new TypeReference<RespostaAPI<Map<String, Object>>>() {});
        } catch (Exception e) {
            throw new RuntimeException("Erro ao consultar ocorrências no RBX: " + e.getMessage(), e);
        }

        Pattern concluidoPattern = Pattern.compile("para\\s+Conclu[ií]do", Pattern.CASE_INSENSITIVE);
        Pattern abortadoPattern = Pattern.compile("para\\s+Abortado", Pattern.CASE_INSENSITIVE);

        List<Map<String, Object>> ocorrenciasValidas = new ArrayList<>();
        Set<String> numerosAtendimento = new HashSet<>();

        for (Map<String, Object> oc : ocorrenciasRaw) {
            String desc = text(oc, "Descricao").trim();
            boolean isConcluido = concluidoPattern.matcher(desc).find() || desc.endsWith("Concluído") || desc.endsWith("Concluido");
            boolean isAbortado = abortadoPattern.matcher(desc).find() || desc.endsWith("Abortado");

            if (!isConcluido && !isAbortado) {
                continue; // ignora reaberturas como 'de Concluído para Na Fila'
            }

            String user = fallback(text(oc, "Usuario").trim(), "Desconhecido");
            if (apenasGrupoTecnico && !USUARIOS_GRUPO_TECNICO.contains(user.toLowerCase(Locale.ROOT))) {
                continue; // filtra exclusivamente técnicos do grupo técnico
            }

            ocorrenciasValidas.add(oc);
            String num = text(oc, "Atendimento_Numero").trim();
            if (!num.isBlank()) {
                numerosAtendimento.add(num);
            }
        }

        Map<String, Map<String, Object>> atendimentosPorNumero = buscarAtendimentosPorNumeros(numerosAtendimento);

        Set<String> setDias = new TreeSet<>();
        LocalDate curr = dataInicio;
        while (!curr.isAfter(dataFim)) {
            setDias.add(curr.toString());
            curr = curr.plusDays(1);
        }

        Map<String, Integer> concluidasPorUser = new HashMap<>();
        Map<String, Integer> abortadasPorUser = new HashMap<>();
        Map<String, Map<String, Integer>> concluidasUserDia = new HashMap<>();
        Map<String, Map<String, Integer>> abortadasUserDia = new HashMap<>();

        List<RelatorioProdutividadeOcorrenciasDTO.OcorrenciaDetalheDTO> listaDetalhes = new ArrayList<>();

        for (Map<String, Object> oc : ocorrenciasValidas) {
            String id = text(oc, "Id");
            String dataHora = text(oc, "Data");
            String dia = dataHora.length() >= 10 ? dataHora.substring(0, 10) : "";
            String user = fallback(text(oc, "Usuario").trim(), "Desconhecido");
            String desc = text(oc, "Descricao").trim();
            String lat = text(oc, "Latitude");
            String lon = text(oc, "Longitude");
            String numAtend = text(oc, "Atendimento_Numero").trim();

            boolean isConcluido = concluidoPattern.matcher(desc).find() || desc.endsWith("Concluído") || desc.endsWith("Concluido");
            String tipo = isConcluido ? "CONCLUIDO" : "ABORTADO";

            Map<String, Object> atend = atendimentosPorNumero.get(numAtend);
            String protocolo = atend != null ? text(atend, "Protocolo") : "";
            String topico = atend != null ? text(atend, "Topico") : "";
            String codigoCliente = atend != null ? text(atend, "CodigoCliente") : "";

            listaDetalhes.add(new RelatorioProdutividadeOcorrenciasDTO.OcorrenciaDetalheDTO(
                    id, dataHora, dia, user, tipo, numAtend, protocolo, topico, codigoCliente, desc, lat, lon
            ));

            if (isConcluido) {
                concluidasPorUser.put(user, concluidasPorUser.getOrDefault(user, 0) + 1);
                concluidasUserDia.computeIfAbsent(user, k -> new HashMap<>()).merge(dia, 1, Integer::sum);
            } else {
                abortadasPorUser.put(user, abortadasPorUser.getOrDefault(user, 0) + 1);
                abortadasUserDia.computeIfAbsent(user, k -> new HashMap<>()).merge(dia, 1, Integer::sum);
            }
        }

        listaDetalhes.sort((a, b) -> b.dataHora().compareTo(a.dataHora()));

        Set<String> todosUsuarios = new TreeSet<>(String.CASE_INSENSITIVE_ORDER);
        if (apenasGrupoTecnico) {
            todosUsuarios.addAll(USUARIOS_GRUPO_TECNICO);
        }
        todosUsuarios.addAll(concluidasPorUser.keySet());
        todosUsuarios.addAll(abortadasPorUser.keySet());

        List<RelatorioProdutividadeOcorrenciasDTO.ProdutividadeUsuarioDTO> listaUsuarios = new ArrayList<>();
        int totalConcluidasGeral = 0;
        int totalAbortadasGeral = 0;

        for (String user : todosUsuarios) {
            int conc = concluidasPorUser.getOrDefault(user, 0);
            int abort = abortadasPorUser.getOrDefault(user, 0);
            totalConcluidasGeral += conc;
            totalAbortadasGeral += abort;

            listaUsuarios.add(new RelatorioProdutividadeOcorrenciasDTO.ProdutividadeUsuarioDTO(
                    user,
                    conc,
                    abort,
                    conc + abort,
                    concluidasUserDia.getOrDefault(user, Collections.emptyMap()),
                    abortadasUserDia.getOrDefault(user, Collections.emptyMap())
            ));
        }

        listaUsuarios.sort((a, b) -> {
            int cmp = Integer.compare(b.totalConcluidas(), a.totalConcluidas());
            if (cmp != 0) return cmp;
            return Integer.compare(b.totalGeral(), a.totalGeral());
        });

        int usuariosComAcoes = (int) listaUsuarios.stream().filter(u -> u.totalGeral() > 0).count();

        return new RelatorioProdutividadeOcorrenciasDTO(
                dataInicio.toString(),
                dataFim.toString(),
                totalConcluidasGeral,
                totalAbortadasGeral,
                totalConcluidasGeral + totalAbortadasGeral,
                usuariosComAcoes,
                new ArrayList<>(setDias),
                listaUsuarios,
                listaDetalhes
        );
    }

    private Map<String, Map<String, Object>> buscarAtendimentosPorNumeros(Set<String> numeros) {
        if (numeros == null || numeros.isEmpty()) {
            return Collections.emptyMap();
        }

        Map<String, Map<String, Object>> resultado = new HashMap<>();
        List<String> lista = new ArrayList<>(numeros);
        int chunkSize = 60;

        for (int i = 0; i < lista.size(); i += chunkSize) {
            List<String> chunk = lista.subList(i, Math.min(i + chunkSize, lista.size()));
            String inClause = chunk.stream().map(n -> "'" + n + "'").collect(Collectors.joining(", "));
            String body = """
                    {
                       "ConsultaAtendimentos": {
                          "Autenticacao": {
                             "ChaveIntegracao": "%s"
                          },
                          "Filtro": "Atendimentos.Numero IN (%s)"
                       }
                    }
                    """.formatted(chaveApi, inClause);
            try {
                List<Map<String, Object>> resp = integracaoRbx.fazerRequest(
                        body,
                        new TypeReference<RespostaAPI<Map<String, Object>>>() {}
                );
                for (Map<String, Object> at : resp) {
                    String num = text(at, "Numero");
                    if (!num.isBlank()) {
                        resultado.put(num, at);
                    }
                }
            } catch (Exception e) {
                // Continua sem quebrar o relatório de ocorrências caso haja falha nesta busca auxiliar
            }
        }

        return resultado;
    }

    /**
     * Relatório cruzado de Clientes Ativos por Plano x Cidade.
     */
    @Cacheable(value = "rbx_relatorio_clientes_plano_cidade")
    public RelatorioClientesPlanoCidadeDTO relatorioClientesPlanoCidade() {
        try {
            // 1. Consulta contratos ativos
            String bodyContratos = """
                    {
                       "ConsultaContratos": {
                          "Autenticacao": {
                             "ChaveIntegracao": "%s"
                          },
                          "Filtro": "Situacao_Codigo = 'A'"
                       }
                    }
                    """.formatted(chaveApi);

            List<ContratoRbxDTO> contratos = integracaoRbx.fazerRequest(
                    bodyContratos,
                    new TypeReference<RespostaAPI<ContratoRbxDTO>>() {}
            );

            // 2. Consulta clientes ativos
            String bodyClientes = """
                    {
                       "ConsultaClientes": {
                          "Autenticacao": {
                             "ChaveIntegracao": "%s"
                          },
                          "Filtro": "Situacao = 'A'"
                       }
                    }
                    """.formatted(chaveApi);

            List<ClienteRbxDTO> clientes = integracaoRbx.fazerRequest(
                    bodyClientes,
                    new TypeReference<RespostaAPI<ClienteRbxDTO>>() {}
            );

            Map<String, ClienteRbxDTO> clientesPorCodigo = clientes.stream()
                    .filter(c -> c.codigo() != null && !c.codigo().isBlank())
                    .collect(Collectors.toMap(c -> c.codigo().trim(), c -> c, (existente, novo) -> existente));

            // Separação: Cobrados (Valor > 0) vs Não Cobrados (Controle de banda / R$ 0)
            List<ContratoRbxDTO> contratosCobrados = new ArrayList<>();
            List<ContratoRbxDTO> contratosNaoCobrados = new ArrayList<>();

            for (ContratoRbxDTO c : contratos) {
                if (isContratoCobrado(c)) {
                    contratosCobrados.add(c);
                } else {
                    contratosNaoCobrados.add(c);
                }
            }

            RelatorioClientesPlanoCidadeDTO.SecaoPlanoCidadeDTO secaoCobrados = processarSecao(contratosCobrados, clientesPorCodigo, true);
            RelatorioClientesPlanoCidadeDTO.SecaoPlanoCidadeDTO secaoNaoCobrados = processarSecao(contratosNaoCobrados, clientesPorCodigo, false);
            RelatorioClientesPlanoCidadeDTO.SecaoPlanoCidadeDTO secaoConsolidado = processarSecao(contratos, clientesPorCodigo, true);

            // Conjunto ordenado de todas as cidades identificadas
            Set<String> todasCidades = new TreeSet<>(String.CASE_INSENSITIVE_ORDER);
            todasCidades.addAll(secaoCobrados.totaisPorCidadeContratos().keySet());
            todasCidades.addAll(secaoNaoCobrados.totaisPorCidadeContratos().keySet());

            Set<String> todosClientesUnicos = contratos.stream()
                    .map(ContratoRbxDTO::clienteCodigo)
                    .filter(Objects::nonNull)
                    .map(String::trim)
                    .filter(s -> !s.isBlank())
                    .collect(Collectors.toSet());

            return new RelatorioClientesPlanoCidadeDTO(
                    contratos.size(),
                    todosClientesUnicos.size(),
                    secaoCobrados.totalContratos(),
                    secaoCobrados.totalPessoas(),
                    secaoNaoCobrados.totalContratos(),
                    secaoNaoCobrados.totalPessoas(),
                    new ArrayList<>(todasCidades),
                    secaoCobrados,
                    secaoNaoCobrados,
                    secaoConsolidado,
                    LocalDateTime.now().format(DATE_TIME_FORMATTER)
            );

        } catch (Exception e) {
            throw new RuntimeException("Erro ao gerar relatório de clientes por plano x cidade: " + e.getMessage(), e);
        }
    }

    private RelatorioClientesPlanoCidadeDTO.SecaoPlanoCidadeDTO processarSecao(
            List<ContratoRbxDTO> contratosLista,
            Map<String, ClienteRbxDTO> clientesPorCodigo,
            boolean cobrado
    ) {
        Map<String, Map<String, Integer>> matrizContratos = new HashMap<>();
        Map<String, Map<String, Set<String>>> matrizPessoas = new HashMap<>();
        Map<String, Integer> totaisCidadeContratos = new HashMap<>();
        Map<String, Set<String>> totaisCidadePessoas = new HashMap<>();
        Set<String> pessoasUnicas = new HashSet<>();

        for (ContratoRbxDTO contrato : contratosLista) {
            String cid = Optional.ofNullable(contrato.clienteCodigo()).map(String::trim).orElse("");
            if (!cid.isBlank()) {
                pessoasUnicas.add(cid);
            }

            ClienteRbxDTO cliente = clientesPorCodigo.get(cid);
            String rawCidade = (cliente != null && cliente.cidade() != null) ? cliente.cidade() : "";
            String grupoCodigo = (cliente != null) ? cliente.grupo() : "";
            String clienteGrupo = (contrato.clienteNome() != null) ? "" : "";

            String cidade = normalizarCidade(rawCidade, clienteGrupo, grupoCodigo);
            String plano = Optional.ofNullable(contrato.planoDescricao())
                    .filter(p -> !p.isBlank())
                    .map(String::trim)
                    .orElse("Sem plano definido");

            matrizContratos.computeIfAbsent(plano, k -> new HashMap<>()).merge(cidade, 1, Integer::sum);
            matrizPessoas.computeIfAbsent(plano, k -> new HashMap<>())
                    .computeIfAbsent(cidade, k -> new HashSet<>())
                    .add(cid);

            totaisCidadeContratos.merge(cidade, 1, Integer::sum);
            totaisCidadePessoas.computeIfAbsent(cidade, k -> new HashSet<>()).add(cid);
        }

        List<RelatorioClientesPlanoCidadeDTO.LinhaPlanoCidadeDTO> linhas = matrizPessoas.entrySet().stream()
                .map(entry -> {
                    String plano = entry.getKey();
                    Map<String, Set<String>> pessoasPorCidSet = entry.getValue();
                    Map<String, Integer> qtdContratosPorCid = matrizContratos.getOrDefault(plano, Collections.emptyMap());

                    Map<String, Integer> pessoasPorCid = new HashMap<>();
                    int totalPessoasLinha = 0;
                    for (Map.Entry<String, Set<String>> e : pessoasPorCidSet.entrySet()) {
                        int count = e.getValue().size();
                        pessoasPorCid.put(e.getKey(), count);
                        totalPessoasLinha += count;
                    }

                    int totalContratosLinha = qtdContratosPorCid.values().stream().mapToInt(Integer::intValue).sum();

                    return new RelatorioClientesPlanoCidadeDTO.LinhaPlanoCidadeDTO(
                            plano,
                            totalContratosLinha,
                            totalPessoasLinha,
                            cobrado,
                            qtdContratosPorCid,
                            pessoasPorCid
                    );
                })
                .sorted((a, b) -> Integer.compare(b.totalPessoas(), a.totalPessoas()))
                .toList();

        Map<String, Integer> totaisCidadePessoasCount = new HashMap<>();
        for (Map.Entry<String, Set<String>> e : totaisCidadePessoas.entrySet()) {
            totaisCidadePessoasCount.put(e.getKey(), e.getValue().size());
        }

        int totalContratos = contratosLista.size();
        int totalPessoas = pessoasUnicas.size();

        // Top 5 Planos por pessoas
        List<RelatorioClientesPlanoCidadeDTO.ItemDistribuicaoDTO> topPlanos = linhas.stream()
                .limit(5)
                .map(linha -> new RelatorioClientesPlanoCidadeDTO.ItemDistribuicaoDTO(
                        linha.plano(),
                        linha.totalPessoas(),
                        totalPessoas > 0 ? Math.round((linha.totalPessoas() * 100.0 / totalPessoas) * 10.0) / 10.0 : 0
                ))
                .toList();

        // Top 5 Cidades por pessoas
        List<RelatorioClientesPlanoCidadeDTO.ItemDistribuicaoDTO> topCidades = totaisCidadePessoasCount.entrySet().stream()
                .sorted((a, b) -> Integer.compare(b.getValue(), a.getValue()))
                .limit(5)
                .map(entry -> new RelatorioClientesPlanoCidadeDTO.ItemDistribuicaoDTO(
                        entry.getKey(),
                        entry.getValue(),
                        totalPessoas > 0 ? Math.round((entry.getValue() * 100.0 / totalPessoas) * 10.0) / 10.0 : 0
                ))
                .toList();

        return new RelatorioClientesPlanoCidadeDTO.SecaoPlanoCidadeDTO(
                totalContratos,
                totalPessoas,
                linhas.size(),
                totaisCidadeContratos,
                totaisCidadePessoasCount,
                linhas,
                topPlanos,
                topCidades
        );
    }

    private boolean isContratoCobrado(ContratoRbxDTO contrato) {
        double vl = parseValor(contrato.valorLiquido());
        double vb = parseValor(contrato.valorBruto());
        return (vl > 0 || vb > 0);
    }

    private double parseValor(String valor) {
        if (valor == null || valor.isBlank()) return 0.0;
        try {
            return Double.parseDouble(valor.replace(",", ".").trim());
        } catch (NumberFormatException e) {
            return 0.0;
        }
    }

    /**
     * Normaliza nomes de cidades a partir da cidade do cliente, grupo do contrato e ID de grupo.
     */
    public static String normalizarCidade(String rawCidade, String clienteGrupo, String grupoCodigo) {
        String text = removerAcentos(rawCidade).toLowerCase(Locale.ROOT).trim();

        if (text.isBlank() && clienteGrupo != null && !clienteGrupo.isBlank()) {
            if (clienteGrupo.contains(")")) {
                text = removerAcentos(clienteGrupo.substring(clienteGrupo.indexOf(")") + 1)).toLowerCase(Locale.ROOT).trim();
            } else {
                text = removerAcentos(clienteGrupo).toLowerCase(Locale.ROOT).trim();
            }
        }

        if (text.contains("pirabas") || text.contains("sao joao")) return "São João de Pirabas";
        if (text.contains("primavera")) return "Primavera";
        if (text.contains("santarem")) return "Santarém Novo";
        if (text.contains("quatipuru")) return "Quatipuru";
        if (text.contains("boa vista")) return "Boa Vista";
        if (text.contains("magalhaes") || text.contains("barata")) return "Magalhães Barata";
        if (text.contains("maracana")) return "Maracanã";
        if (text.contains("marapanim")) return "Marapanim";
        if (text.contains("salinopolis") || text.contains("salinas")) return "Salinópolis";
        if (text.contains("belem")) return "Belém";
        if (text.contains("prefeitura")) return "Prefeitura";

        // Fallback para código do grupo
        String gc = (grupoCodigo != null) ? grupoCodigo.trim() : "";
        return switch (gc) {
            case "10", "36" -> "São João de Pirabas";
            case "11" -> "Primavera";
            case "13" -> "Santarém Novo";
            case "15" -> "Quatipuru";
            case "16" -> "Boa Vista";
            case "26" -> "Magalhães Barata";
            case "32" -> "Maracanã";
            case "33" -> "Marapanim";
            case "34" -> "Salinópolis";
            default -> (rawCidade != null && !rawCidade.isBlank()) ? capitalize(rawCidade.trim()) : "Outros";
        };
    }

    private static String removerAcentos(String str) {
        if (str == null) return "";
        String nfd = Normalizer.normalize(str, Normalizer.Form.NFD);
        return DIACRITICS_PATTERN.matcher(nfd).replaceAll("");
    }

    private static String capitalize(String text) {
        if (text == null || text.isBlank()) return "";
        String[] words = text.split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (String w : words) {
            if (!w.isBlank()) {
                sb.append(Character.toUpperCase(w.charAt(0)))
                        .append(w.substring(1).toLowerCase(Locale.ROOT))
                        .append(" ");
            }
        }
        return sb.toString().trim();
    }

    private static Long calcularDuracaoMinutos(String abertura, String encerramento) {
        if (abertura == null || abertura.isBlank() || encerramento == null || encerramento.isBlank()) {
            return null;
        }
        try {
            LocalDateTime inicio = LocalDateTime.parse(abertura, DATE_TIME_FORMATTER);
            LocalDateTime fim = LocalDateTime.parse(encerramento, DATE_TIME_FORMATTER);
            return Duration.between(inicio, fim).toMinutes();
        } catch (DateTimeParseException e) {
            return null;
        }
    }

    private static String formatarDuracao(Long minutos) {
        if (minutos == null || minutos < 0) return "-";
        long horas = minutos / 60;
        long mins = minutos % 60;
        if (horas > 24) {
            long dias = horas / 24;
            horas = horas % 24;
            return dias + "d " + horas + "h " + mins + "m";
        }
        if (horas > 0) {
            return horas + "h " + mins + "m";
        }
        return mins + "m";
    }

    private static String text(Map<String, Object> map, String key) {
        Object val = map.get(key);
        return (val != null) ? String.valueOf(val).trim() : "";
    }

    private static String fallback(String val, String fallbackVal) {
        return (val != null && !val.isBlank()) ? val : fallbackVal;
    }
}
