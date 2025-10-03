package br.com.w4solution.controle_instalacao.services.usuarios;

import br.com.w4solution.controle_instalacao.domain.usuarios.Status;
import br.com.w4solution.controle_instalacao.domain.usuarios.Usuario;
import br.com.w4solution.controle_instalacao.dto.usuarios.*;
import br.com.w4solution.controle_instalacao.infra.configuration.exceptions.UsuarioException;
import br.com.w4solution.controle_instalacao.infra.configuration.exceptions.UsuarioNaoEncontradoException;
import br.com.w4solution.controle_instalacao.infra.configuration.exceptions.ValidacaoAutenticacaoException;
import br.com.w4solution.controle_instalacao.repository.usuarios.UsuarioRepository;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseCookie;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;

@Service
public class UsuarioService {

    @Autowired
    private UsuarioRepository repository;

    @Autowired
    private AuthenticationManager manager;

    @Autowired
    private TokenService service;

    public UsuarioDTO cadastrarUsuario(UsuarioCadastroDTO dados) {
        var usuario = new Usuario(dados);
        repository.save(usuario);
        return new UsuarioDTO(usuario);
    }

    public void ativarCliente(Long id) {
        var usuario = repository.findById(id);
        if (usuario.isEmpty()) {
            throw new UsuarioNaoEncontradoException("Usuario não encontrado");
        }
        usuario.get().setStatus(Status.ATIVO);
    }

    public DadosToken logar(DadosAutenticao dados, HttpServletResponse response) {
        var authenticationToken = new UsernamePasswordAuthenticationToken(dados.usuario(), dados.senha());
        var authentication = manager.authenticate(authenticationToken);
        var user = (Usuario) authentication.getPrincipal();

        if (user.getStatus() != Status.ATIVO) {
            throw new ValidacaoAutenticacaoException("Usuario não está ativo");
        }

        String token = service.gerarToken(user);

        // Cookie seguro com SameSite e HttpOnly
        var cookie = ResponseCookie.from("token", token)
                .httpOnly(true)
//                .secure(true) // use true se o app estiver em HTTPS
                .path("/")
                .sameSite("Lax") // ou "Strict" para mais segurança
                .maxAge(Duration.ofHours(4))
                .build();

        response.addHeader("Set-Cookie", cookie.toString());

        return new DadosToken(new UsuarioDTO(user), null); // não precisa retornar o token mais
    }

    public List<UsuarioDTO> buscarPendentes() {

        return repository.findAllByStatus(Status.PENDENTE).stream().map(UsuarioDTO::new).toList();
    }

    public void trocarSenha(TrocaSenhaDTO senhas, HttpServletRequest request) {

        Cookie[] cookies = request.getCookies();
        String token = null;
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("token".equals(cookie.getName())) {
                    token = cookie.getValue();
                    break;
                }
            }
        } else {
            System.out.println("Nenhum cookie encontrado.");
        }

        var subjetc = service.getSubject(token);
        var usuario = repository.findByUsuario(subjetc);
        if(usuario.isEmpty()){
            throw new UsuarioNaoEncontradoException("Usuario não encontrado");
        }
        var user = usuario.get();
        user.trocarSenha(senhas);
    }

    public List<UsuarioDTO> buscarNaoAtivos() {
        return repository.findAllByStatusNot(Status.ATIVO).stream().map(UsuarioDTO::new).toList();
    }

    public List<UsuarioDTO> buscarTodosUsuarios() {
        return repository.findAll().stream().map(UsuarioDTO::new).toList();
    }

    public void alterarStatus(AlterarStatusDTO dados) {
        var optionaluser = repository.findById(dados.id());
        if(optionaluser.isPresent()){
            var user = optionaluser.get();
            user.alterarStatus(dados.status());
        } else {
            throw new UsuarioException("Usuario não encontrado");
        }
    }

    public void alterarPermissao(AlterarPermissao dados) {
        var optionaluser = repository.findById(dados.id());
        if(optionaluser.isPresent()){
            var user = optionaluser.get();
            user.alterarCliente(dados.role());
        } else {
            throw new UsuarioException("Usuario não encontrado");
        }
    }
}
