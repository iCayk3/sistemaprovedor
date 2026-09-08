package br.com.w4solution.controle_instalacao.services.cobranca;

import br.com.w4solution.controle_instalacao.domain.cobranca.FaturamentoMensalTitulo;
import br.com.w4solution.controle_instalacao.repository.cobranca.FaturamentoMensalTituloRepository;
import br.com.w4solution.controle_instalacao.services.rbx.IntegracaoRbx;
import br.com.w4solution.controle_instalacao.services.rbx.RespostaAPI;
import com.fasterxml.jackson.core.type.TypeReference;
import jakarta.transaction.Transactional;
import org.apache.poi.ss.usermodel.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class FaturamentoMensalService {
    private final FaturamentoMensalTituloRepository repository;
    private final IntegracaoRbx integracaoRbx;
    private final CobrancaService cobrancaService;
    private final DataFormatter formatter = new DataFormatter(new Locale("pt", "BR"));

    @Value("${api.service.integration.rbx.chave}")
    private String chaveApi;

    public FaturamentoMensalService(FaturamentoMensalTituloRepository repository, IntegracaoRbx integracaoRbx,
                                    CobrancaService cobrancaService) {
        this.repository = repository;
        this.integracaoRbx = integracaoRbx;
        this.cobrancaService = cobrancaService;
    }

    public boolean existe(LocalDate mes) {
        return repository.existsByMesReferencia(mes.withDayOfMonth(1));
    }

    @Transactional
    public Map<String, Object> importar(MultipartFile arquivo, LocalDate mes, String usuario) throws Exception {
        if (arquivo == null || arquivo.isEmpty()) throw new IllegalArgumentException("Selecione uma planilha .xls ou .xlsx.");
        LocalDate referenciaInformada = mes.withDayOfMonth(1);
        List<FaturamentoMensalTitulo> titulos = new ArrayList<>();
        Set<String> documentos = new HashSet<>();
        Set<String> documentosExistentes = repository.findByMesReferencia(referenciaInformada).stream()
                .map(item -> normalizeDocument(item.getDocumento()))
                .collect(Collectors.toSet());
        int titulosDeOutraReferencia = 0;
        int titulosJaExistentes = 0;

        try (Workbook workbook = WorkbookFactory.create(arquivo.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            Row header = sheet.getRow(sheet.getFirstRowNum());
            Map<String, Integer> columns = columns(header);
            require(columns, "codigo", "venc", "doc", "nome", "valor");
            for (int index = header.getRowNum() + 1; index <= sheet.getLastRowNum(); index++) {
                Row row = sheet.getRow(index);
                if (row == null) continue;
                String documento = text(row, columns.get("doc"));
                LocalDate vencimento = date(row.getCell(columns.get("venc")));
                if (documento.isBlank() || vencimento == null) continue;
                if (dueBucket(vencimento, referenciaInformada) == null) {
                    titulosDeOutraReferencia++;
                    continue;
                }
                String documentoNormalizado = normalizeDocument(documento);
                if (!documentos.add(documentoNormalizado)) continue;
                if (documentosExistentes.contains(documentoNormalizado)) {
                    titulosJaExistentes++;
                    continue;
                }
                BigDecimal valor = decimal(row.getCell(columns.get("valor")));
                if (valor.signum() <= 0) continue;

                FaturamentoMensalTitulo titulo = new FaturamentoMensalTitulo();
                titulo.setMesReferencia(referenciaInformada);
                titulo.setCodigoCliente(text(row, columns.get("codigo")));
                titulo.setVencimento(vencimento);
                titulo.setDocumento(documento);
                titulo.setNomeCliente(text(row, columns.get("nome")));
                titulo.setGrupo(optionalText(row, columns, "grupo"));
                titulo.setBanco(optionalText(row, columns, "banco"));
                titulo.setNossoNumero(optionalText(row, columns, "nossonumero"));
                titulo.setValorFaturado(valor);
                titulo.setOrigem(optionalText(row, columns, "origem"));
                titulo.setValorRecebido(BigDecimal.ZERO);
                titulo.setImportadoEm(LocalDateTime.now());
                titulo.setImportadoPor(usuario);
                titulos.add(titulo);
            }
        }
        if (titulos.isEmpty() && titulosJaExistentes == 0) {
            throw new IllegalArgumentException("A planilha não possui títulos com vencimento no mês de referência informado.");
        }
        if (!titulos.isEmpty()) repository.saveAll(titulos);
        Map<String, Object> response = new LinkedHashMap<>(resumo(referenciaInformada));
        response.put("imported", Map.of(
                "referenceMonth", referenciaInformada.toString().substring(0, 7),
                "documents", titulos.size(),
                "existingDocuments", titulosJaExistentes,
                "ignoredFromOtherMonths", titulosDeOutraReferencia
        ));
        return response;
    }

    @Transactional
    public Map<String, Object> zerar(LocalDate mes) {
        LocalDate referencia = mes.withDayOfMonth(1);
        List<FaturamentoMensalTitulo> titulos = repository.findByMesReferencia(referencia);
        int cobrancasAutomaticasRemovidas = cobrancaService.removerAutomaticasNaoCapturadas(titulos);
        int documentosRemovidos = titulos.size();
        repository.deleteAll(titulos);
        Map<String, Object> response = new LinkedHashMap<>(resumo(referencia));
        response.put("reset", Map.of(
                "referenceMonth", referencia.toString().substring(0, 7),
                "documents", documentosRemovidos,
                "automaticCharges", cobrancasAutomaticasRemovidas
        ));
        return response;
    }

    public Map<String, Object> resumo(LocalDate mes) {
        LocalDate referencia = mes.withDayOfMonth(1);
        List<FaturamentoMensalTitulo> titulos = repository.findByMesReferencia(referencia);
        BigDecimal faturado = sum(titulos, FaturamentoMensalTitulo::getValorFaturado);
        BigDecimal recebido = sum(titulos.stream().filter(FaturamentoMensalTitulo::isBaixado).toList(), FaturamentoMensalTitulo::getValorFaturado);
        BigDecimal aberto = sum(titulos.stream().filter(titulo -> !titulo.isBaixado()).toList(), FaturamentoMensalTitulo::getValorFaturado);
        long baixados = titulos.stream().filter(FaturamentoMensalTitulo::isBaixado).count();
        LocalDate inicioAno = referencia.withDayOfYear(1);
        LocalDate fimAno = referencia.withMonth(12).withDayOfMonth(31);
        List<FaturamentoMensalTitulo> titulosAno = repository.findByMesReferenciaBetween(inicioAno, fimAno);
        List<FaturamentoMensalTitulo> inadimplentes = titulosAno.stream()
                .filter(titulo -> !titulo.isBaixado())
                .filter(titulo -> titulo.getVencimento().isBefore(LocalDate.now()))
                .toList();
        BigDecimal faturadoAno = sum(titulosAno, FaturamentoMensalTitulo::getValorFaturado);
        BigDecimal inadimplencia = sum(inadimplentes, FaturamentoMensalTitulo::getValorFaturado);
        Map<String, Object> totals = new LinkedHashMap<>();
        totals.put("billed", faturado);
        totals.put("received", recebido);
        totals.put("open", aberto);
        totals.put("documents", titulos.size());
        totals.put("receivedDocuments", baixados);
        totals.put("openDocuments", titulos.size() - baixados);
        totals.put("collectionRate", faturado.signum() > 0 ? recebido.multiply(BigDecimal.valueOf(100)).divide(faturado, 2, RoundingMode.HALF_UP) : BigDecimal.ZERO);
        totals.put("delinquent", inadimplencia);
        totals.put("delinquentDocuments", inadimplentes.size());
        totals.put("delinquencyYear", referencia.getYear());
        totals.put("delinquencyRate", faturadoAno.signum() > 0 ? inadimplencia.multiply(BigDecimal.valueOf(100)).divide(faturadoAno, 2, RoundingMode.HALF_UP) : BigDecimal.ZERO);
        List<Map<String, Object>> dueDates = titulos.stream()
                .filter(titulo -> dueBucket(titulo.getVencimento(), referencia) != null)
                .collect(Collectors.groupingBy(titulo -> dueBucket(titulo.getVencimento(), referencia), TreeMap::new, Collectors.toList()))
                .entrySet().stream().map(entry -> {
                    List<FaturamentoMensalTitulo> vencimentoTitulos = entry.getValue();
                    List<FaturamentoMensalTitulo> vencimentoBaixados = vencimentoTitulos.stream()
                            .filter(FaturamentoMensalTitulo::isBaixado).toList();
                    BigDecimal vencimentoFaturado = sum(vencimentoTitulos, FaturamentoMensalTitulo::getValorFaturado);
                    BigDecimal vencimentoRecebido = sum(vencimentoBaixados, FaturamentoMensalTitulo::getValorFaturado);
                    BigDecimal vencimentoAberto = vencimentoFaturado.subtract(vencimentoRecebido);
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("dueDate", referencia.withDayOfMonth(Math.min(entry.getKey(), referencia.lengthOfMonth())).toString());
                    row.put("dueDateLabel", "Vencimento " + entry.getKey());
                    row.put("dateRange", dueRangeLabel(entry.getKey(), referencia));
                    row.put("billed", vencimentoFaturado);
                    row.put("received", vencimentoRecebido);
                    row.put("open", vencimentoAberto);
                    row.put("documents", vencimentoTitulos.size());
                    row.put("receivedDocuments", vencimentoBaixados.size());
                    row.put("collectionRate", vencimentoFaturado.signum() > 0
                            ? vencimentoRecebido.multiply(BigDecimal.valueOf(100)).divide(vencimentoFaturado, 2, RoundingMode.HALF_UP)
                            : BigDecimal.ZERO);
                    return row;
                }).toList();
        LocalDateTime synced = titulos.stream().map(FaturamentoMensalTitulo::getSincronizadoEm).filter(Objects::nonNull).max(Comparator.naturalOrder()).orElse(null);
        String source = titulos.isEmpty() ? "AGUARDANDO_IMPORTACAO" : "PLANILHA";
        return Map.of("billing", Map.of("source", source, "period", Map.of("referenceMonth", referencia.toString().substring(0, 7)), "totals", totals, "dueDates", dueDates),
                "lastSync", synced == null ? "" : synced.toString());
    }

    @Async
    @Transactional
    public void sincronizarEmBackground(LocalDate mes) {
        try {
            List<FaturamentoMensalTitulo> titulos = repository.findByMesReferencia(mes.withDayOfMonth(1));
            if (!titulos.isEmpty()) sincronizarTitulos(titulos);
        } catch (Exception ignored) {
            // A próxima rotina diária ou sincronização manual tentará novamente.
        }
    }

    @Transactional
    public Map<String, Object> sincronizar(LocalDate mes) throws Exception {
        LocalDate referencia = mes.withDayOfMonth(1);
        List<FaturamentoMensalTitulo> titulos = repository.findByMesReferencia(referencia);
        if (titulos.isEmpty()) throw new IllegalArgumentException("Não existe faturamento importado para este mês.");
        sincronizarTitulos(titulos);
        return resumo(referencia);
    }

    @Transactional
    public synchronized Map<String, Object> reconciliarImportacoesExistentes() {
        List<FaturamentoMensalTitulo> titulos = repository.findAll();
        LocalDate hoje = LocalDate.now();
        long elegiveis = titulos.stream()
                .filter(titulo -> !titulo.isBaixado())
                .filter(titulo -> titulo.getVencimento() != null && !titulo.getVencimento().isAfter(hoje.minusDays(7)))
                .count();
        long vinculadosAntes = titulos.stream().filter(titulo -> titulo.getCobrancaId() != null).count();
        cobrancaService.reconciliarTitulosImportados(titulos);
        long vinculadosDepois = titulos.stream().filter(titulo -> titulo.getCobrancaId() != null).count();
        return Map.of(
                "titulosAnalisados", titulos.size(),
                "titulosVencidosSemBaixa", elegiveis,
                "novosVinculos", Math.max(0, vinculadosDepois - vinculadosAntes),
                "titulosVinculados", vinculadosDepois
        );
    }

    @Async
    @Transactional
    @EventListener(ApplicationReadyEvent.class)
    public void reconciliarImportacoesAoIniciar() {
        reconciliarImportacoesExistentes();
    }

    @Scheduled(cron = "0 15 5 * * *", zone = "America/Sao_Paulo")
    @Transactional
    public void sincronizarDiariamente() {
        repository.findByBaixadoFalse().stream().collect(Collectors.groupingBy(FaturamentoMensalTitulo::getMesReferencia))
                .values().forEach(titulos -> {
                    try { sincronizarTitulos(titulos); } catch (Exception ignored) { }
                });
    }

    private void sincronizarTitulos(List<FaturamentoMensalTitulo> titulos) throws Exception {
        LocalDate mes = titulos.get(0).getMesReferencia();
        LocalDate day30 = mes.withDayOfMonth(Math.min(30, mes.lengthOfMonth()));
        LocalDate nextMonthDay3 = mes.plusMonths(1).withDayOfMonth(3);
        String filtro = "((Movimento.Data >= '%s' AND Movimento.Data <= '%s') OR "
                + "(Movimento.Data >= '%s' AND Movimento.Data <= '%s') OR "
                + "(Movimento.Data >= '%s' AND Movimento.Data <= '%s')) "
                + "AND Movimento.Origem = 'FAT' AND Movimento.Conta = 3 AND Movimento.Tipo = 'C'";
        filtro = filtro.formatted(
                mes.withDayOfMonth(10), mes.withDayOfMonth(12),
                mes.withDayOfMonth(20), mes.withDayOfMonth(22),
                day30, nextMonthDay3
        );
        List<Map<String, Object>> baixados = fetch("ConsultaDocumentosBaixados", filtro).stream()
                .filter(item -> "Documento a receber".equalsIgnoreCase(value(item, "Historico"))).toList();
        Map<String, Map<String, Object>> porDocumento = baixados.stream().collect(Collectors.toMap(
                item -> normalizeDocument(value(item, "Documento")), Function.identity(), (first, second) -> first));
        LocalDateTime now = LocalDateTime.now();
        for (FaturamentoMensalTitulo titulo : titulos) {
            Map<String, Object> baixa = porDocumento.get(normalizeDocument(titulo.getDocumento()));
            if (baixa != null) {
                titulo.setBaixado(true);
                titulo.setValorRecebido(decimal(value(baixa, "ValorBaixado")));
                titulo.setDataBaixa(parseDate(value(baixa, "DataBaixa")));
            }
            titulo.setSincronizadoEm(now);
        }
        repository.saveAll(titulos);
        cobrancaService.reconciliarTitulosImportados(titulos);
    }

    private List<Map<String, Object>> fetch(String operation, String filtro) throws Exception {
        String body = "{\"%s\":{\"Autenticacao\":{\"ChaveIntegracao\":\"%s\"},\"Filtro\":\"%s\"}}"
                .formatted(operation, chaveApi, filtro);
        return integracaoRbx.fazerRequest(body, new TypeReference<RespostaAPI<Map<String, Object>>>() {});
    }

    private Map<String, Integer> columns(Row row) {
        Map<String, Integer> result = new HashMap<>();
        for (Cell cell : row) result.put(normalizeHeader(formatter.formatCellValue(cell)), cell.getColumnIndex());
        return result;
    }
    private void require(Map<String, Integer> columns, String... names) {
        for (String name : names) if (!columns.containsKey(name)) throw new IllegalArgumentException("Coluna obrigatória ausente: " + name);
    }
    private String optionalText(Row row, Map<String, Integer> columns, String name) { return columns.containsKey(name) ? text(row, columns.get(name)) : ""; }
    private String text(Row row, Integer column) { return column == null || row.getCell(column) == null ? "" : formatter.formatCellValue(row.getCell(column)).trim(); }
    private LocalDate date(Cell cell) {
        if (cell == null) return null;
        if (DateUtil.isCellDateFormatted(cell)) return cell.getDateCellValue().toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
        return parseDate(formatter.formatCellValue(cell));
    }
    private LocalDate parseDate(String value) {
        if (value == null || value.isBlank()) return null;
        for (var format : List.of(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"), java.time.format.DateTimeFormatter.ISO_LOCAL_DATE)) {
            try { return LocalDate.parse(value.substring(0, Math.min(value.length(), 10)), format); } catch (Exception ignored) { }
        }
        return null;
    }
    private BigDecimal decimal(Cell cell) { return cell == null ? BigDecimal.ZERO : cell.getCellType() == CellType.NUMERIC ? BigDecimal.valueOf(cell.getNumericCellValue()).setScale(2, RoundingMode.HALF_UP) : decimal(formatter.formatCellValue(cell)); }
    private BigDecimal decimal(String value) {
        if (value == null || value.isBlank()) return BigDecimal.ZERO;
        String clean = value.replace("R$", "").replace(" ", "").replace(".", "").replace(',', '.');
        try { return new BigDecimal(clean).setScale(2, RoundingMode.HALF_UP); } catch (Exception ignored) { return BigDecimal.ZERO; }
    }
    private BigDecimal sum(List<FaturamentoMensalTitulo> values, Function<FaturamentoMensalTitulo, BigDecimal> getter) { return values.stream().map(getter).filter(Objects::nonNull).reduce(BigDecimal.ZERO, BigDecimal::add).setScale(2, RoundingMode.HALF_UP); }
    private String normalizeHeader(String value) { return Normalizer.normalize(value, Normalizer.Form.NFD).replaceAll("\\p{M}", "").replaceAll("[^A-Za-z0-9]", "").toLowerCase(Locale.ROOT); }
    private Integer dueBucket(LocalDate dueDate, LocalDate reference) {
        if (dueDate == null) return null;
        if (dueDate.getYear() == reference.getYear() && dueDate.getMonth() == reference.getMonth()) {
            int day = dueDate.getDayOfMonth();
            if (day >= 10 && day <= 12) return 10;
            if (day >= 20 && day <= 22) return 20;
            if (day >= 30) return 30;
        }
        LocalDate nextMonthDay1 = reference.plusMonths(1).withDayOfMonth(1);
        LocalDate nextMonthDay3 = reference.plusMonths(1).withDayOfMonth(3);
        return !dueDate.isBefore(nextMonthDay1) && !dueDate.isAfter(nextMonthDay3) ? 30 : null;
    }
    private String dueRangeLabel(Integer bucket, LocalDate reference) {
        if (bucket == 10) return "10 a 12";
        if (bucket == 20) return "20 a 22";
        return "30 a " + reference.plusMonths(1).withDayOfMonth(3).format(java.time.format.DateTimeFormatter.ofPattern("dd/MM"));
    }
    private String normalizeDocument(String value) { return value == null ? "" : value.replaceAll("[^0-9A-Za-z]", "").replaceFirst("^0+", ""); }
    private String value(Map<String, Object> item, String key) { Object value = item.get(key); return value == null ? "" : String.valueOf(value); }
}
