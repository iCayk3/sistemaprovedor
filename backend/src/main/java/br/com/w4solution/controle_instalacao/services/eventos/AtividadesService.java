package br.com.w4solution.controle_instalacao.services.eventos;

import br.com.w4solution.controle_instalacao.domain.atividades.Atividade;
import br.com.w4solution.controle_instalacao.domain.usuarios.UserRole;
import br.com.w4solution.controle_instalacao.dto.evento.*;
import br.com.w4solution.controle_instalacao.repository.eventos.AtividadeRepository;
import br.com.w4solution.controle_instalacao.repository.eventos.EventoRepository;
import br.com.w4solution.controle_instalacao.repository.usuarios.UsuarioRepository;
import br.com.w4solution.controle_instalacao.services.ExtratorToken;
import br.com.w4solution.controle_instalacao.services.rbx.ServiceRbx;
import br.com.w4solution.controle_instalacao.services.usuarios.TokenService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;


@Service
public class AtividadesService {

    @Autowired
    AtividadeRepository repository;

    @Autowired
    UsuarioRepository usuarioRepository;

    @Autowired
    EventoRepository eventoRepository;

    @Autowired
    TokenService token;

    @Autowired
    ExtratorToken extrator;

    @Autowired
    ServiceRbx serviceRbx;


    public List<AtividadesDTO> cadastrarAtividade(List<CadastrarAtividadesDTO> dados, HttpServletRequest request) {
        if(dados.isEmpty()){
            throw new RuntimeException("Sem dados para cadastrar");
        }

        var usuario = extrator.extrairUsuario(request);

        var atividades = dados.stream().map(a -> new Atividade(a, usuario)).toList();
        repository.saveAll(atividades);

        return atividades.stream().map(AtividadesDTO::new).toList();
    }

    public List<AtividadesDTO> listarAtividades() {
        return repository.findAll().stream().map(AtividadesDTO::new).toList();
    }

    public List<ServicoPorUsuarioDiario> listarAtividadesPorUsuario(String filtro, String segmento) {

        var usuarios = usuarioRepository.encontrarUsuariosPorFragmento(UserRole.COMERCIAL.toString());
        var segmentoNormalizado = normalizarSegmento(segmento);

        return usuarios.stream().map(u -> {
            List<Object[]> resultados = null;

            if(filtro != null){

                LocalDate data = LocalDate.parse(filtro);
                resultados  = repository.encontrarAtividadesPorUsuario(u.getUsuario(), segmentoNormalizado, data.getMonthValue(), data.getYear(), data.getDayOfMonth());

            }else {
                resultados  = repository.encontrarAtividadesPorUsuario(u.getUsuario(), segmentoNormalizado, LocalDate.now().getMonth().getValue(), LocalDate.now().getYear(), LocalDate.now().getDayOfMonth());
            }

            List<TotalAtividadeDTO> atividadesDto = new ArrayList<>();
            for (Object[] resultado : resultados) {
                String procedimento = (String) resultado[0];
                Long quantidade = (Long) resultado[1];
                atividadesDto.add(new TotalAtividadeDTO(procedimento, quantidade));
            }

            return new ServicoPorUsuarioDiario(u.getUsuario(), atividadesDto);
        }).toList();
    }

    public List<ServicoPorUsuarioDiario> listarAtividadesMensaisPorUsuario(String data, String segmento) {
        var segmentoNormalizado = normalizarSegmento(segmento);
        var dataConvertida = data == null || data.isBlank() ? LocalDate.now() : LocalDate.parse(data);
        var resultados = repository.encontrarAtividadesMensaisPorUsuario(segmentoNormalizado, dataConvertida.getMonthValue(), dataConvertida.getYear());
        Map<String, List<TotalAtividadeDTO>> porUsuario = new LinkedHashMap<>();

        for (Object[] resultado : resultados) {
            String usuario = (String) resultado[0];
            String evento = (String) resultado[1];
            Long quantidade = (Long) resultado[2];
            porUsuario.computeIfAbsent(usuario, key -> new ArrayList<>()).add(new TotalAtividadeDTO(evento, quantidade));
        }

        return porUsuario.entrySet().stream()
                .map(entry -> new ServicoPorUsuarioDiario(entry.getKey(), entry.getValue()))
                .toList();
    }

    public List<ResumoMensalDTO> buscarResumoMensalAtividade(String data, String segmento) {

        var segmentoNormalizado = normalizarSegmento(segmento);
        var eventos = eventoRepository.encontrarPorSegmento(segmentoNormalizado);
        var dataConvertida = LocalDate.parse(data);
        return eventos.stream().map(e -> {
            var value = repository.encontrarAtividadesMensal(e.getEvento(), segmentoNormalizado, dataConvertida.getMonthValue(), dataConvertida.getYear());
            return new ResumoMensalDTO(e.getEvento(), value != null ? value : 0);
        }).toList();
    }

    public List<AtividadesDTO> listarAtividadesPorMes(String data, String segmento) {
        var segmentoNormalizado = normalizarSegmento(segmento);
        if(data == null){
            return repository.listarAtividadesDoMes(segmentoNormalizado, LocalDate.now().getYear(), LocalDate.now().getMonthValue()).stream().map(AtividadesDTO::new).toList();
        }
        var dataConvertida = LocalDate.parse(data);
        return repository.listarAtividadesDoMes(segmentoNormalizado, dataConvertida.getYear(), dataConvertida.getMonthValue()).stream().map(AtividadesDTO::new).toList();
    }

    public List<AtividadesDTO> listarAtividadesPorAno(String data, String segmento) {
        var segmentoNormalizado = normalizarSegmento(segmento);
        var dataConvertida = data == null || data.isBlank() ? LocalDate.now() : LocalDate.parse(data);
        return repository.listarAtividadesDoAno(segmentoNormalizado, dataConvertida.getYear()).stream().map(AtividadesDTO::new).toList();
    }

    public AtividadesDTO converterLead(Long id, ConverterLeadDTO dto, HttpServletRequest request) {
        if (dto.codigoCliente() == null) {
            throw new IllegalArgumentException("Informe o codigo do cliente.");
        }

        var atividade = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Lead nao encontrado."));

        if (!"LEAD".equalsIgnoreCase(atividade.getSegmento())) {
            throw new IllegalArgumentException("Apenas leads podem ser convertidos em venda.");
        }

        var cliente = serviceRbx.buscarClienteId(dto.codigoCliente().longValue()).stream()
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Cliente nao encontrado no RBX."));

        var contrato = serviceRbx.buscarContratoMaisRecenteComValor(dto.codigoCliente())
                .orElseThrow(() -> new IllegalArgumentException("Nenhum contrato com valor encontrado para o cliente."));

        atividade.setStatus("CONVERTIDO");
        atividade.setCodigoCliente(dto.codigoCliente());
        atividade.setCliente(cliente.nome());
        atividade.setGrupoCliente(grupoCliente(cliente.grupoNome() != null && !cliente.grupoNome().isBlank() ? cliente.grupoNome() : cliente.grupo()));
        atividade.setPlano(contrato.planoDescricao());
        atividade.setValorPlano(serviceRbx.valorContrato(contrato));
        atividade.setValor(serviceRbx.valorContrato(contrato));
        atividade.setConvertidoEm(LocalDateTime.now());
        atividade.setConvertidoPor(extrator.extrairUsuario(request));

        return new AtividadesDTO(repository.save(atividade));
    }

    public void deletarAtividade(Long id) {
        repository.deleteById(id);
    }

    private String normalizarSegmento(String segmento) {
        if(segmento == null || segmento.isBlank()){
            return "ATIVIDADE";
        }
        return segmento.trim().toUpperCase();
    }

    private String grupoCliente(String grupo) {
        if (grupo == null || grupo.isBlank()) {
            return grupo;
        }
        return switch (grupo.trim()) {
            case "9" -> "PADRAO";
            case "10" -> "SJP";
            case "11" -> "PMV";
            case "13" -> "STN";
            case "15" -> "QT";
            case "16" -> "BV";
            case "17" -> "SEM COBRANCA";
            case "26" -> "MB";
            case "32" -> "MRC";
            case "33" -> "MRP";
            case "34" -> "SAL";
            case "36" -> "RADIO - PIRABAS";
            case "40" -> "TESTE";
            case "41" -> "PRE";
            case "42" -> "CON";
            case "43" -> "SOL";
            default -> grupo;
        };
    }
}

