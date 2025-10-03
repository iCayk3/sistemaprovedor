package br.com.w4solution.controle_instalacao.dto.registro;

import br.com.w4solution.controle_instalacao.domain.registro.Procedimentos;

public record ProcedimentoDTO(Long id, String label, String cor) {
    public ProcedimentoDTO(Procedimentos p){
        this(p.getId(), p.getProcedimento(), p.getCor());
    }
}
