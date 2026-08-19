package br.com.w4solution.controle_instalacao.services.chat;

import br.com.w4solution.controle_instalacao.domain.chat.ChatConversa;
import br.com.w4solution.controle_instalacao.domain.chat.ChatMensagem;
import br.com.w4solution.controle_instalacao.domain.chat.ChatParticipante;
import br.com.w4solution.controle_instalacao.domain.usuarios.Status;
import br.com.w4solution.controle_instalacao.domain.usuarios.Usuario;
import br.com.w4solution.controle_instalacao.dto.chat.ChatConversaDTO;
import br.com.w4solution.controle_instalacao.dto.chat.ChatMensagemDTO;
import br.com.w4solution.controle_instalacao.dto.chat.ChatNotificacaoDTO;
import br.com.w4solution.controle_instalacao.dto.usuarios.UsuarioDTO;
import br.com.w4solution.controle_instalacao.repository.chat.ChatConversaRepository;
import br.com.w4solution.controle_instalacao.repository.chat.ChatMensagemRepository;
import br.com.w4solution.controle_instalacao.repository.chat.ChatParticipanteRepository;
import br.com.w4solution.controle_instalacao.repository.usuarios.UsuarioRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class ChatInternoService {
    private final ChatConversaRepository conversaRepository;
    private final ChatParticipanteRepository participanteRepository;
    private final ChatMensagemRepository mensagemRepository;
    private final UsuarioRepository usuarioRepository;

    public ChatInternoService(
            ChatConversaRepository conversaRepository,
            ChatParticipanteRepository participanteRepository,
            ChatMensagemRepository mensagemRepository,
            UsuarioRepository usuarioRepository
    ) {
        this.conversaRepository = conversaRepository;
        this.participanteRepository = participanteRepository;
        this.mensagemRepository = mensagemRepository;
        this.usuarioRepository = usuarioRepository;
    }

    public List<UsuarioDTO> listarUsuarios(Usuario atual) {
        return usuarioRepository.findAllByStatus(Status.ATIVO).stream()
                .filter(usuario -> !usuario.getId().equals(atual.getId()))
                .map(UsuarioDTO::new).toList();
    }

    @Transactional
    public List<ChatConversaDTO> listarConversas(Usuario atual) {
        return conversaRepository.listarDoUsuario(atual.getId()).stream()
                .map(conversa -> converterConversa(conversa, atual)).toList();
    }

    @Transactional
    public ChatConversaDTO criarOuAbrir(Usuario atual, Long outroUsuarioId) {
        if (atual.getId().equals(outroUsuarioId)) {
            throw new IllegalArgumentException("Nao e possivel criar uma conversa consigo mesmo.");
        }
        Usuario outro = usuarioRepository.findById(outroUsuarioId)
                .filter(usuario -> usuario.getStatus() == Status.ATIVO)
                .orElseThrow(() -> new IllegalArgumentException("Usuario nao encontrado ou inativo."));

        for (ChatConversa conversa : conversaRepository.listarDoUsuario(atual.getId())) {
            List<ChatParticipante> participantes = participanteRepository.findByConversaId(conversa.getId());
            if (participantes.size() == 2 && participantes.stream()
                    .anyMatch(p -> p.getUsuario().getId().equals(outroUsuarioId))) {
                return converterConversa(conversa, atual);
            }
        }

        ChatConversa conversa = conversaRepository.save(new ChatConversa());
        participanteRepository.save(new ChatParticipante(conversa, atual));
        participanteRepository.save(new ChatParticipante(conversa, outro));
        return converterConversa(conversa, atual);
    }

    @Transactional
    public List<ChatMensagemDTO> listarMensagens(Usuario atual, Long conversaId) {
        ChatParticipante participante = validarParticipante(atual, conversaId);
        participante.marcarComoLida();
        participanteRepository.save(participante);
        return mensagemRepository.findByConversaIdOrderByEnviadaEmAsc(conversaId)
                .stream().map(ChatMensagemDTO::new).toList();
    }

    @Transactional
    public ChatMensagemDTO enviar(Usuario atual, Long conversaId, String texto) {
        validarParticipante(atual, conversaId);
        ChatConversa conversa = conversaRepository.findById(conversaId)
                .orElseThrow(() -> new IllegalArgumentException("Conversa nao encontrada."));
        ChatMensagem mensagem = mensagemRepository.save(new ChatMensagem(conversa, atual, texto.trim()));
        conversa.atualizar();
        conversaRepository.save(conversa);
        return new ChatMensagemDTO(mensagem);
    }

    @Transactional
    public void marcarComoLida(Usuario atual, Long conversaId) {
        ChatParticipante participante = validarParticipante(atual, conversaId);
        participante.marcarComoLida();
        participanteRepository.save(participante);
    }

    @Transactional
    public ChatNotificacaoDTO notificacoes(Usuario atual) {
        long total = participanteRepository.findByUsuarioId(atual.getId()).stream()
                .mapToLong(participante -> contarNaoLidas(participante, atual.getId()))
                .sum();
        return new ChatNotificacaoDTO(total);
    }

    private ChatParticipante validarParticipante(Usuario usuario, Long conversaId) {
        return participanteRepository.findByConversaIdAndUsuarioId(conversaId, usuario.getId())
                .orElseThrow(() -> new IllegalArgumentException("Conversa nao encontrada."));
    }

    private ChatConversaDTO converterConversa(ChatConversa conversa, Usuario atual) {
        ChatParticipante participanteAtual = validarParticipante(atual, conversa.getId());
        Usuario outro = participanteRepository.findByConversaId(conversa.getId()).stream()
                .map(ChatParticipante::getUsuario)
                .filter(usuario -> !usuario.getId().equals(atual.getId()))
                .findFirst().orElse(atual);
        String ultima = mensagemRepository.findTopByConversaIdOrderByEnviadaEmDesc(conversa.getId())
                .map(ChatMensagem::getTexto).orElse("");
        return new ChatConversaDTO(conversa.getId(), outro.getId(), outro.getUsuario(), ultima,
                conversa.getAtualizadaEm(), contarNaoLidas(participanteAtual, atual.getId()));
    }

    private long contarNaoLidas(ChatParticipante participante, Long usuarioId) {
        Instant desde = participante.getUltimoLidoEm() == null ? Instant.EPOCH : participante.getUltimoLidoEm();
        return mensagemRepository.contarNaoLidas(participante.getConversa().getId(), usuarioId, desde);
    }
}
