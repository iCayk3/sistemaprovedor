package br.com.w4solution.controle_instalacao.dto.evento;

import br.com.w4solution.controle_instalacao.dto.rbx.ContratoRbxDTO;

public record ContratoLeadRbxDTO(String numero, String plano, Double valor, String situacao) {
    public ContratoLeadRbxDTO(ContratoRbxDTO contrato, Double valor) {
        this(contrato.numero(), contrato.planoDescricao(), valor, contrato.situacaoDescricao());
    }
}
