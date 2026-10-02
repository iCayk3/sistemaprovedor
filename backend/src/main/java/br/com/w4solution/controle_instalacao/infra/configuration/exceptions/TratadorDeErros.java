package br.com.w4solution.controle_instalacao.infra.configuration.exceptions;

import br.com.w4solution.controle_instalacao.validations.ValidacaoCtoException;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.transaction.UnexpectedRollbackException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class TratadorDeErros {

    private static final Logger log = LoggerFactory.getLogger(TratadorDeErros.class);

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<?> tratarErro404() {
        return ResponseEntity.notFound().build();
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> tratarErro400(MethodArgumentNotValidException ex) {
        var erros = ex.getFieldErrors();
        return ResponseEntity.badRequest().body(erros.stream().map(DadosErroValidacao::new).toList());
    }

    @ExceptionHandler(UsuarioNaoEncontradoException.class)
    public ResponseEntity<?> erroAtivacao(UsuarioNaoEncontradoException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<?> tratarErroBadCredentials() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Credenciais inválidas");
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<?> tratarErroAuthentication() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Falha na autenticação");
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<?> tratarErroAcessoNegado() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Acesso negado");
    }

    @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
    public ResponseEntity<?> tratarErroRegraNegocio(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ex.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> tratarErro500(Exception ex) {
        log.error("Erro interno não tratado (500): ", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Ocorreu um erro interno no servidor. Por favor, tente novamente mais tarde.");
    }
    @ExceptionHandler(UnexpectedRollbackException.class)
    public ResponseEntity<?> erroCadastro(UnexpectedRollbackException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body("Erro: Usuario ou CPF ja está cadastrado");
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<?> erroCadastroLogin(DataIntegrityViolationException ex) {
        var mensagem = ex.getMostSpecificCause() == null
                ? ex.getMessage()
                : ex.getMostSpecificCause().getMessage();

        log.warn("Erro de integridade no banco de dados: {}", mensagem);

        if (mensagem != null && mensagem.toLowerCase().contains("usuarios_usuario")) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Erro: Usuario ja cadastrado!");
        }

        return ResponseEntity.status(HttpStatus.CONFLICT).body("Erro ao processar a requisição: restrição de integridade dos dados.");
    }
    @ExceptionHandler(ValidacaoAutenticacaoException.class)
    public ResponseEntity<?> erroLogin(ValidacaoAutenticacaoException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Usuario não está ativo");
    }

    @ExceptionHandler(SenhaValidacaoException.class)
    public ResponseEntity<?> erroTrocaSenha(SenhaValidacaoException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ex.getMessage());
    }

    @ExceptionHandler(ValidacaoCtoException.class)
    public ResponseEntity<?> ctoNaoEncontrada(ValidacaoCtoException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
    }

    @ExceptionHandler(ProcedimentoException.class)
    public ResponseEntity<?> procedimentoNaoEncontrado(ProcedimentoException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
    }

    private record DadosErroValidacao(String campo, String mensagem) {
        public DadosErroValidacao(FieldError erro) {
            this(erro.getField(), erro.getDefaultMessage());
        }
    }
}
