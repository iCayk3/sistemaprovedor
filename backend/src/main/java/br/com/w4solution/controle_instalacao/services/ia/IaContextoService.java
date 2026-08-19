package br.com.w4solution.controle_instalacao.services.ia;

import br.com.w4solution.controle_instalacao.repository.cliente.ClienteRepository;
import br.com.w4solution.controle_instalacao.repository.cobranca.CobrancaRepository;
import br.com.w4solution.controle_instalacao.repository.eventos.EventoRepository;
import br.com.w4solution.controle_instalacao.repository.noc.NocEventoRepository;
import br.com.w4solution.controle_instalacao.repository.registro.RegistroRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class IaContextoService {
    private final ClienteRepository clienteRepository;
    private final RegistroRepository registroRepository;
    private final CobrancaRepository cobrancaRepository;
    private final EventoRepository eventoRepository;
    private final NocEventoRepository nocEventoRepository;

    public IaContextoService(
            ClienteRepository clienteRepository,
            RegistroRepository registroRepository,
            CobrancaRepository cobrancaRepository,
            EventoRepository eventoRepository,
            NocEventoRepository nocEventoRepository
    ) {
        this.clienteRepository = clienteRepository;
        this.registroRepository = registroRepository;
        this.cobrancaRepository = cobrancaRepository;
        this.eventoRepository = eventoRepository;
        this.nocEventoRepository = nocEventoRepository;
    }

    public Map<String, Object> resumo() {
        Map<String, Object> resumo = new LinkedHashMap<>();
        resumo.put("coletadoEm", Instant.now());
        resumo.put("totalClientes", clienteRepository.count());
        resumo.put("totalRegistrosServico", registroRepository.count());
        resumo.put("totalCobrancas", cobrancaRepository.count());
        resumo.put("totalTiposEvento", eventoRepository.count());
        resumo.put("totalEventosNoc", nocEventoRepository.count());
        return resumo;
    }
}
