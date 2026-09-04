package br.com.w4solution.controle_instalacao.dto.cobranca;

import br.com.w4solution.controle_instalacao.dto.rbx.BoletosAbertos;

import java.util.List;

public record CobrancaContratoRbxDTO(
        String numero,
        String plano,
        String situacao,
        List<BoletosAbertos> boletos
) {
}
