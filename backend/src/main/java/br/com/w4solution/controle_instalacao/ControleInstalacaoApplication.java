package br.com.w4solution.controle_instalacao;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableScheduling
@EnableAsync
@EnableCaching
public class ControleInstalacaoApplication {

	public static void main(String[] args) {
		SpringApplication.run(ControleInstalacaoApplication.class, args);
	}

}
