package br.com.w4solution.controle_instalacao.dto.noc;

import java.time.LocalDateTime;

public record NocEventoCadastroDTO(
        String origem,
        String tipoEvento,
        String tecnico,
        String cliente,
        String cidade,
        String bairro,
        LocalDateTime inicio,
        LocalDateTime fim,
        String statusProblema,
        String observacoes
) {
}
