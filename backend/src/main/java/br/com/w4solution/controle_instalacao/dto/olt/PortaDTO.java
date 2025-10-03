package br.com.w4solution.controle_instalacao.dto.olt;

import br.com.w4solution.controle_instalacao.domain.olt.Porta;

public record PortaDTO(Long id, Integer label, Integer codigo) {
    public PortaDTO(Porta porta) {
        this(
                porta.getId(),
                porta.getPorta(),
                porta.getCliente() != null ? porta.getCliente().getCodigo() : null
        );
    }
}
