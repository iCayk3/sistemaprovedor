package br.com.w4solution.controle_instalacao.controller;

import br.com.w4solution.controle_instalacao.domain.usuarios.Usuario;
import br.com.w4solution.controle_instalacao.dto.usuarios.AlterarPermissao;
import br.com.w4solution.controle_instalacao.dto.usuarios.AlterarStatusDTO;
import br.com.w4solution.controle_instalacao.dto.usuarios.DadosAutenticao;
import br.com.w4solution.controle_instalacao.dto.usuarios.DadosToken;
import br.com.w4solution.controle_instalacao.dto.usuarios.RedefinirSenhaDTO;
import br.com.w4solution.controle_instalacao.dto.usuarios.TrocaSenhaDTO;
import br.com.w4solution.controle_instalacao.dto.usuarios.UsuarioCadastroDTO;
import br.com.w4solution.controle_instalacao.dto.usuarios.UsuarioCheckDTO;
import br.com.w4solution.controle_instalacao.dto.usuarios.UsuarioDTO;
import br.com.w4solution.controle_instalacao.services.usuarios.UsuarioService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;

import static br.com.w4solution.controle_instalacao.infra.configuration.security.SecurityExpressions.ADMIN_ONLY;
import static br.com.w4solution.controle_instalacao.infra.configuration.security.SecurityExpressions.AUTHENTICATED;

@RestController
@RequestMapping("usuario")
public class UsuarioController {

    @Autowired
    private UsuarioService service;

    @PostMapping
    @Transactional
    public ResponseEntity<?> cadastrarUsuario(@RequestBody UsuarioCadastroDTO dados, UriComponentsBuilder uri) {
        var usuario = service.cadastrarUsuario(dados);
        var path = uri.path("/{id}").buildAndExpand(usuario.id()).toUri();
        return ResponseEntity.created(path).body(usuario);
    }

    @PostMapping("ativar/{id}")
    @Transactional
    @PreAuthorize(ADMIN_ONLY)
    public ResponseEntity<?> ativadorUsuario(@PathVariable Long id) {
        service.ativarCliente(id);
        return ResponseEntity.ok().body("Usuario ativado");
    }

    @PostMapping("/logar")
    public ResponseEntity<DadosToken> logar(@RequestBody DadosAutenticao dados, HttpServletResponse response) {
        var token = service.logar(dados, response);
        return ResponseEntity.ok(token);
    }

    @PostMapping("/logout")
    @PreAuthorize(AUTHENTICATED)
    public ResponseEntity<Void> logout(HttpServletResponse response) {
        Cookie cookie = new Cookie("token", null);
        cookie.setMaxAge(0);
        cookie.setPath("/");
        cookie.setHttpOnly(true);
        response.addCookie(cookie);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/userchek")
    public ResponseEntity<?> validarUsuario(@RequestBody UsuarioCheckDTO dados) {
        var ativado = service.checarUsuarioExistente(dados.usuario());
        return ResponseEntity.ok().body(ativado);
    }

    @GetMapping("/token/validar")
    @PreAuthorize(AUTHENTICATED)
    public ResponseEntity<Void> validarToken() {
        return ResponseEntity.ok().build();
    }

    @GetMapping("/me")
    @PreAuthorize(AUTHENTICATED)
    public ResponseEntity<UsuarioDTO> me(@AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(new UsuarioDTO(usuario));
    }

    @GetMapping("/pendentes")
    @PreAuthorize(ADMIN_ONLY)
    public ResponseEntity<?> listarPendentes() {
        var usuariosPendentes = service.buscarPendentes();
        return ResponseEntity.ok().body(usuariosPendentes);
    }

    @GetMapping("/pendentes/redefinicoes")
    @PreAuthorize(ADMIN_ONLY)
    public ResponseEntity<?> listaRedefinicoesPendentes() {
        var usuariosPendentes = service.buscarRedefinicoesPendentes();
        return ResponseEntity.ok().body(usuariosPendentes);
    }

    @GetMapping("/notactivate")
    @PreAuthorize(ADMIN_ONLY)
    public ResponseEntity<?> listarNaoAtivos() {
        var usuariosPendentes = service.buscarNaoAtivos();
        return ResponseEntity.ok().body(usuariosPendentes);
    }

    @GetMapping
    @PreAuthorize(ADMIN_ONLY)
    public ResponseEntity<?> listarAll() {
        var usuarios = service.buscarTodosUsuarios();
        return ResponseEntity.ok().body(usuarios);
    }

    @PostMapping("/solicitaredefinirsenha")
    public ResponseEntity<?> solicitarRedefinirSenha(@RequestBody RedefinirSenhaDTO dados) {
        service.solicitarRedefinirSenha(dados);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/redefinirsenha")
    @Transactional
    @PreAuthorize(ADMIN_ONLY)
    public ResponseEntity<?> redefinirSenha(@RequestBody RedefinirSenhaDTO dados, HttpServletRequest request) {
        service.redefinirSenha(dados, request);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/senha")
    @Transactional
    @PreAuthorize(AUTHENTICATED)
    public ResponseEntity<?> trocarSenha(@RequestBody TrocaSenhaDTO senhas, HttpServletRequest request) {
        service.trocarSenha(senhas, request);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/statuschange")
    @Transactional
    @PreAuthorize(ADMIN_ONLY)
    public ResponseEntity<?> alterarStatus(@RequestBody AlterarStatusDTO dados) {
        service.alterarStatus(dados);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/levelchange")
    @Transactional
    @PreAuthorize(ADMIN_ONLY)
    public ResponseEntity<?> alterarPermissao(@RequestBody AlterarPermissao dados) {
        service.alterarPermissao(dados);
        return ResponseEntity.ok().build();
    }
}
