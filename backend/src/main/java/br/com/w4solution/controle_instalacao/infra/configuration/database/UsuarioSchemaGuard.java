package br.com.w4solution.controle_instalacao.infra.configuration.database;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.List;

@Component
public class UsuarioSchemaGuard implements ApplicationRunner {

    private final DataSource dataSource;
    private final JdbcTemplate jdbcTemplate;

    public UsuarioSchemaGuard(DataSource dataSource, JdbcTemplate jdbcTemplate) {
        this.dataSource = dataSource;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        try (Connection connection = dataSource.getConnection()) {
            if (!"PostgreSQL".equalsIgnoreCase(connection.getMetaData().getDatabaseProductName())) {
                return;
            }
        }

        List<String> constraints = jdbcTemplate.queryForList("""
                select c.conname
                from pg_constraint c
                join pg_class t on c.conrelid = t.oid
                join pg_attribute a on a.attrelid = t.oid and a.attnum = any(c.conkey)
                where t.relname = 'usuarios'
                  and c.contype = 'c'
                  and a.attname = 'permissao'
                """, String.class);

        for (String constraint : constraints) {
            jdbcTemplate.execute("alter table usuarios drop constraint if exists \"" + constraint.replace("\"", "\"\"") + "\"");
        }

        jdbcTemplate.execute("""
                alter table usuarios
                add constraint usuarios_permissao_check
                check (permissao in (
                    'ADMIN',
                    'TECNICO',
                    'COMERCIAL',
                    'FINANCEIRO',
                    'TECNICO_COMERCIAL',
                    'TECNICO_FINANCEIRO',
                    'COMERCIAL_FINANCEIRO',
                    'COBRANCA',
                    'GUEST'
                ))
                """);
    }
}
