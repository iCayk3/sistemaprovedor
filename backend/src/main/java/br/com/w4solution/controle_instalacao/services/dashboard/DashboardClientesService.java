package br.com.w4solution.controle_instalacao.services.dashboard;

import br.com.w4solution.controle_instalacao.services.rbx.IntegracaoRbx;
import br.com.w4solution.controle_instalacao.services.rbx.RespostaAPI;
import com.fasterxml.jackson.core.type.TypeReference;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class DashboardClientesService {

    private static final Map<String, String> GROUP_NAMES = Map.ofEntries(
            Map.entry("10", "SAO JOAO DE PIRABAS"),
            Map.entry("11", "PRIMAVERA"),
            Map.entry("13", "SANTAREM NOVO"),
            Map.entry("15", "QUATIPURU"),
            Map.entry("16", "BOA VISTA"),
            Map.entry("26", "MAGALHAES BARATA"),
            Map.entry("32", "MARACANA"),
            Map.entry("33", "MARAPANIM"),
            Map.entry("34", "SALINOPOLIS"),
            Map.entry("36", "RADIO - PIRABAS")
    );

    private static final Map<String, String> ATTENDANCE_STATUS = Map.of(
            "F", "Na fila",
            "A", "A caminho",
            "E", "Em execucao",
            "P", "Pausado",
            "C", "Concluido",
            "B", "Abortado",
            "O", "Nao informado"
    );

    private static final Map<String, String> ATTENDANCE_TYPES = Map.of(
            "A", "Administrativo / Financeiro",
            "C", "Comercial",
            "T", "Tecnico",
            "O", "Outro"
    );

    private final IntegracaoRbx integracaoRbx;

    @Value("${api.service.integration.rbx.chave}")
    private String chaveApi;

    public DashboardClientesService(IntegracaoRbx integracaoRbx) {
        this.integracaoRbx = integracaoRbx;
    }

    public Map<String, Object> resumoClientes() throws Exception {
        List<Map<String, Object>> clientes = fetch("ConsultaClientes", "");
        Map<String, Integer> statuses = linkedCounters("active", "inactive", "canceled", "suspended", "blocked", "awaitingInstallation", "other");
        Map<String, Integer> codes = new LinkedHashMap<>();

        for (Map<String, Object> cliente : clientes) {
            String code = text(cliente, "Situacao").toUpperCase(Locale.ROOT);
            if (code.isBlank()) code = "(vazio)";
            codes.merge(code, 1, Integer::sum);
            statuses.merge(statusKey(code), 1, Integer::sum);
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("total", clientes.size());
        response.put("statuses", statuses);
        response.put("codes", codes);
        response.put("updatedAt", java.time.Instant.now().toString());
        return response;
    }

    public Map<String, Object> resumoFinanceiro(LocalDate from, LocalDate to) throws Exception {
        validatePeriod(from, to);
        List<Map<String, Object>> clientes = fetch("ConsultaClientes", "");
        List<Map<String, Object>> baixados = fetch("ConsultaDocumentosBaixados",
                "Movimento.DataBaixa >= '%s' AND Movimento.DataBaixa <= '%s'".formatted(from, to));
        List<Map<String, Object>> abertos = fetch("ConsultaDocumentosAbertos",
                "Origem = 'FAT' AND Vencimento >= '%s' AND Vencimento <= '%s'".formatted(from, to));

        Map<String, GroupInfo> clientGroups = clientGroups(clientes);
        Map<String, GroupTotals> groups = new HashMap<>();
        Map<String, Map<String, Object>> daily = new HashMap<>();
        Set<String> paidDocuments = new java.util.HashSet<>();
        double original = 0;
        double interest = 0;
        double fine = 0;
        double discount = 0;
        double received = 0;
        int records = 0;

        for (Map<String, Object> document : baixados) {
            if (!"Documento a receber".equalsIgnoreCase(text(document, "Historico"))) continue;
            records++;
            double originalValue = number(document, "ValorOriginal");
            double interestValue = number(document, "ValorJuros");
            double fineValue = number(document, "ValorMulta");
            double discountValue = number(document, "ValorDesconto");
            double receivedValue = number(document, "ValorBaixado");
            String documentKey = text(document, "CodigoPessoa") + ":" + fallback(text(document, "Documento"), text(document, "Sequencia"));
            GroupInfo group = clientGroups.getOrDefault(text(document, "CodigoPessoa"), new GroupInfo(null, "GRUPO NAO IDENTIFICADO"));
            groups.computeIfAbsent(group.key(), ignored -> new GroupTotals(group)).add(originalValue, interestValue, fineValue, discountValue, receivedValue, documentKey);
            original = round(original + originalValue);
            interest = round(interest + interestValue);
            fine = round(fine + fineValue);
            discount = round(discount + discountValue);
            received = round(received + receivedValue);
            if (originalValue > 0) paidDocuments.add(documentKey);
            addDaily(daily, fallback(text(document, "DataBaixa"), "Sem data"), originalValue);
        }

        double billedOpen = abertos.stream().mapToDouble(item -> number(item, "Valor")).sum();
        double billed = round(received + billedOpen);
        Map<String, Object> billingTotals = new LinkedHashMap<>();
        billingTotals.put("billed", billed);
        billingTotals.put("received", received);
        billingTotals.put("open", round(billedOpen));
        billingTotals.put("collectionRate", billed > 0 ? received / billed * 100 : 0);
        billingTotals.put("documents", abertos.size() + paidDocuments.size());
        billingTotals.put("openDocuments", abertos.size());
        billingTotals.put("receivedDocuments", paidDocuments.size());

        Map<String, Object> totals = new LinkedHashMap<>();
        totals.put("records", records);
        totals.put("rawRecords", baixados.size());
        totals.put("paidDocuments", paidDocuments.size());
        totals.put("original", original);
        totals.put("interest", interest);
        totals.put("fine", fine);
        totals.put("fees", round(interest + fine));
        totals.put("discount", discount);
        totals.put("received", received);
        totals.put("positive", original);
        totals.put("negative", round(-discount));
        totals.put("net", original);

        double totalOriginal = original;
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("period", Map.of("from", from.toString(), "to", to.toString()));
        response.put("totals", totals);
        response.put("billing", Map.of(
                "period", Map.of("from", from.toString(), "to", to.toString(), "adjustedTo", to.toString(), "dueDateAdjusted", false, "launchFrom", from.toString(), "launchTo", to.toString(), "paidTo", LocalDate.now().toString()),
                "totals", billingTotals,
                "groups", List.of()
        ));
        response.put("groups", groups.values().stream()
                .map(group -> group.toRow(totalOriginal))
                .sorted((left, right) -> Double.compare(((Number) right.get("original")).doubleValue(), ((Number) left.get("original")).doubleValue()))
                .toList());
        response.put("daily", daily.values().stream().sorted((left, right) -> String.valueOf(left.get("date")).compareTo(String.valueOf(right.get("date")))).toList());
        response.put("updatedAt", java.time.Instant.now().toString());
        return response;
    }

    public Map<String, Object> resumoAtendimentos(LocalDate from, LocalDate to) throws Exception {
        validatePeriod(from, to);
        List<Map<String, Object>> atendimentos = fetch("ConsultaAtendimentos",
                "Atendimentos.Data_AB >= '%s' AND Atendimentos.Data_AB <= '%s'".formatted(from, to));
        Map<String, Integer> statuses = linkedCounters("F", "A", "E", "P", "C", "B", "O");
        Map<String, Integer> types = linkedCounters("A", "C", "T", "O");
        Map<String, Integer> topics = new HashMap<>();
        int createdToday = 0;
        int closedToday = 0;
        String today = LocalDate.now().toString();

        for (Map<String, Object> item : atendimentos) {
            String status = attendanceStatus(item);
            String type = text(item, "Tipo").toUpperCase(Locale.ROOT);
            if (!ATTENDANCE_TYPES.containsKey(type)) type = "O";
            String openingDate = firstDate(text(item, "Abertura_DataHora"));
            String closingDate = firstDate(text(item, "Encerramento_DataHora"));
            statuses.merge(status, 1, Integer::sum);
            types.merge(type, 1, Integer::sum);
            topics.merge(fallback(text(item, "Topico"), "Sem topico"), 1, Integer::sum);
            if (today.equals(openingDate)) createdToday++;
            if (today.equals(closingDate)) closedToday++;
        }

        int open = statuses.get("F") + statuses.get("A") + statuses.get("E") + statuses.get("P") + statuses.get("O");
        Map<String, Object> totals = new LinkedHashMap<>();
        totals.put("records", atendimentos.size());
        totals.put("open", open);
        totals.put("completed", statuses.get("C"));
        totals.put("aborted", statuses.get("B"));
        totals.put("createdToday", createdToday);
        totals.put("closedToday", closedToday);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("period", Map.of("from", from.toString(), "to", to.toString()));
        response.put("totals", totals);
        response.put("statuses", rows(statuses, ATTENDANCE_STATUS, "Nao informado"));
        response.put("types", rows(types, ATTENDANCE_TYPES, "Outro"));
        response.put("topTopics", topics.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .limit(6)
                .map(entry -> Map.of("topic", entry.getKey(), "value", entry.getValue()))
                .toList());
        response.put("recent", atendimentos.stream()
                .sorted((left, right) -> text(right, "Abertura_DataHora").compareTo(text(left, "Abertura_DataHora")))
                .limit(12)
                .map(this::attendanceRow)
                .toList());
        response.put("updatedAt", java.time.Instant.now().toString());
        return response;
    }

    private List<Map<String, Object>> fetch(String operation, String filtro) throws Exception {
        String body = """
                {
                  "%s": {
                    "Autenticacao": {
                      "ChaveIntegracao": "%s"
                    },
                    "Filtro": "%s"
                  }
                }
                """.formatted(operation, chaveApi, filtro.replace("\"", "\\\""));
        return integracaoRbx.fazerRequest(body, new TypeReference<RespostaAPI<Map<String, Object>>>() {});
    }

    private Map<String, Object> attendanceRow(Map<String, Object> item) {
        String status = attendanceStatus(item);
        String type = text(item, "Tipo").toUpperCase(Locale.ROOT);
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("number", text(item, "Numero"));
        row.put("protocol", text(item, "Protocolo"));
        row.put("openedAt", text(item, "Abertura_DataHora"));
        row.put("closedAt", text(item, "Encerramento_DataHora"));
        row.put("openingUser", fallback(text(item, "Abertura_Usuario"), "Nao informado"));
        row.put("assignedTo", fallback(text(item, "Designacao_Usuario"), fallback(text(item, "Designacao_Grupo_Nome"), "Nao designado")));
        row.put("status", status);
        row.put("statusName", ATTENDANCE_STATUS.getOrDefault(status, "Nao informado"));
        row.put("type", type);
        row.put("typeName", ATTENDANCE_TYPES.getOrDefault(type, "Outro"));
        row.put("topic", fallback(text(item, "Topico"), "Sem topico"));
        row.put("clientCode", text(item, "CodigoCliente"));
        return row;
    }

    private Map<String, GroupInfo> clientGroups(List<Map<String, Object>> clients) {
        return clients.stream().collect(Collectors.toMap(client -> text(client, "Codigo"), this::groupInfo, (left, right) -> left));
    }

    private GroupInfo groupInfo(Map<String, Object> client) {
        String id = text(client, "Grupo");
        if (id.isBlank()) return new GroupInfo(null, "GRUPO NAO INFORMADO");
        return new GroupInfo(id, GROUP_NAMES.getOrDefault(id, "GRUPO " + id));
    }

    private void addDaily(Map<String, Map<String, Object>> daily, String date, double value) {
        Map<String, Object> row = daily.computeIfAbsent(date, key -> {
            Map<String, Object> newRow = new LinkedHashMap<>();
            newRow.put("date", key);
            newRow.put("value", 0.0);
            newRow.put("quantity", 0);
            return newRow;
        });
        row.put("value", round(((Number) row.get("value")).doubleValue() + value));
        row.put("quantity", ((Number) row.get("quantity")).intValue() + 1);
    }

    private static List<Map<String, Object>> rows(Map<String, Integer> values, Map<String, String> labels, String fallback) {
        return values.entrySet().stream()
                .map(entry -> Map.<String, Object>of("code", entry.getKey(), "label", labels.getOrDefault(entry.getKey(), fallback), "value", entry.getValue()))
                .toList();
    }

    private static Map<String, Integer> linkedCounters(String... keys) {
        Map<String, Integer> counters = new LinkedHashMap<>();
        for (String key : keys) counters.put(key, 0);
        return counters;
    }

    private static String statusKey(String code) {
        if ("A".equals(code)) return "active";
        if ("I".equals(code) || "N".equals(code)) return "inactive";
        if ("C".equals(code)) return "canceled";
        if ("S".equals(code)) return "suspended";
        if ("B".equals(code)) return "blocked";
        if ("E".equals(code)) return "awaitingInstallation";
        return "other";
    }

    private static String attendanceStatus(Map<String, Object> item) {
        String code = text(item, "Situacao_OS").toUpperCase(Locale.ROOT);
        if (ATTENDANCE_STATUS.containsKey(code)) return code;
        if (!text(item, "Encerramento_DataHora").isBlank()) return "C";
        return "O";
    }

    private static void validatePeriod(LocalDate from, LocalDate to) {
        if (from == null || to == null || from.isAfter(to)) throw new IllegalArgumentException("Periodo invalido.");
    }

    private static String firstDate(String value) {
        return value == null || value.length() < 10 ? "" : value.substring(0, 10);
    }

    private static String text(Map<String, Object> map, String key) {
        Object value = map.get(key);
        return value == null ? "" : String.valueOf(value).trim();
    }

    private static String fallback(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private static double number(Map<String, Object> map, String key) {
        String value = text(map, key).replace(",", ".");
        if (value.isBlank()) return 0;
        try {
            return Double.parseDouble(value);
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    private static double round(double value) {
        return Math.round((value + 1e-9) * 100.0) / 100.0;
    }

    private record GroupInfo(String id, String name) {
        String key() {
            return id == null || id.isBlank() ? name : id;
        }
    }

    private static final class GroupTotals {
        private final GroupInfo group;
        private final Set<String> paidDocuments = new java.util.HashSet<>();
        private double original;
        private double fees;
        private double discounts;
        private double received;
        private int records;

        private GroupTotals(GroupInfo group) {
            this.group = group;
        }

        private void add(double originalValue, double interest, double fine, double discount, double receivedValue, String documentKey) {
            records++;
            original = round(original + originalValue);
            fees = round(fees + interest + fine);
            discounts = round(discounts + discount);
            received = round(received + receivedValue);
            if (originalValue > 0) paidDocuments.add(documentKey);
        }

        private Map<String, Object> toRow(double totalOriginal) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("groupId", group.id());
            row.put("groupName", group.name());
            row.put("original", original);
            row.put("fees", fees);
            row.put("discounts", discounts);
            row.put("received", received);
            row.put("records", records);
            row.put("paidDocuments", paidDocuments.size());
            row.put("share", totalOriginal > 0 ? original / totalOriginal * 100 : 0);
            return row;
        }
    }
}
