package br.com.w4solution.controle_instalacao.dto.ia;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record IaMensagemDTO(
        @NotBlank @Size(max = 4000) String mensagem,
        @Size(max = 80) String sessao
) {
}
