package br.com.w4solution.controle_instalacao.dto.olt;

import br.com.w4solution.controle_instalacao.dto.rbx.ClienteFiltradoDTO;

public record PortaDTORbx(Long id, Integer label, ClienteFiltradoDTO cliente, String login) {

}
