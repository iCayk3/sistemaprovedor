package br.com.w4solution.controle_instalacao.infra.configuration.exceptions;

public class SenhaValidacaoException extends RuntimeException{
    public SenhaValidacaoException(String message) {
        super(message);
    }
}
