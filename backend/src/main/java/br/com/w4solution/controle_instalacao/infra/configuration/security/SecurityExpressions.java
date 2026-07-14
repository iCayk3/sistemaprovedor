package br.com.w4solution.controle_instalacao.infra.configuration.security;

public final class SecurityExpressions {

    private SecurityExpressions() {
    }

    public static final String ADMIN_ONLY = "hasRole('ADMIN')";
    public static final String AUTHENTICATED = "isAuthenticated()";
    public static final String TECHNICAL_ACCESS =
            "hasAnyRole('ADMIN','TECNICO','TECNICO_COMERCIAL','TECNICO_FINANCEIRO')";
    public static final String COMMERCIAL_ACCESS =
            "hasAnyRole('ADMIN','COMERCIAL','TECNICO_COMERCIAL','COMERCIAL_FINANCEIRO')";
    public static final String FINANCIAL_ACCESS =
            "hasAnyRole('ADMIN','FINANCEIRO','TECNICO_FINANCEIRO','COMERCIAL_FINANCEIRO')";
    public static final String CHARGING_ACCESS =
            "hasAnyRole('ADMIN','FINANCEIRO','TECNICO_FINANCEIRO','COMERCIAL_FINANCEIRO','COBRANCA')";
    public static final String COMMERCIAL_OR_FINANCIAL_ACCESS =
            "hasAnyRole('ADMIN','COMERCIAL','TECNICO_COMERCIAL','FINANCEIRO','TECNICO_FINANCEIRO','COMERCIAL_FINANCEIRO','COBRANCA')";
}
