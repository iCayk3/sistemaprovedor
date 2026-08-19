package br.com.w4solution.controle_instalacao.services.usuarios;

import br.com.w4solution.controle_instalacao.domain.usuarios.Usuario;
import org.springframework.stereotype.Service;

@Service
public class AcessoIaChatService {
    public boolean permitido(Usuario usuario) {
        return usuario != null && usuario.possuiAcessoIaChat();
    }
}
