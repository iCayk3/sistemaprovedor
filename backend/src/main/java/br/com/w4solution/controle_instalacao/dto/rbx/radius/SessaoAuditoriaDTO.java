package br.com.w4solution.controle_instalacao.dto.rbx.radius;

public record SessaoAuditoriaDTO(
        String customerId,
        String clienteNome,
        String clienteCpfCnpj,
        String clienteGrupo,
        String clienteSituacao,
        String username,
        String startTime,
        String stopTime,
        Long sessionTimeSeconds,
        String duracaoFormatada,
        String ipAddress,
        String ipv6Address,
        String delegatedIpv6Prefix,
        String mac,
        String nas,
        String terminateCause,
        String terminateCauseDescricao,
        String downloadFormatado,
        String uploadFormatado,
        boolean ativaNoMomento
) {}
