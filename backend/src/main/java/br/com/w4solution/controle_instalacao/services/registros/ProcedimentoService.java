package br.com.w4solution.controle_instalacao.services.registros;

import br.com.w4solution.controle_instalacao.domain.registro.Procedimentos;
import br.com.w4solution.controle_instalacao.dto.registro.AtualizarProcedimentoDto;
import br.com.w4solution.controle_instalacao.dto.registro.CadastroProcedimentoDTO;
import br.com.w4solution.controle_instalacao.infra.configuration.exceptions.ProcedimentoException;
import br.com.w4solution.controle_instalacao.repository.registro.ProcedimentoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProcedimentoService {

    @Autowired
    ProcedimentoRepository repository;

    public void cadastrarProcedimento(CadastroProcedimentoDTO dados) {
        var procedimento = new Procedimentos(dados);
        repository.save(procedimento);
    }

    public List<Procedimentos> buscaProcedimentos() {
        return repository.findAllByAtivo(true);
    }

    public void atualizarProcedimento(Long id, AtualizarProcedimentoDto dados) {
        var procedimento = repository.findById(id);
        if(procedimento.isEmpty()){
            throw new ProcedimentoException("Procedimento não encontrado!");
        }
        procedimento.get().atualizarProcedimento(dados);
    }

    public void deletarProcedimento(Long id) {
        var procedimento = repository.findById(id);
        if(procedimento.isEmpty()){
            throw new ProcedimentoException("Procedimento não encontrado!");
        }
        procedimento.get().setAtivo(false);
    }
}
