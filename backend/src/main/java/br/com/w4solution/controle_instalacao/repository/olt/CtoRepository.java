package br.com.w4solution.controle_instalacao.repository.olt;

import br.com.w4solution.controle_instalacao.domain.olt.Cto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CtoRepository extends JpaRepository<Cto, Long> {
    @Query("SELECT c FROM Cto c LEFT JOIN FETCH c.portas WHERE c.olt.id = :oltId ORDER BY c.nomeCto ASC")
    List<Cto> findByOltIdWithPortas(@Param("oltId") Long oltId);
}
