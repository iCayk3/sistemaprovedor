package br.com.w4solution.controle_instalacao.dto.olt;

import br.com.w4solution.controle_instalacao.domain.olt.Cto;

public record CtoDTO(Long id, String label, Integer portas, String lat, String longi) {
    public CtoDTO(Cto cto) {
        this(cto.getId(), cto.getNomeCto(), cto.getPortas().size(), cto.getLat(), cto.getLongi());
    }
}
