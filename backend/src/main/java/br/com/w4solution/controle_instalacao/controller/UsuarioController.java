package br.com.w4solution.controle_instalacao.controller;

import br.com.w4solution.controle_instalacao.domain.usuarios.Usuario;
import br.com.w4solution.controle_instalacao.dto.usuarios.*;
import br.com.w4solution.controle_instalacao.services.usuarios.UsuarioService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Arrays;

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
    public ResponseEntity<Void> logout(HttpServletResponse response) {
        // 1. Crie um novo cookie com o MESMO NOME do cookie do token.
        //    É crucial que o nome seja idêntico. Supondo que o nome seja "token".
        Cookie cookie = new Cookie("token", null); // O valor pode ser nulo ou vazio

        // 2. Defina a idade máxima do cookie para 0.
        //    Isso instrui o navegador a expirar e remover o cookie imediatamente.
        cookie.setMaxAge(0);

        // 3. (MUITO IMPORTANTE) Configure o caminho (path) do cookie.
        //    O caminho deve ser o MESMO que foi usado quando o cookie foi criado.
        //    Geralmente, é o caminho raiz "/". Se você não definir isso corretamente,
        //    o navegador não encontrará o cookie para apagar.
        cookie.setPath("/");

        // 4. (Opcional, mas recomendado) Se o cookie original era HttpOnly, o cookie de remoção também deve ser.
        cookie.setHttpOnly(true);

        // 5. (Opcional, mas recomendado) Se o cookie original era Secure, o cookie de remoção também deve ser.
        // cookie.setSecure(true);

        // 6. Adicione o cookie à resposta HTTP.
        //    O navegador receberá esta resposta e processará a instrução de apagar o cookie.
        response.addCookie(cookie);

        // 7. Retorne uma resposta de sucesso.
        return ResponseEntity.ok().build();
    }


    @GetMapping("/token/validar")
    public ResponseEntity<Void> validarToken() {
        return ResponseEntity.ok().build(); // já autenticado no filtro
    }

    @GetMapping("/me")
    public ResponseEntity<UsuarioDTO> me(@AuthenticationPrincipal Usuario usuario) {
        return ResponseEntity.ok(new UsuarioDTO(usuario));
    }

    @GetMapping("/pendentes")
    public ResponseEntity<?> listarPendentes(){
        var usuariosPendentes = service.buscarPendentes();
        return ResponseEntity.ok().body(usuariosPendentes);
    }

    @GetMapping("/notactivate")
    public ResponseEntity<?> listarNaoAtivos(){
        var usuariosPendentes = service.buscarNaoAtivos();
        return ResponseEntity.ok().body(usuariosPendentes);
    }

    @GetMapping()
    public ResponseEntity<?> listarAll(){
        var usuarios = service.buscarTodosUsuarios();
        return ResponseEntity.ok().body(usuarios);
    }

    @PutMapping("/senha")
    @Transactional
    public ResponseEntity<?> trocarSenha(@RequestBody TrocaSenhaDTO senhas, HttpServletRequest request){
        service.trocarSenha(senhas, request);
        return ResponseEntity.ok().build();
    }
    @PutMapping("/statuschange")
    @Transactional
    public ResponseEntity<?> alterarStatus(@RequestBody AlterarStatusDTO dados){
        service.alterarStatus(dados);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/levelchange")
    @Transactional
    public ResponseEntity<?> alterarPermissao(@RequestBody AlterarPermissao dados){
        service.alterarPermissao(dados);
        return ResponseEntity.ok().build();
    }

}
