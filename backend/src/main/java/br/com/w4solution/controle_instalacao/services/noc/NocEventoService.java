package br.com.w4solution.controle_instalacao.services.noc;

import br.com.w4solution.controle_instalacao.domain.noc.NocEventoHistorico;
import br.com.w4solution.controle_instalacao.dto.noc.NocEventoAtualizacaoDTO;
import br.com.w4solution.controle_instalacao.domain.noc.NocEvento;
import br.com.w4solution.controle_instalacao.dto.noc.NocEventoCadastroDTO;
import br.com.w4solution.controle_instalacao.dto.noc.NocEventoDTO;
import br.com.w4solution.controle_instalacao.dto.noc.NocEventoHistoricoDTO;
import br.com.w4solution.controle_instalacao.repository.noc.NocEventoHistoricoRepository;
import br.com.w4solution.controle_instalacao.repository.noc.NocEventoRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Service
public class NocEventoService {

    private final NocEventoRepository repository;
    private final NocEventoHistoricoRepository historicoRepository;

    public NocEventoService(NocEventoRepository repository, NocEventoHistoricoRepository historicoRepository) {
        this.repository = repository;
        this.historicoRepository = historicoRepository;
    }

    public List<NocEventoDTO> listar() {
        return repository.findAll().stream()
                .sorted(Comparator.comparing(NocEvento::getInicio, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toDto)
                .toList();
    }

    public NocEventoDTO cadastrar(NocEventoCadastroDTO dto) {
        NocEvento evento = new NocEvento();
        evento.setProtocolo(proximoProtocolo());
        evento.setOrigem(dto.origem());
        evento.setTipoEvento(dto.tipoEvento());
        evento.setTecnico(dto.tecnico());
        evento.setCliente(dto.cliente());
        evento.setCidade(dto.cidade());
        evento.setBairro(dto.bairro());
        evento.setInicio(dto.inicio());
        evento.setFim(dto.fim());
        evento.setStatusProblema(dto.fim() != null ? "Resolvido" : fallback(dto.statusProblema(), "Aberto"));
        evento.setObservacoes(dto.observacoes());
        evento.setCriadoEm(LocalDateTime.now());
        return toDto(repository.save(evento));
    }

    public NocEventoDTO atualizar(Long id, NocEventoAtualizacaoDTO dto, String usuario) {
        NocEvento evento = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Evento NOC nao encontrado."));
        if (dto.observacao() == null || dto.observacao().isBlank()) {
            throw new IllegalArgumentException("Informe o que foi realizado no evento.");
        }

        String statusAnterior = evento.getStatusProblema();
        LocalDateTime fimAnterior = evento.getFim();
        String statusNovo = fallback(dto.statusProblema(), evento.getStatusProblema());

        evento.setStatusProblema(statusNovo);
        evento.setFim(dto.fim());
        NocEvento salvo = repository.save(evento);

        NocEventoHistorico historico = new NocEventoHistorico();
        historico.setEvento(salvo);
        historico.setStatusAnterior(statusAnterior);
        historico.setStatusNovo(statusNovo);
        historico.setFimAnterior(fimAnterior);
        historico.setFimNovo(dto.fim());
        historico.setObservacao(dto.observacao());
        historico.setUsuario(fallback(usuario, "sistema"));
        historico.setCriadoEm(LocalDateTime.now());
        historicoRepository.save(historico);

        return toDto(salvo);
    }

    public void deletar(Long id) {
        repository.deleteById(id);
    }

    private String proximoProtocolo() {
        int year = LocalDateTime.now().getYear();
        String prefix = "NOC-" + year + "-";
        int next = repository.findTopByProtocoloStartingWithOrderByProtocoloDesc(prefix)
                .map(NocEvento::getProtocolo)
                .map(protocolo -> protocolo.substring(prefix.length()))
                .map(Integer::parseInt)
                .orElse(0) + 1;
        return prefix + String.format("%04d", next);
    }

    private NocEventoDTO toDto(NocEvento evento) {
        List<NocEventoHistoricoDTO> historico = historicoRepository.findAllByEventoIdOrderByCriadoEmDesc(evento.getId()).stream()
                .map(NocEventoHistoricoDTO::new)
                .toList();
        return new NocEventoDTO(evento, historico);
    }

    private String fallback(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }
}
