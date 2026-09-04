package br.com.w4solution.controle_instalacao.dto.cobranca;

import br.com.w4solution.controle_instalacao.dto.rbx.ClienteFiltradoDTO;

import java.util.List;

public record CobrancaClienteRbxDTO(
        ClienteFiltradoDTO cliente,
        List<CobrancaContratoRbxDTO> contratos
) {
}
