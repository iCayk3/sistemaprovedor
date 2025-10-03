package br.com.w4solution.controle_instalacao.dto.tecnico;

import br.com.w4solution.controle_instalacao.domain.tecnico.EquipeTecnica;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public record EquipeDTO(Long id, String label, List<TecnicoDTO> tecnicos) {
    public EquipeDTO(EquipeTecnica equipe) {
        this(equipe.getId(), equipe.getNomeEquipe(), equipe.getTecnicos().stream().map(TecnicoDTO::new).toList());
    }
}
