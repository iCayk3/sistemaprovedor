package br.com.w4solution.controle_instalacao.dto.tecnico;

import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record CadastroEquipeDTO(@NotBlank String nomeEquipe, List<TecnicoDTO> tecnicos) {
}
