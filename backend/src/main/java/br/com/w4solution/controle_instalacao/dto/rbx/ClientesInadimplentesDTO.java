package br.com.w4solution.controle_instalacao.dto.rbx;

import br.com.w4solution.controle_instalacao.dto.cliente.ClienteRbxDTO;

public record ClientesInadimplentesDTO(

        String codigo,

        String nome,

        String telComercial,

        String telResidencial,

        String telCelular,

        String endereco,

        String numero,

        String complemento,

        String bairro,

        String cidade,

        String uf,

        String cep,

        String grupo,

        String situacao,

        Double valorDebito,

        String dataBloqueio,

        String diasBloqueado,

        String vencimentoBoleto,

        Long diasAtrasado
) {
    public ClientesInadimplentesDTO(ClienteRbxDTO rbx, Double valor, ClientesInadiplentesRbxDTO irbx, String vencimento, Long diasAtrasado){
        this(rbx.codigo(), rbx.nome(), rbx.telComercial(), rbx.telResidencial(), rbx.telCelular(), rbx.endereco(), rbx.numero(), rbx.complemento(), rbx.bairro(), rbx.cidade(),
                rbx.uf(),
                rbx.cep(), rbx.grupo(), rbx.situacao(), valor, irbx.dataBloqueio(), irbx.diasBloqueado(), vencimento, diasAtrasado);
    }
    public ClientesInadimplentesDTO(ClienteRbxDTO rbx, Double valor, String vencimento, Long diasAtrasado){
        this(rbx.codigo(), rbx.nome(), rbx.telComercial(), rbx.telResidencial(), rbx.telCelular(), rbx.endereco(), rbx.numero(), rbx.complemento(), rbx.bairro(), rbx.cidade(),
                rbx.uf(),
                rbx.cep(), rbx.grupo(), rbx.situacao(), valor, "", "", vencimento, diasAtrasado);
    }
}
