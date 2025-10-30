package br.com.w4solution.controle_instalacao.dto.usuarios;

import br.com.w4solution.controle_instalacao.domain.usuarios.RedefinirSenha;
import br.com.w4solution.controle_instalacao.domain.usuarios.Status;

public record RedefinirSenhaSolDTO(Long id, String usuario, Status status) {
    public RedefinirSenhaSolDTO(RedefinirSenha dados){
        this(dados.getId(), dados.getUsuario(), dados.getStatus());
    }
}
