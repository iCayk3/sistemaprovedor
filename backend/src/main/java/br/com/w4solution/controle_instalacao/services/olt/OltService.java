package br.com.w4solution.controle_instalacao.services.olt;

import br.com.w4solution.controle_instalacao.domain.cliente.Cliente;
import br.com.w4solution.controle_instalacao.domain.olt.Cto;
import br.com.w4solution.controle_instalacao.domain.olt.Olt;
import br.com.w4solution.controle_instalacao.domain.olt.Porta;
import br.com.w4solution.controle_instalacao.dto.olt.*;
import br.com.w4solution.controle_instalacao.dto.rbx.ClienteFiltradoDTO;
import br.com.w4solution.controle_instalacao.infra.configuration.exceptions.CtoValidacaoExcepetion;
import br.com.w4solution.controle_instalacao.repository.cliente.ClienteRepository;
import br.com.w4solution.controle_instalacao.repository.olt.CtoRepository;
import br.com.w4solution.controle_instalacao.repository.olt.OltRepository;
import br.com.w4solution.controle_instalacao.repository.olt.PortaRepository;
import br.com.w4solution.controle_instalacao.services.rbx.ServiceRbx;
import br.com.w4solution.controle_instalacao.validations.ValidacaoCtoException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class OltService {

    @Autowired
    OltRepository repository;
    @Autowired
    PortaRepository repositoryPorta;
    @Autowired
    CtoRepository repositoryCto;
    @Autowired
    ClienteRepository clienteRepository;
    @Autowired
    ServiceRbx rbx;

    public List<OltDTO> listarOlts() {
        return repository.findAll().stream().map(OltDTO::new).toList();
    }

    public List<CtoDTO> listarCtos(Long id) {
        var olt = repository.findById(id);
        if (olt.isPresent()) {
            return olt.get().getCto().stream().map(CtoDTO::new).toList();
        }
        throw new ValidacaoCtoException("OLT não encontrada");
    }

    public List<PortaDTORbx> listarPortas(Long id) {
        var portas = repositoryPorta.findPortasByCtoIdWithClientes(id);

        if (portas.isEmpty()) {
            throw new CtoValidacaoExcepetion("CTO não encontrada");
        }
        return portas.stream().map(p -> {
            if (p.getCliente() != null) {
                var codigoCliente = rbx.buscarClienteId(Long.parseLong(p.getCliente().getCodigo().toString())).get(0);
                return new PortaDTORbx(p.getId(), p.getPorta(), codigoCliente, p.getLogin());
            } else {
                return new PortaDTORbx(p.getId(), p.getPorta(), null, null);
            }
        }).toList();
    }

    public Olt cadastrarOlt(CadastroOlt cadastroOlt) {
        var olt = new Olt(cadastroOlt);
        repository.save(olt);
        return olt;
    }

    public Cto cadastrarCto(CadastroCTO dados) {
        var olt = repository.findById(dados.idOlt());

        List<Porta> portas = new ArrayList<>();

        var cto = new Cto(null, dados.nomeCto(), portas, olt.get(), dados.latidude(), dados.longitude());

        for (int i = 1; i <= dados.portas(); i++) {
            portas.add(new Porta(i, cto));
        }

        repositoryCto.save(cto);

        return cto;
    }

    public List<CtoComPortasDTO> listarTodasCtos(Long id) {
        if (id != null) {
            var oltOpt = repository.findById(id);
            if (oltOpt.isPresent()) {
                var olt = oltOpt.get();
                return olt.getCto().stream()
                        .map(cto -> {

                            return new CtoComPortasDTO(
                                    cto.getId(),
                                    cto.getNomeCto(),
                                    cto.getLat(),
                                    cto.getLongi()
                            );
                        })
                        .toList();
            }
        }

        throw new ValidacaoCtoException("OLT não encontrada");
    }

    public void deletarCto(Long id) {
        var cto = repositoryCto.findById(id);
        var portas = repositoryPorta.findPortasByCtoIdWithClientes(id);
        if (portas.isEmpty() || cto.isEmpty()) {
            throw new RuntimeException("Erro ao deletar CTO");
        }

        portas.forEach(p -> {
                    if (p.getCliente() != null) {
                        p.getCliente().setPortas(null);
                        p.getCto().setPortas(null);
//                        p.getRegistros().forEach(r -> r.setPorta(null));
                        p.setCto(null);
//                        p.setRegistros(null);
                        p.setCliente(null);
                    } else {
                        p.getCto().setPortas(null);
//                        p.getRegistros().forEach(r -> r.setPorta(null));
                        p.setCto(null);
//                        p.setRegistros(null);
                        p.setCliente(null);
                    }
                }
        );

        cto.get().setPortas(null);
//        cto.get().getRegistros().forEach(r -> r.setCtoRegistro(null));
//        cto.get().setRegistros(null);

        repositoryCto.deleteById(id);
    }

    public void editarCto(Long id, AtualizarCtoDto dados) {
        var ctoOptional = repositoryCto.findById(id);
        ctoOptional.ifPresent(cto -> cto.atualizarDados(dados));
        repositoryPorta.deleteByCtoIsNull();
    }

    public void cadastrarClienteNaPorta(CadastrarClienteNaPortaDTO dados) {
        var buscaCliente = clienteRepository.findByCodigo(dados.codigo());
        var buscaPorta = repositoryPorta.findById(dados.porta());

        var cliente = buscaCliente.orElseGet(() -> {
            return new Cliente(dados.codigo());
        });

        var porta = buscaPorta.get();

        porta.setCliente(cliente);
        porta.setLogin(dados.login());
        repositoryPorta.save(porta);

    }

    public void deletarClienteDaPorta(Long id) {
        var buscaPorta = repositoryPorta.findById(id);
        if (buscaPorta.isEmpty()) {
            throw new RuntimeException("Porta não encontrada");
        }
        var porta = buscaPorta.get();
        porta.setCliente(null);
        porta.setLogin(null);
    }
}
