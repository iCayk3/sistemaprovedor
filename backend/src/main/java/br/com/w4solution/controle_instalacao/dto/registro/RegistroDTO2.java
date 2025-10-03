package br.com.w4solution.controle_instalacao.dto.registro;

import br.com.w4solution.controle_instalacao.domain.registro.Registro;

import java.time.LocalDate;

public record RegistroDTO2(
        Long id,
        String cliente,
        String olt,
        String cto,
        String porta,
        String equipe,
        LocalDate data,
        String procedimento,
        String ctoAntiga,
        String localidade,
        String observacao,
        String login,
        String mac
) {
    public RegistroDTO2(Registro r) {
        this(
                r.getId(),
                r.getClienteRegistro(),
                r.getOltRegistro(),
                r.getCtoRegistros(),
                r.getPortaRegistro(),
                r.getEquipeTecnicaRegistro(),
                r.getDataRegistro(),
                r.getProcedimentoRegistro(),
                r.getCtoAntiga(),
                r.getLocalidade(),
                r.getObservacao(),
                r.getLogin(),
                r.getMac()
        );
    }
}
