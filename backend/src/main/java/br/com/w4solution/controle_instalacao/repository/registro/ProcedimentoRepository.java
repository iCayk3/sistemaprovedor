package br.com.w4solution.controle_instalacao.repository.registro;

import br.com.w4solution.controle_instalacao.domain.registro.Procedimentos;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProcedimentoRepository extends JpaRepository<Procedimentos, Long> {
    List<Procedimentos> findAllByAtivo(boolean b);

    Procedimentos findTopByProcedimentoOrderByIdDesc(String procedimento);

}
