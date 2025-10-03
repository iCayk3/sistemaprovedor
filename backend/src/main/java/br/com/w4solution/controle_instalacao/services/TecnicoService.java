package br.com.w4solution.controle_instalacao.services;

import br.com.w4solution.controle_instalacao.domain.tecnico.EquipeTecnica;
import br.com.w4solution.controle_instalacao.domain.tecnico.Tecnico;
import br.com.w4solution.controle_instalacao.dto.AtualizarEquipeDTO;
import br.com.w4solution.controle_instalacao.dto.tecnico.*;
import br.com.w4solution.controle_instalacao.repository.equipeTecnica.EquipeTecnicaRepository;
import br.com.w4solution.controle_instalacao.repository.equipeTecnica.TecnicoRepository;
import br.com.w4solution.controle_instalacao.validations.AtualizarEquipeException;
import br.com.w4solution.controle_instalacao.validations.exceptions.CadastrarTecnicoException;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TecnicoService {

    @Autowired
    EquipeTecnicaRepository equipeTecnicaRepository;

    @Autowired
    TecnicoRepository tecnicoRepository;

    @PersistenceContext
    private EntityManager entityManager;

    public List<EquipeDTO> listarEquipes() {
        var equipeTecnica = equipeTecnicaRepository.findAll();
        return equipeTecnica.stream().map(t -> new EquipeDTO(t.getId(), t.getNomeEquipe(), t.getTecnicos().stream().map(TecnicoDTO::new).toList())).toList();
    }

    public EquipeTecnica cadastrarEquipeTecnica(CadastroEquipeDTO dados) {
        List<Tecnico> tecnicos = null;

        if (dados.tecnicos() != null) {
            tecnicos = dados.tecnicos().stream()
                    .filter(t -> t.id() != null || (t.nome() != null && !t.nome().isBlank()))
                    .map(Tecnico::new)
                    .collect(Collectors.toList());
        }

        var equipe = new EquipeTecnica(null, dados.nomeEquipe(), tecnicos);

        if (tecnicos != null) {
            tecnicos.forEach(t -> t.setEquipeTecnica(equipe));
        }

        equipeTecnicaRepository.save(equipe);
        return equipe;
    }


    public void atualizarEquipeTecnica(AtualizarEquipeDTO dto) {
        var tecnicosAtuais = tecnicoRepository.findAll();

        // 1. Desvincular todos os técnicos das equipes
        tecnicosAtuais.forEach(tecnico -> tecnico.setEquipeTecnica(null));
        tecnicoRepository.saveAll(tecnicosAtuais); // persistir desvinculação

        // 2. Reassociar técnicos às equipes
        dto.nomeEquipe().forEach(eqp -> {
            var equipeOpt = equipeTecnicaRepository.findById(eqp.id());
            if (equipeOpt.isEmpty()) {
                throw new RuntimeException("Equipe com ID " + eqp.id() + " não encontrada");
            }

            var equipe = equipeOpt.get();

            // Obter lista de técnicos existentes com base nos IDs recebidos
            List<Tecnico> tecnicosDaEquipe = eqp.tecnicos().stream()
                    .map(tecDTO -> {
                        Tecnico tecnico = tecnicoRepository.findById(tecDTO.id())
                                .orElseThrow(() -> new RuntimeException("Técnico com ID " + tecDTO.id() + " não encontrado"));
                        tecnico.setEquipeTecnica(equipe);
                        return tecnico;
                    })
                    .collect(Collectors.toList()); // lista mutável

            equipe.setTecnicos(tecnicosDaEquipe);
            equipeTecnicaRepository.save(equipe);
            tecnicoRepository.saveAll(tecnicosDaEquipe); // persistir atualização dos técnicos
        });
    }

    public List<TecnicoDTO> cadastrarTecnico(cadastrarTecnicoDTO dados) {
        var equipe = equipeTecnicaRepository.findById(dados.nomeEquipe());
        var listaTecnicosDto = new ArrayList<TecnicoDTO>();
        if (equipe.isEmpty()) {
            throw new CadastrarTecnicoException("Equipe nao encontrada");
        }
        dados.tecnicos().forEach(t -> {
            var tecnico = new Tecnico(t, equipe.get());
            tecnicoRepository.save(tecnico);
            listaTecnicosDto.add(new TecnicoDTO(tecnico));
        });

        return listaTecnicosDto;
    }

    public List<EquipeComTecnicoDTO> listarTecnicoPorEquipe() {
        var equipes = equipeTecnicaRepository.findAllWithTecnicos();
        var equipeComTecnicos = equipes.stream().map(e -> new EquipeComTecnicoDTO(e.getId(), e.getNomeEquipe(), e.getTecnicos().stream().map(
                t -> new TecnicoDTO(t.getId(), t.getNome())
        ).toList())).toList();
        return equipeComTecnicos;
    }

    public List<TecnicoDTO> listarTecnico() {
        return tecnicoRepository.findAllByEquipeTecnicaIsNull().stream().map(TecnicoDTO::new).toList();
    }

    public void deletarTecnico(Long id) {
        tecnicoRepository.deleteById(id);
    }

    @Transactional// Certifique-se de que esta anotação está aqui
    public void deletarEquipe(Long id) {
        var equipeOpt = equipeTecnicaRepository.findById(id);

        if (equipeOpt.isEmpty()) {
            throw new RuntimeException("Equipe com ID " + id + " não encontrada");
        }

        var equipe = equipeOpt.get();

        // Desvincular técnicos da equipe
        List<Tecnico> tecnicos = equipe.getTecnicos();
        if (tecnicos != null && !tecnicos.isEmpty()) {
            tecnicos.forEach(tec -> tec.setEquipeTecnica(null));
            tecnicoRepository.saveAll(tecnicos);
        }

        try {
            System.out.println("Attempting to delete equipe with ID (using EntityManager.remove): " + id);

            if (!entityManager.contains(equipe)) {
                equipe = entityManager.merge(equipe);
            }

            entityManager.remove(equipe);
            entityManager.flush();
            System.out.println("EntityManager.remove and flush attempted for equipe with ID: " + id);
        } catch (Exception e) {
            System.err.println("Erro ao tentar deletar equipe: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Falha ao deletar equipe: " + e.getMessage(), e);
        }
    }




}
