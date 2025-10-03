package br.com.w4solution.controle_instalacao.repository.registro;

import br.com.w4solution.controle_instalacao.domain.registro.Registro;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface RegistroRepository extends JpaRepository<Registro, Long> {


    List<Registro> findTop15ByOrderByIdDesc();

    @Query("SELECT COUNT(r) " +
            "FROM Registro r " +
            "WHERE r.procedimentoRegistro = :procedimento " +
            "AND EXTRACT(MONTH FROM r.dataRegistro) = :mes " +
            "AND EXTRACT(YEAR FROM r.dataRegistro) = :ano " +
            "GROUP BY EXTRACT(MONTH FROM r.dataRegistro), EXTRACT(YEAR FROM r.dataRegistro) " +
            "ORDER BY COUNT(r) DESC")
    Integer buscarResumoMensal(String procedimento, Integer mes, Integer ano);

    List<Registro> findAllByOrderByIdDesc();

    @Query("SELECT r.procedimentoRegistro, COUNT(r) " +
            "FROM Registro r " +
            "WHERE r.equipeTecnicaRegistro LIKE %:nomeEquipe% " +
            "AND EXTRACT(MONTH FROM r.dataRegistro) = :mes " +
            "AND EXTRACT(YEAR FROM r.dataRegistro) = :ano " +
            "GROUP BY r.procedimentoRegistro")
    List<Object[]> EncontrarRegistroMensalPorTecnico(String nomeEquipe, int mes, int ano);

    @Query("SELECT r.equipeTecnicaRegistro, COUNT(r) " +
            "FROM Registro r " +
            "WHERE EXTRACT(MONTH FROM r.dataRegistro) = :mes " +
            "AND EXTRACT(YEAR FROM r.dataRegistro) = :ano " +
            "GROUP BY r.equipeTecnicaRegistro")
    List<Object[]> EncontrarRegistroMensalPorTecnicoSemFiltro(int mes, int ano);

    @Query("SELECT r FROM Registro r WHERE EXTRACT(MONTH FROM r.dataRegistro) = :monthValue AND EXTRACT(YEAR FROM r.dataRegistro) = :year ORDER BY r.id DESC")
    List<Registro> encontrarPorData(int monthValue, int year);

    @Query("SELECT r FROM Registro r WHERE EXTRACT(MONTH FROM r.dataRegistro) = :monthValue AND EXTRACT(YEAR FROM r.dataRegistro) = :year AND r.procedimentoRegistro = :procedimento")
    List<Registro> encontrarPorDataComFiltro(int monthValue, int year, String procedimento);

    @Query("SELECT r.equipeTecnicaRegistro, COUNT(r) " +
            "FROM Registro r " +
            "WHERE EXTRACT(MONTH FROM r.dataRegistro) = :mes " +
            "AND EXTRACT(YEAR FROM r.dataRegistro) = :ano " +
            "AND r.procedimentoRegistro = :procedimento " +
            "GROUP BY r.equipeTecnicaRegistro")
    List<Object[]> EncontrarRegistroMensalPorTecnicoComFiltro(int mes, int ano, String procedimento);

    @Query("SELECT COUNT(r) FROM Registro r " +
            " WHERE r.procedimentoRegistro = :procedimento" +
            " AND EXTRACT(MONTH FROM r.dataRegistro) = :monthValue " +
            " AND EXTRACT(YEAR FROM r.dataRegistro) = :year " +
            " GROUP BY EXTRACT(MONTH FROM r.dataRegistro), EXTRACT(YEAR FROM r.dataRegistro) " +
            " ORDER BY COUNT(r) DESC")
    Integer encontrarAtividadesMensal(String procedimento, int monthValue, int year);

}
