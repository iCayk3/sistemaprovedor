package br.com.w4solution.controle_instalacao.domain.usuarios;

import lombok.Getter;

@Getter
public enum UserRole {
    ADMIN("admin"),
    TECNICO("tecnico"),
    COMERCIAL("comercial"),
    FINANCEIRO("financeiro"),
    TECNICO_COMERCIAL("tecnico_comercial"),
    TECNICO_FINANCEIRO("tecnico_financeiro"),
    COMERCIAL_FINANCEIRO("comercial_financeiro"),
    COBRANCA("cobranca"),
    GUEST("guest");

    private String role;

    UserRole (String role){
        this.role = role;
    }
}
