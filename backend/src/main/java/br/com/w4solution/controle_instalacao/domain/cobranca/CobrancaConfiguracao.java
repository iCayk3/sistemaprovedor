package br.com.w4solution.controle_instalacao.domain.cobranca;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "cobranca_configuracao")
@Getter
@Setter
@NoArgsConstructor
public class CobrancaConfiguracao {
    @Id
    private Long id = 1L;
    private Boolean permitirFechamentoPorOutroUsuario = false;
}
