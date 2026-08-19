package br.com.w4solution.controle_instalacao.domain.whatsapp;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Entity
@Table(name = "whatsapp_configuracao")
@Getter
@NoArgsConstructor
public class WhatsappConfiguracao {
    @Id
    private Long id = 1L;
    @Enumerated(EnumType.STRING)
    private ProvedorWhatsapp provedor = ProvedorWhatsapp.EVOLUTION;
    private boolean ativo;
    private String evolutionUrl;
    private String evolutionInstancia;
    private String webhookPublicUrl;
    @Column(length = 500)
    private String evolutionApiKey;
    @Column(nullable = false, unique = true)
    private String webhookToken = UUID.randomUUID().toString();

    public void atualizar(ProvedorWhatsapp provedor, boolean ativo, String url, String instancia, String apiKey, String webhookPublicUrl) {
        this.provedor = provedor == null ? ProvedorWhatsapp.EVOLUTION : provedor;
        this.ativo = ativo;
        this.evolutionUrl = url == null ? null : url.trim().replaceAll("/+$", "");
        this.evolutionInstancia = instancia == null ? null : instancia.trim();
        this.webhookPublicUrl = webhookPublicUrl == null ? null : webhookPublicUrl.trim();
        if (apiKey != null && !apiKey.isBlank() && !"********".equals(apiKey)) {
            this.evolutionApiKey = apiKey.trim();
        }
    }
}
