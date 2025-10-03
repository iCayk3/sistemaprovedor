package br.com.w4solution.controle_instalacao.dto.evento;

import java.util.List;

public record ServicoPorUsuarioDiario(String usuario, List<TotalAtividadeDTO> atividades) {
}
