package br.com.w4solution.controle_instalacao.dto.whatsapp;

import br.com.w4solution.controle_instalacao.domain.whatsapp.ProvedorWhatsapp;

public record SalvarWhatsappConfiguracaoDTO(
        ProvedorWhatsapp provedor, boolean ativo, String evolutionUrl,
        String evolutionInstancia, String evolutionApiKey, String webhookPublicUrl
) {}
