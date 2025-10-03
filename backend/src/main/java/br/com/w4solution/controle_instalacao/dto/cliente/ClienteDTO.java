package br.com.w4solution.controle_instalacao.dto.cliente;

import br.com.w4solution.controle_instalacao.domain.cliente.Cliente;
import br.com.w4solution.controle_instalacao.domain.olt.Porta;

import java.util.List;

public record ClienteDTO(Long id, String nome, List<Porta> porta) {
    public ClienteDTO(Cliente dados) {
        this(dados.getId(), dados.getNome(), dados.getPortas());
    }
}
