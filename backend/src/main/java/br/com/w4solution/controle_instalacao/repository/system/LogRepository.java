package br.com.w4solution.controle_instalacao.repository.system;

import br.com.w4solution.controle_instalacao.services.system.Log;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LogRepository extends JpaRepository<Log, Long> {
}
