package br.com.w4solution.controle_instalacao.services.rbx;

import br.com.w4solution.controle_instalacao.dto.rbx.ClienteFiltradoDTO;
import br.com.w4solution.controle_instalacao.dto.rbx.radius.*;
import com.fasterxml.jackson.core.type.TypeReference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class AuditoriaIpService {
    private static final Logger log = LoggerFactory.getLogger(AuditoriaIpService.class);
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private final IntegracaoRbxV2 integracaoRbxV2;
    private final ServiceRbx serviceRbx;

    public AuditoriaIpService(IntegracaoRbxV2 integracaoRbxV2, ServiceRbx serviceRbx) {
        this.integracaoRbxV2 = integracaoRbxV2;
        this.serviceRbx = serviceRbx;
    }

    public RespostaAuditoriaIpDTO auditarIp(ConsultaAuditoriaIpDTO consulta) throws Exception {
        if (consulta.ip() == null || consulta.ip().isBlank()) {
            throw new IllegalArgumentException("O endereço IP é obrigatório para a consulta.");
        }

        String ipAlvo = consulta.ip().trim();

        // Determina janela de pesquisa no Radius
        String inicioStr;
        String fimStr;
        LocalDateTime momentoExato = null;
        LocalDateTime agora = LocalDateTime.now();

        if (consulta.dataInicio() != null && !consulta.dataInicio().isBlank()
                && consulta.dataFim() != null && !consulta.dataFim().isBlank()) {
            inicioStr = normalizarDataHora(consulta.dataInicio().trim(), true);
            fimStr = normalizarDataHora(consulta.dataFim().trim(), false);
        } else if (consulta.data() != null) {
            LocalDate data = consulta.data();
            if (consulta.hora() != null) {
                momentoExato = LocalDateTime.of(data, consulta.hora());
                // Inicia 1 dia antes e vai até 2 dias depois para cobrir conexões de longa duração que estavam ativas
                inicioStr = data.minusDays(1).atStartOfDay().format(DATE_TIME_FORMATTER);
                LocalDateTime fimCalculado = data.plusDays(2).atTime(LocalTime.MAX);
                fimStr = (fimCalculado.isAfter(agora) ? agora : fimCalculado).format(DATE_TIME_FORMATTER);
            } else {
                inicioStr = data.atStartOfDay().format(DATE_TIME_FORMATTER);
                LocalDateTime fimCalculado = data.plusDays(2).atTime(LocalTime.MAX);
                fimStr = (fimCalculado.isAfter(agora) ? agora : fimCalculado).format(DATE_TIME_FORMATTER);
            }
        } else {
            LocalDate hoje = LocalDate.now();
            inicioStr = hoje.atStartOfDay().format(DATE_TIME_FORMATTER);
            fimStr = agora.format(DATE_TIME_FORMATTER);
        }

        log.info("[Auditoria IP] Consultando IP '{}' no RBX de '{}' até '{}'...", ipAlvo, inicioStr, fimStr);

        String body = """
                {
                   "radius_extract": {
                      "ipaddress": "%s",
                      "start_time": "%s",
                      "stop_time": "%s"
                   }
                }
                """.formatted(ipAlvo, inicioStr, fimStr);

        long t0 = System.currentTimeMillis();
        List<RadiusExtractItemDTO> todasSessoes = integracaoRbxV2.fazerRequest(
                body,
                new TypeReference<RespostaAPI<RadiusExtractItemDTO>>() {}
        );
        long t1 = System.currentTimeMillis();
        log.info("[Auditoria IP] RBX respondeu em {} ms com {} registros totais.", (t1 - t0), todasSessoes.size());

        final LocalDateTime momentoFinal = momentoExato;
        List<SessaoAuditoriaDTO> sessoesFiltradas = new ArrayList<>();
        Map<Long, ClienteFiltradoDTO> cacheClientes = new HashMap<>();

        for (RadiusExtractItemDTO item : todasSessoes) {
            // Filtro estrito por IP ou IPv6
            boolean ipMatch = ipAlvo.equalsIgnoreCase(Optional.ofNullable(item.ipAddress()).orElse("").trim())
                    || ipAlvo.equalsIgnoreCase(Optional.ofNullable(item.ipv6Address()).orElse("").trim())
                    || ipAlvo.equalsIgnoreCase(Optional.ofNullable(item.delegatedIpv6Prefix()).orElse("").trim());

            if (!ipMatch) {
                continue;
            }

            LocalDateTime inicioSessao = parseDataHora(item.startTime());
            LocalDateTime fimSessao = parseDataHora(item.stopTime());

            // Se for pesquisa por dia específico sem hora, filtra sessões que intersectaram com aquele dia
            if (consulta.data() != null && consulta.hora() == null && inicioSessao != null) {
                LocalDateTime inicioDia = consulta.data().atStartOfDay();
                LocalDateTime fimDia = consulta.data().atTime(LocalTime.MAX);
                boolean intersecao = !inicioSessao.isAfter(fimDia)
                        && (fimSessao == null || !fimSessao.isBefore(inicioDia));
                if (!intersecao) {
                    continue;
                }
            }

            // Avalia se estava ativa no momento especificado
            boolean ativaNoMomento = true;
            if (momentoFinal != null && inicioSessao != null) {
                ativaNoMomento = !momentoFinal.isBefore(inicioSessao)
                        && (fimSessao == null || !momentoFinal.isAfter(fimSessao));
            }

            // Enriquecimento cadastral via RBX
            String nomeCliente = "Não identificado";
            String cpfCnpj = "Não informado";
            String grupo = "Não informado";
            String situacao = "Não informada";

            if (item.customerId() != null && !item.customerId().isBlank()) {
                try {
                    Long custId = Long.parseLong(item.customerId().trim());
                    ClienteFiltradoDTO cliente = cacheClientes.computeIfAbsent(custId, id -> {
                        try {
                            List<ClienteFiltradoDTO> lista = serviceRbx.buscarClienteId(id);
                            return (lista != null && !lista.isEmpty()) ? lista.get(0) : null;
                        } catch (Exception e) {
                            return null;
                        }
                    });

                    if (cliente != null) {
                        nomeCliente = cliente.nome();
                        cpfCnpj = cliente.cpfCnpj();
                        grupo = cliente.grupoNome() != null ? cliente.grupoNome() : cliente.grupo();
                        situacao = cliente.situacao();
                    }
                } catch (NumberFormatException ignored) {}
            }

            long sessionSec = parseLong(item.sessionTime());
            long downBytes = parseLong(item.octetsOutput());
            long upBytes = parseLong(item.octetsInput());

            sessoesFiltradas.add(new SessaoAuditoriaDTO(
                    item.customerId(),
                    nomeCliente,
                    cpfCnpj,
                    grupo,
                    situacao,
                    item.username(),
                    item.startTime(),
                    item.stopTime(),
                    sessionSec,
                    formatarDuracao(sessionSec),
                    item.ipAddress(),
                    item.ipv6Address(),
                    item.delegatedIpv6Prefix(),
                    item.mac(),
                    item.nas(),
                    item.terminateCause(),
                    traduzirTerminateCause(item.terminateCause()),
                    formatarBytes(downBytes),
                    formatarBytes(upBytes),
                    ativaNoMomento
            ));
        }

        // Ordena: ativas no momento primeiro, e depois decrescente por data de início
        sessoesFiltradas.sort((a, b) -> {
            if (a.ativaNoMomento() != b.ativaNoMomento()) {
                return a.ativaNoMomento() ? -1 : 1;
            }
            return Objects.compare(b.startTime(), a.startTime(), Comparator.nullsLast(Comparator.naturalOrder()));
        });

        log.info("[Auditoria IP] Filtradas {} sessões correspondentes para o IP '{}'.", sessoesFiltradas.size(), ipAlvo);

        return new RespostaAuditoriaIpDTO(
                ipAlvo,
                inicioStr + " até " + fimStr,
                sessoesFiltradas.size(),
                sessoesFiltradas
        );
    }

    private static String normalizarDataHora(String str, boolean isInicio) {
        if (str.length() == 10) {
            return isInicio ? str + " 00:00:00" : str + " 23:59:59";
        }
        return str;
    }

    private static LocalDateTime parseDataHora(String str) {
        if (str == null || str.isBlank()) return null;
        try {
            return LocalDateTime.parse(str.trim(), DATE_TIME_FORMATTER);
        } catch (Exception e) {
            return null;
        }
    }

    private static long parseLong(String str) {
        if (str == null || str.isBlank()) return 0L;
        try {
            return Long.parseLong(str.trim());
        } catch (Exception e) {
            return 0L;
        }
    }

    private static String formatarDuracao(long seconds) {
        if (seconds <= 0) return "0s";
        long horas = seconds / 3600;
        long minutos = (seconds % 3600) / 60;
        long segs = seconds % 60;
        if (horas > 0) {
            return "%dh %02dm %02ds".formatted(horas, minutos, segs);
        } else if (minutos > 0) {
            return "%dm %02ds".formatted(minutos, segs);
        } else {
            return "%ds".formatted(segs);
        }
    }

    private static String formatarBytes(long bytes) {
        if (bytes <= 0) return "0 B";
        if (bytes < 1024) return bytes + " B";
        double kb = bytes / 1024.0;
        if (kb < 1024) return "%.2f KB".formatted(kb);
        double mb = kb / 1024.0;
        if (mb < 1024) return "%.2f MB".formatted(mb);
        double gb = mb / 1024.0;
        if (gb < 1024) return "%.2f GB".formatted(gb);
        double tb = gb / 1024.0;
        return "%.2f TB".formatted(tb);
    }

    private static String traduzirTerminateCause(String cause) {
        if (cause == null || cause.isBlank()) return "Conexão ativa / Desconhecida";
        return switch (cause.trim()) {
            case "User-Request" -> "Desconexão solicitada pelo usuário / reinício do roteador";
            case "Lost-Carrier" -> "Perda de sinal / portadora (cabo/fibra rompida ou ONU desligada)";
            case "Lost-Service" -> "Serviço perdido";
            case "Idle-Timeout" -> "Tempo ocioso expirado";
            case "Session-Timeout" -> "Tempo limite de sessão atingido";
            case "Admin-Reset" -> "Reset manual pelo administrador";
            case "Admin-Reboot" -> "Reboot do concentrador (NAS)";
            case "Port-Error" -> "Erro na porta do concentrador";
            case "NAS-Request" -> "Desconectado a pedido do NAS";
            case "NAS-Reboot" -> "Concentrador reiniciado";
            case "NAS-Error" -> "Erro no concentrador";
            default -> cause;
        };
    }
}
