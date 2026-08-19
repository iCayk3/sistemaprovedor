package br.com.w4solution.controle_instalacao.dto.whatsapp;

import br.com.w4solution.controle_instalacao.domain.whatsapp.ProvedorWhatsapp;
import br.com.w4solution.controle_instalacao.domain.whatsapp.WhatsappConfiguracao;

public record WhatsappConfiguracaoDTO(
        ProvedorWhatsapp provedor, boolean ativo, String evolutionUrl,
        String evolutionInstancia, String evolutionApiKey, String webhookToken, String webhookPublicUrl
) {
    public WhatsappConfiguracaoDTO(WhatsappConfiguracao config) {
        this(config.getProvedor(), config.isAtivo(), config.getEvolutionUrl(), config.getEvolutionInstancia(),
                config.getEvolutionApiKey() == null ? "" : "********", config.getWebhookToken(), config.getWebhookPublicUrl());
    }
}
