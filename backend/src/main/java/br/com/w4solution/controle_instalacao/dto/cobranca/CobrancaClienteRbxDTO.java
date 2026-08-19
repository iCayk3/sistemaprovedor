package br.com.w4solution.controle_instalacao.dto.cobranca;

import br.com.w4solution.controle_instalacao.dto.rbx.BoletosAbertos;
import br.com.w4solution.controle_instalacao.dto.rbx.ClienteFiltradoDTO;

public record CobrancaClienteRbxDTO(
        ClienteFiltradoDTO cliente,
        BoletosAbertos boleto
) {
}
