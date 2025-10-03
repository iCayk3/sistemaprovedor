package br.com.w4solution.controle_instalacao.dto.tecnico;

import java.util.List;

public record cadastrarTecnicoDTO(Long nomeEquipe, List<TecnicoDTO> tecnicos) {
}
