package br.com.w4solution.controle_instalacao.dto.rbx;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record AtendimentoOsDTO(
        String numero,
        String protocolo,
        String aberturaDataHora,
        String encerramentoDataHora,
        Long duracaoMinutos,
        String duracaoFormatada,
        String aberturaUsuario,
        String tecnico,
        String situacaoOs,
        String situacaoOsDescricao,
        String topico,
        String assunto,
        String solucao,
        String causa,
        String codigoCliente,
        String tipoCliente,
        String tipo
) {
}
