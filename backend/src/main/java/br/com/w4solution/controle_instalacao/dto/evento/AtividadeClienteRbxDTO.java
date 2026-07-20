package br.com.w4solution.controle_instalacao.dto.evento;

public record AtividadeClienteRbxDTO(
        Integer codigoCliente,
        String cliente,
        String grupoCliente,
        String plano,
        Double valorPlano
) {
}
