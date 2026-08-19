package br.com.w4solution.controle_instalacao.services.ia;

import br.com.w4solution.controle_instalacao.domain.ia.ConversaIa;
import br.com.w4solution.controle_instalacao.domain.ia.MensagemIa;
import br.com.w4solution.controle_instalacao.domain.ia.ModoConversa;
import br.com.w4solution.controle_instalacao.domain.ia.PapelMensagem;
import br.com.w4solution.controle_instalacao.domain.usuarios.Usuario;
import br.com.w4solution.controle_instalacao.dto.ia.ConversaIaDTO;
import br.com.w4solution.controle_instalacao.dto.ia.MensagemChatDTO;
import br.com.w4solution.controle_instalacao.dto.ia.RespostaMensagemChatDTO;
import br.com.w4solution.controle_instalacao.repository.ia.ConversaIaRepository;
import br.com.w4solution.controle_instalacao.repository.ia.MensagemIaRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ChatIaService {
    private static final int MAX_MENSAGENS_CONTEXTO = 20;

    private final ConversaIaRepository conversaRepository;
    private final MensagemIaRepository mensagemRepository;
    private final IaService iaService;

    public ChatIaService(
            ConversaIaRepository conversaRepository,
            MensagemIaRepository mensagemRepository,
            IaService iaService
    ) {
        this.conversaRepository = conversaRepository;
        this.mensagemRepository = mensagemRepository;
        this.iaService = iaService;
    }

    public List<ConversaIaDTO> listarConversas(Usuario usuario) {
        return conversaRepository.findByUsuarioIdOrderByAtualizadaEmDesc(usuario.getId())
                .stream().map(ConversaIaDTO::new).toList();
    }

    @Transactional
    public ConversaIaDTO criarConversa(Usuario usuario, ModoConversa modo) {
        return new ConversaIaDTO(conversaRepository.save(new ConversaIa(usuario, modo)));
    }

    public List<MensagemChatDTO> listarMensagens(Usuario usuario, Long conversaId) {
        buscarConversa(usuario, conversaId);
        return mensagemRepository.findByConversaIdOrderByCriadaEmAsc(conversaId)
                .stream().map(MensagemChatDTO::new).toList();
    }

    @Transactional
    public RespostaMensagemChatDTO enviar(Usuario usuario, Long conversaId, String texto) {
        ConversaIa conversa = buscarConversa(usuario, conversaId);
        mensagemRepository.save(new MensagemIa(conversa, PapelMensagem.USER, texto));
        conversa.registrarMensagem(texto);

        List<MensagemIa> historico = mensagemRepository.findByConversaIdOrderByCriadaEmAsc(conversaId);
        String entrada = montarContexto(historico);
        String resposta = conversa.getModo() == ModoConversa.ANALISE
                ? iaService.analisar(entrada).resposta()
                : iaService.atendimento(entrada).resposta();

        MensagemIa mensagemResposta = mensagemRepository.save(
                new MensagemIa(conversa, PapelMensagem.ASSISTANT, resposta)
        );
        conversa.registrarMensagem(null);
        conversaRepository.save(conversa);
        return new RespostaMensagemChatDTO(
                new MensagemChatDTO(mensagemResposta),
                new ConversaIaDTO(conversa)
        );
    }

    private ConversaIa buscarConversa(Usuario usuario, Long conversaId) {
        return conversaRepository.findByIdAndUsuarioId(conversaId, usuario.getId())
                .orElseThrow(() -> new IllegalArgumentException("Conversa nao encontrada."));
    }

    private String montarContexto(List<MensagemIa> mensagens) {
        int inicio = Math.max(0, mensagens.size() - MAX_MENSAGENS_CONTEXTO);
        StringBuilder contexto = new StringBuilder(
                "Considere o historico abaixo. Responda somente a ultima mensagem do usuario.\n\n"
        );
        for (MensagemIa mensagem : mensagens.subList(inicio, mensagens.size())) {
            contexto.append(mensagem.getPapel() == PapelMensagem.USER ? "USUARIO: " : "ASSISTENTE: ")
                    .append(mensagem.getConteudo())
                    .append("\n\n");
        }
        return contexto.toString();
    }
}
