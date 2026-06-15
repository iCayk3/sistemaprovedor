package br.com.w4solution.controle_instalacao.infra.configuration.security;

import br.com.w4solution.controle_instalacao.repository.usuarios.UsuarioRepository;
import br.com.w4solution.controle_instalacao.services.usuarios.TokenService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class SecurityFilter extends OncePerRequestFilter {
    private static final AntPathMatcher PATH_MATCHER = new AntPathMatcher();
    private static final List<RouteRule> PUBLIC_ROUTES = List.of(
            new RouteRule(HttpMethod.POST, "/usuario"),
            new RouteRule(HttpMethod.POST, "/usuario/logar"),
            new RouteRule(HttpMethod.POST, "/usuario/userchek"),
            new RouteRule(HttpMethod.POST, "/usuario/solicitaredefinirsenha"),
            new RouteRule(HttpMethod.POST, "/usuario/ativar/**")
    );

    @Autowired
    TokenService service;

    @Autowired
    UsuarioRepository repository;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String servletPath = request.getServletPath();
        return PUBLIC_ROUTES.stream().anyMatch(route ->
                route.method().matches(request.getMethod()) && PATH_MATCHER.match(route.path(), servletPath));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String tokenJWT = recuperarTokenDoCookie(request);

        if (tokenJWT != null) {
            try {
                var subject = service.getSubject(tokenJWT);
                var usuario = repository.findByUsuario(subject)
                        .orElseThrow(() -> new RuntimeException("Usuario nao encontrado no filtro de seguranca"));

                var authentication = new UsernamePasswordAuthenticationToken(
                        usuario, null, usuario.getAuthorities());

                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (RuntimeException exception) {
                SecurityContextHolder.clearContext();
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Token invalido ou expirado");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private String recuperarTokenDoCookie(HttpServletRequest request) {
        if (request.getCookies() != null) {
            for (jakarta.servlet.http.Cookie cookie : request.getCookies()) {
                if ("token".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }

    private String recuperarToken(HttpServletRequest request) {
        var authorizationHeader = request.getHeader("Authorization");
        if (authorizationHeader != null) {
            return authorizationHeader.replace("Bearer ", "");
        }
        return null;
    }

    private record RouteRule(HttpMethod method, String path) {
    }
}
