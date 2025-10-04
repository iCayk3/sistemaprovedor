package br.com.w4solution.controle_instalacao.infra.configuration.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfiguration implements WebMvcConfigurer {
    @Value("${api.service.integration.frontend}")
    private String allowed;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("http://localhost:5173/") // Permite apenas requisições desta origem
                .allowedMethods("*")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}


