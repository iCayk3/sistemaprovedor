package br.com.w4solution.controle_instalacao.services;

import br.com.w4solution.controle_instalacao.services.usuarios.TokenService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ExtratorToken {

    @Autowired
    TokenService token;

    private String recuperarTokenDoCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        String tokenHeader = null;
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("token".equals(cookie.getName())) {
                    tokenHeader = cookie.getValue();
                    break;
                }
            }
        } else {
            System.out.println("Nenhum cookie encontrado.");
        }

        return tokenHeader;
    }

    public final String extrairUsuario(HttpServletRequest request) {
        String tokenHttp = recuperarTokenDoCookie(request);
        if (tokenHttp != null) {
            return token.getSubject(tokenHttp);
        }
        return null; // ou lançar exceção, conforme seu caso de uso
    }

}
