package br.com.w4solution.controle_instalacao.dto.olt;

import br.com.w4solution.controle_instalacao.domain.olt.Cto;
import br.com.w4solution.controle_instalacao.dto.rbx.ClienteFiltradoDTO;

import java.util.List;

public record CtoComPortasDTO(Long id, String label, String lat, String longi) {

}
