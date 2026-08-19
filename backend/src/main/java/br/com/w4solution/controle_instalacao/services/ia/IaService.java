package br.com.w4solution.controle_instalacao.services.ia;

import br.com.w4solution.controle_instalacao.dto.ia.IaRespostaDTO;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;

@Service
public class IaService {
    private static final String REGRAS =
            "Voce e a assistente interna da SOL Provedor. Responda em portugues do Brasil. " +
            "Nao invente dados, protocolos, valores, prazos ou politicas. " +
            "Nao solicite senhas, tokens, dados bancarios ou documentos completos. " +
            "Quando nao houver informacao suficiente, diga isso e indique o setor humano adequado. " +
            "Nao afirme que executou alteracoes: voce apenas orienta e analisa.";

    private final ProvedorIaService provedorIaService;
    private final IaContextoService contextoService;
    private final ObjectMapper objectMapper;

    public IaService(ProvedorIaService provedorIaService, IaContextoService contextoService, ObjectMapper objectMapper) {
        this.provedorIaService = provedorIaService;
        this.contextoService = contextoService;
        this.objectMapper = objectMapper;
    }

    public IaRespostaDTO atendimento(String mensagem) {
        String instrucoes = REGRAS +
                " Atue como atendente virtual: seja cordial, direto e ofereca passos praticos. " +
                "Para falha total, risco eletrico, cabo rompido ou incidente de rede, recomende encaminhamento ao NOC.";
        return executar("atendimento", instrucoes, mensagem);
    }

    public IaRespostaDTO analisar(String pergunta) {
        Map<String, Object> resumo = contextoService.resumo();
        String entrada;
        try {
            entrada = "Indicadores atuais do sistema (dados agregados):\n" +
                    objectMapper.writeValueAsString(resumo) +
                    "\n\nPergunta do usuario:\n" + pergunta;
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Falha ao preparar os indicadores para analise.", exception);
        }
        String instrucoes = REGRAS +
                " Atue como analista de dados. Use somente os indicadores fornecidos. " +
                "Diferencie fatos de inferencias, destaque limitacoes e sugira proximas metricas quando necessario.";
        return executar("analise", instrucoes, entrada);
    }

    private IaRespostaDTO executar(String modo, String instrucoes, String entrada) {
        String resposta = provedorIaService.responder(instrucoes, entrada);
        return new IaRespostaDTO(resposta, modo, provedorIaService.modelo(), Instant.now());
    }
}
