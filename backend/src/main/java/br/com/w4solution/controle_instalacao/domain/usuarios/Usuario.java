package br.com.w4solution.controle_instalacao.domain.usuarios;

import br.com.w4solution.controle_instalacao.dto.usuarios.TrocaSenhaDTO;
import br.com.w4solution.controle_instalacao.dto.usuarios.UsuarioCadastroDTO;
import br.com.w4solution.controle_instalacao.infra.configuration.exceptions.SenhaValidacaoExcepetion;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "usuarios")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@EqualsAndHashCode(of = "id")
public class Usuario implements UserDetails {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(unique = true)
    private String usuario;
    private String senha;
    private Status status = Status.PENDENTE;
    @Enumerated(EnumType.STRING)
    private UserRole permissao = UserRole.GUEST;

    public Usuario(UsuarioCadastroDTO dados) {
        this.usuario = dados.usuario();
        this.senha = new BCryptPasswordEncoder().encode(dados.senha());
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        List<GrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new SimpleGrantedAuthority("ROLE_USER"));
        authorities.add(new SimpleGrantedAuthority("ROLE_" + permissao.name()));

        switch (permissao) {
            case ADMIN -> authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
            case TECNICO -> authorities.add(new SimpleGrantedAuthority("ROLE_TECNICO"));
            case COMERCIAL -> authorities.add(new SimpleGrantedAuthority("ROLE_COMERCIAL"));
            case FINANCEIRO -> authorities.add(new SimpleGrantedAuthority("ROLE_FINANCEIRO"));
            case TECNICO_COMERCIAL -> {
                authorities.add(new SimpleGrantedAuthority("ROLE_TECNICO"));
                authorities.add(new SimpleGrantedAuthority("ROLE_COMERCIAL"));
            }
            case TECNICO_FINANCEIRO -> {
                authorities.add(new SimpleGrantedAuthority("ROLE_TECNICO"));
                authorities.add(new SimpleGrantedAuthority("ROLE_FINANCEIRO"));
            }
            case COMERCIAL_FINANCEIRO -> {
                authorities.add(new SimpleGrantedAuthority("ROLE_COMERCIAL"));
                authorities.add(new SimpleGrantedAuthority("ROLE_FINANCEIRO"));
            }
            case COBRANCA -> authorities.add(new SimpleGrantedAuthority("ROLE_COBRANCA"));
            case GUEST -> authorities.add(new SimpleGrantedAuthority("ROLE_GUEST"));
        }

        return authorities;
    }

    @Override
    public String getPassword() {
        return senha;
    }

    @Override
    public String getUsername() {
        return usuario;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }

    public void trocarSenha(TrocaSenhaDTO senhas) {
        if (senhas.novaSenha().length() < 8) {
            throw new SenhaValidacaoExcepetion("Senha menor que 8");
        }

        if (!senhas.novaSenha().equals(senhas.confirmaSenha())) {
            throw new SenhaValidacaoExcepetion("Nova senha e confirmação não coincidem");
        }

        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

        // Verifica se a senha atual fornecida bate com a armazenada
        if (!encoder.matches(senhas.senhaAtual(), this.senha)) {
            throw new SenhaValidacaoExcepetion("Senha atual incorreta!");
        }

        // Atualiza a senha
        this.senha = encoder.encode(senhas.novaSenha());
    }

    public void alterarStatus(Status status) {
        this.status = status;
    }

    public void alterarPermissao(UserRole role) {
        this.permissao = role;
    }
}
