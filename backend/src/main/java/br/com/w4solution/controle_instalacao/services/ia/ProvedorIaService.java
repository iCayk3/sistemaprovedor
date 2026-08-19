package br.com.w4solution.controle_instalacao.services.ia;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.Set;

@Service
public class ProvedorIaService {
    private static final Set<String> PROVEDORES = Set.of("openai", "gemini");

    private final OpenAiService openAiService;
    private final GeminiService geminiService;
    private final String provedor;

    public ProvedorIaService(
            OpenAiService openAiService,
            GeminiService geminiService,
            @Value("${ia.provider:gemini}") String provedor
    ) {
        this.openAiService = openAiService;
        this.geminiService = geminiService;
        this.provedor = normalizar(provedor);
    }

    public String provedor() {
        return provedor;
    }

    public boolean configurado() {
        return switch (provedor) {
            case "openai" -> openAiService.configurado();
            case "gemini" -> geminiService.configurado();
            default -> false;
        };
    }

    public String modelo() {
        return switch (provedor) {
            case "openai" -> openAiService.modelo();
            case "gemini" -> geminiService.modelo();
            default -> throw provedorInvalido();
        };
    }

    public String responder(String instrucoes, String entrada) {
        return switch (provedor) {
            case "openai" -> openAiService.responder(instrucoes, entrada);
            case "gemini" -> geminiService.responder(instrucoes, entrada);
            default -> throw provedorInvalido();
        };
    }

    private String normalizar(String valor) {
        String normalizado = valor == null ? "" : valor.trim().toLowerCase(Locale.ROOT);
        if (!PROVEDORES.contains(normalizado)) {
            throw new IllegalArgumentException(
                    "Provedor de IA invalido: '" + valor + "'. Use openai ou gemini."
            );
        }
        return normalizado;
    }

    private IllegalStateException provedorInvalido() {
        return new IllegalStateException("Provedor de IA invalido: " + provedor);
    }
}
