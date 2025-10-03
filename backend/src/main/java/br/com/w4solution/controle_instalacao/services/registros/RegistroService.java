package br.com.w4solution.controle_instalacao.services.registros;

import br.com.w4solution.controle_instalacao.domain.registro.Registro;
import br.com.w4solution.controle_instalacao.dto.evento.ResumoMensalDTO;
import br.com.w4solution.controle_instalacao.dto.registro.*;
import br.com.w4solution.controle_instalacao.repository.equipeTecnica.EquipeTecnicaRepository;
import br.com.w4solution.controle_instalacao.repository.registro.ProcedimentoRepository;
import br.com.w4solution.controle_instalacao.repository.registro.RegistroRepository;
import br.com.w4solution.controle_instalacao.services.ValidacoesRegistro;
import br.com.w4solution.controle_instalacao.validations.DeletarRegistroExceptions;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class RegistroService {

    @Autowired
    RegistroRepository registroRepository;
    @Autowired
    EquipeTecnicaRepository equipeTecnicaRepository;
    @Autowired
    ValidacoesRegistro validacoesRegistro;
    @Autowired
    ProcedimentoRepository procedimentoRepository;

    public List<RegistroDTO2> listarTodosRegistros(String equipe, String filtro){
        if(filtro != null){
            LocalDate data = LocalDate.parse(filtro);
            return registroRepository.encontrarPorData(data.getMonthValue(), data.getYear()).stream().map(RegistroDTO2::new).toList();
        }
        return registroRepository.findAllByOrderByIdDesc().stream().map(RegistroDTO2::new).toList();
    }

    public List<ServicosPorEquipeMensal> listarServicosPorEquipe(String filtro){
        var equipes = equipeTecnicaRepository.findAll();
        var variavel = equipes.stream().map(e -> {
            List<Object[]> resultados = null;
            if(filtro != null){

                LocalDate data = LocalDate.parse(filtro);
                resultados  = registroRepository.EncontrarRegistroMensalPorTecnico(e.getNomeEquipe(), data.getMonthValue(), data.getYear());

            }else {
                resultados  = registroRepository.EncontrarRegistroMensalPorTecnico(e.getNomeEquipe(), LocalDate.now().getMonth().getValue(), LocalDate.now().getYear());
            }
            List<ServicosEquipe> servicos2 = new ArrayList<>();
            for (Object[] resultado : resultados) {
                String procedimento = (String) resultado[0];
                Long quantidade = (Long) resultado[1];
                var pc = procedimentoRepository.findTopByProcedimentoOrderByIdDesc(procedimento);
                servicos2.add(new ServicosEquipe(procedimento, quantidade, pc.getCor()));
            }
            return new ServicosPorEquipeMensal(e.getNomeEquipe(), servicos2);
        }).toList();

        return variavel;
    }

    public List<RegistroDTO2> listarTop15Registros(){
        return registroRepository.findTop15ByOrderByIdDesc().stream().map(RegistroDTO2::new).toList();
    }

    public List<ResumoMensalDTO> resumoMensal(String filtro){
        LocalDate dataConvertida = LocalDate.parse(filtro);
        var procedimentos = procedimentoRepository.findAllByAtivo(true);
        return procedimentos.stream().map(e -> {
            var value = registroRepository.encontrarAtividadesMensal(e.getProcedimento(), dataConvertida.getMonthValue(), dataConvertida.getYear());
            return new ResumoMensalDTO(e.getProcedimento(), value != null ? value : 0);
        }).toList();

    }

    public Registro cadastrarRegistro(CadastroRegistroDTO dados){
        var registro = validacoesRegistro.validacoesRegistro(dados);
        registroRepository.save(registro);
        return registro;
    }

    public void deletarRegistro(Long id) {
        var registro = registroRepository.findById(id);
        if(registro.isPresent()){
            registroRepository.deleteById(id);
        }else {
            throw new DeletarRegistroExceptions("REGISTRO NAO ENCONTRADO");
        }

    }

    public List<TotalPorMesDTO> listarTodosRegistroPorMes(String servico){

        var ano = LocalDate.now().getYear();
        var meses = LocalDate.now().getMonth().getValue();

        var totalPorMes = new ArrayList<TotalPorMesDTO>();

        if(servico != null){

            for(var i = 1; i <= meses; i ++){
                var total = registroRepository.encontrarPorDataComFiltro(i, ano, servico).size();
                var mes = converterMesParaString(i);
                totalPorMes.add(new TotalPorMesDTO(mes, total));
            }

            return totalPorMes;
        }

        for(var i = 1; i <= meses; i ++){
            var total = registroRepository.encontrarPorData(i, ano).size();
            var mes = converterMesParaString(i);
            totalPorMes.add(new TotalPorMesDTO(mes, total));
        }

        return totalPorMes;
    }

    public List<TotalPorEquipePorMesDTO> listarTotalPorEquipeNoMes(String servico) {
        int ano = LocalDate.now().getYear();
        int mes = LocalDate.now().getMonthValue();
        List<TotalPorEquipePorMesDTO> resultado = new ArrayList<>();

        if(servico != null){

            List<Object[]> totalRegistros = registroRepository.EncontrarRegistroMensalPorTecnicoComFiltro(mes, ano, servico);
            System.out.println(totalRegistros);
            for (Object[] obj : totalRegistros) {
                // obj[0] é a equipeTecnica (pode ser um objeto), obj[1] é o count (Long)
                Object equipe = obj[0];
                Long valor = (Long) obj[1];

                String nomeEquipe = (equipe != null) ? equipe.toString() : "Desconhecida";

                resultado.add(new TotalPorEquipePorMesDTO(nomeEquipe, valor.intValue()));
            }

            return resultado;
        }

        List<Object[]> totalRegistros = registroRepository.EncontrarRegistroMensalPorTecnicoSemFiltro(mes, ano);

        for (Object[] obj : totalRegistros) {
            // obj[0] é a equipeTecnica (pode ser um objeto), obj[1] é o count (Long)
            Object equipe = obj[0];
            Long valor = (Long) obj[1];

            // Adapte aqui o nome conforme o tipo de equipeTecnica
            String nomeEquipe = (equipe != null) ? equipe.toString() : "Desconhecida";

            resultado.add(new TotalPorEquipePorMesDTO(nomeEquipe, valor.intValue()));
        }

        return resultado;
    }

    private String converterMesParaString(Integer numeroMes){
        switch (numeroMes){
            case 1:
                return "Janeiro";
            case 2:
                return "Fevereiro";
            case 3:
                return "Março";
            case 4:
                return "Abril";
            case 5:
                return "Maio";
            case 6:
                return "Junho";
            case 7:
                return "Julho";
            case 8:
                return "Agosto";
            case 9:
                return "Setembro";
            case 10:
                return "Outubro";
            case 11:
                return "Novembro";
            case 12:
                return "Dezembro";
            default:
                return null;
        }
    }

}
