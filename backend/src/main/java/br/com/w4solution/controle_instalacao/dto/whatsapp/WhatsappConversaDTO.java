package br.com.w4solution.controle_instalacao.dto.whatsapp;

import java.time.Instant;

public record WhatsappConversaDTO(
        Long id, String numero, String nome, String ultimaMensagem, Instant atualizadaEm, long naoLidas
) {}
