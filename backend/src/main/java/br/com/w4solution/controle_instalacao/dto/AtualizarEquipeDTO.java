package br.com.w4solution.controle_instalacao.dto;

import br.com.w4solution.controle_instalacao.dto.tecnico.EquipeDTO;
import br.com.w4solution.controle_instalacao.dto.tecnico.TecnicoDTO;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record AtualizarEquipeDTO(List<EquipeDTO> nomeEquipe, List<TecnicoDTO> tecnicos) {
}
