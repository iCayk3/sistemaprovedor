package br.com.w4solution.controle_instalacao.dto.usuarios;

import br.com.w4solution.controle_instalacao.domain.usuarios.Status;
import br.com.w4solution.controle_instalacao.domain.usuarios.UserRole;
import br.com.w4solution.controle_instalacao.domain.usuarios.Usuario;

public record UsuarioDTO(Long id, String usuario, UserRole role, Status status, boolean recursosIaChatHabilitados,
                         boolean supervisor, String usuarioRbx, boolean chaveApiRbxConfigurada) {
    public UsuarioDTO (Usuario usr){
        this(usr.getId(), usr.getUsuario(), usr.getPermissao(), usr.getStatus(), usr.possuiAcessoIaChat(), usr.isSupervisor(),
                usr.getUsuarioRbx(), usr.getChaveApiRbxCriptografada() != null && !usr.getChaveApiRbxCriptografada().isBlank());
    }
}
