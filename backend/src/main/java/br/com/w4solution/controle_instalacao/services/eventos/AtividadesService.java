package br.com.w4solution.controle_instalacao.services.eventos;

import br.com.w4solution.controle_instalacao.domain.atividades.Atividade;
import br.com.w4solution.controle_instalacao.domain.usuarios.UserRole;
import br.com.w4solution.controle_instalacao.dto.evento.*;
import br.com.w4solution.controle_instalacao.repository.eventos.AtividadeRepository;
import br.com.w4solution.controle_instalacao.repository.eventos.EventoRepository;
import br.com.w4solution.controle_instalacao.repository.usuarios.UsuarioRepository;
import br.com.w4solution.controle_instalacao.services.ExtratorToken;
import br.com.w4solution.controle_instalacao.services.usuarios.TokenService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;


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

    public List<ServicoPorUsuarioDiario> listarAtividadesPorUsuario(String filtro) {

        var usuarios = usuarioRepository.encontrarUsuariosPorFragmento(UserRole.COMERCIAL.toString());

        return usuarios.stream().map(u -> {
            List<Object[]> resultados = null;

            if(filtro != null){

                LocalDate data = LocalDate.parse(filtro);
                resultados  = repository.encontrarAtividadesPorUsuario(u.getUsuario(), data.getMonthValue(), data.getYear(), data.getDayOfMonth());

            }else {
                resultados  = repository.encontrarAtividadesPorUsuario(u.getUsuario(), LocalDate.now().getMonth().getValue(), LocalDate.now().getYear(), LocalDate.now().getDayOfMonth());
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

    public List<ResumoMensalDTO> buscarResumoMensalAtividade(String data) {

        var eventos = eventoRepository.findAll();
        var dataConvertida = LocalDate.parse(data);
        return eventos.stream().map(e -> {
            var value = repository.encontrarAtividadesMensal(e.getEvento(), dataConvertida.getMonthValue(), dataConvertida.getYear());
            return new ResumoMensalDTO(e.getEvento(), value != null ? value : 0);
        }).toList();
    }

    public List<AtividadesDTO> listarAtividadesPorMes(String data) {
        if(data == null){
            return repository.listarAtividadesDoMes(LocalDate.now().getYear(), LocalDate.now().getMonthValue()).stream().map(AtividadesDTO::new).toList();
        }
        return null;
    }

    public void deletarAtividade(Long id) {
        repository.deleteById(id);
    }
}

