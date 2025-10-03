package br.com.w4solution.controle_instalacao.services;

import br.com.w4solution.controle_instalacao.domain.cliente.Cliente;
import br.com.w4solution.controle_instalacao.domain.registro.Registro;
import br.com.w4solution.controle_instalacao.domain.tecnico.Tecnico;
import br.com.w4solution.controle_instalacao.dto.registro.CadastroRegistroDTO;
import br.com.w4solution.controle_instalacao.repository.cliente.ClienteRepository;
import br.com.w4solution.controle_instalacao.repository.equipeTecnica.EquipeTecnicaRepository;
import br.com.w4solution.controle_instalacao.repository.olt.CtoRepository;
import br.com.w4solution.controle_instalacao.repository.olt.OltRepository;
import br.com.w4solution.controle_instalacao.repository.olt.PortaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;


@Service
@Transactional
public class ValidacoesRegistro {

    @Autowired
    EquipeTecnicaRepository equipeTecnicaRepository;
    @Autowired
    ClienteRepository clienteRepository;
    @Autowired
    PortaRepository portaRepository;
    @Autowired
    OltRepository oltRepository;
    @Autowired
    CtoRepository ctoRepository;


    public Registro validacoesRegistro(CadastroRegistroDTO dados) {

        Registro registro;

        Cliente cliente = null;
        /*Encontrar equipe técnica*/
        var equipeTecnica = equipeTecnicaRepository.findById(dados.tecnico());
        if (equipeTecnica.isEmpty()) {
            throw new RuntimeException("Tecnico não enviado");
        }

        /*Corrigir equie */
        String nomeEquipe = equipeTecnica.get().getNomeEquipe();
        List<Tecnico> tecnicos = equipeTecnica.get().getTecnicos();

        String nomesTecnicos = tecnicos.stream()
                .map(Tecnico::getNome)
                .collect(Collectors.joining(" & "));

        String registroTecnicos = "%s : %s".formatted(nomeEquipe, nomesTecnicos);

        /*Caso não venha as informações de OLT */
        if (dados.olt() == null) {
            /*Buscar cliente caso não exista criar um novo*/
            var buscaCliente = clienteRepository.findByCodigo(dados.codigo());
            cliente = buscaCliente.orElseGet(() -> {
                return new Cliente(dados.codigo());
            });

            /*Cadastra registro */
            registro = new Registro(cliente.getCodigo().toString(),
                    registroTecnicos,
                    LocalDate.parse(dados.dataregistro()),
                    dados.procedimento(),
                    dados.ctoAntiga(),
                    dados.localidade(),
                    dados.observacao(),
                    dados.login(),
                    dados.mac()
            );
        } else {
            /*Busca porta escolhida da CTO*/
            var buscaPorta = portaRepository.findById(dados.porta());
            /*Buscar cliente caso não exista criar um novo*/
            var buscaCliente = clienteRepository.findByCodigo(dados.codigo());
            cliente = buscaCliente.orElseGet(() -> {
                Cliente novoCliente = new Cliente(dados.codigo());
                return clienteRepository.save(novoCliente);
            });

            var porta = buscaPorta.get();
            /*Associa o cliente a porta, caso exista um cliente remove o cliente e associa o novo*/
            if (porta.getCliente() == null) {
                porta.setCliente(cliente);
                porta.setLogin(dados.login());
                portaRepository.save(porta);
            } else {
                porta.setCliente(null);
                porta.setCliente(cliente);
                porta.setLogin(dados.login());
                portaRepository.save(porta);
            }

            var buscaOlt = oltRepository.findById(dados.olt());
            var buscaCto = ctoRepository.findById(dados.cto());
            registro = new Registro(
                    null,
                    cliente.getCodigo().toString(),
                    buscaOlt.get().getNome(),
                    buscaCto.get().getNomeCto(),
                    porta.getPorta().toString(),
                    registroTecnicos,
                    LocalDate.parse(dados.dataregistro()),
                    dados.procedimento(),
                    dados.ctoAntiga(),
                    dados.localidade(),
                    dados.observacao(),
                    dados.login(),
                    dados.mac());

            System.out.println(registro + "else");
        }

        return registro;
    }

}
