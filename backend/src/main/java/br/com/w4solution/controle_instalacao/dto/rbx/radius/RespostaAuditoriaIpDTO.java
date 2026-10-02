package br.com.w4solution.controle_instalacao.dto.rbx.radius;

import java.util.List;

public record RespostaAuditoriaIpDTO(
        String ipBuscado,
        String periodoConsultado,
        int totalSessoesEncontradas,
        List<SessaoAuditoriaDTO> sessoes
) {}
