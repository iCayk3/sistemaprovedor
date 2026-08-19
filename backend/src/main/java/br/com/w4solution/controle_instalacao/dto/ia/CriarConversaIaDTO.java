package br.com.w4solution.controle_instalacao.dto.ia;

import br.com.w4solution.controle_instalacao.domain.ia.ModoConversa;

public record CriarConversaIaDTO(ModoConversa modo) {
    public CriarConversaIaDTO {
        if (modo == null) modo = ModoConversa.ATENDIMENTO;
    }
}
