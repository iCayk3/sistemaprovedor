package br.com.w4solution.controle_instalacao.infra.configuration.database;

import jakarta.persistence.EntityManagerFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.config.BeanFactoryPostProcessor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;
import java.util.Arrays;

@Configuration
public class DatabaseSchemaMigrationGuard {

    private static final Logger log = LoggerFactory.getLogger(DatabaseSchemaMigrationGuard.class);

    @Bean
    public static BeanFactoryPostProcessor entityManagerDependsOnMigrationGuard() {
        return beanFactory -> {
            for (String beanName : beanFactory.getBeanNamesForType(EntityManagerFactory.class, true, false)) {
                var bd = beanFactory.getBeanDefinition(beanName);
                String[] dependsOn = bd.getDependsOn();
                String[] newDependsOn = dependsOn == null
                        ? new String[]{"databaseMigrationRunner"}
                        : Arrays.copyOf(dependsOn, dependsOn.length + 1);
                newDependsOn[newDependsOn.length - 1] = "databaseMigrationRunner";
                bd.setDependsOn(newDependsOn);
            }
        };
    }

    @Bean("databaseMigrationRunner")
    public DatabaseMigrationRunner databaseMigrationRunner(DataSource dataSource) {
        return new DatabaseMigrationRunner(dataSource);
    }

    public static class DatabaseMigrationRunner {
        public DatabaseMigrationRunner(DataSource dataSource) {
            try (Connection conn = dataSource.getConnection();
                 Statement stmt = conn.createStatement()) {
                if ("PostgreSQL".equalsIgnoreCase(conn.getMetaData().getDatabaseProductName())) {
                    stmt.execute("""
                        DO $$
                        BEGIN
                            IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'faturamento_mensal_titulos') THEN
                                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'faturamento_mensal_titulos' AND column_name = 'cancelado_rbx') THEN
                                    ALTER TABLE faturamento_mensal_titulos ADD COLUMN cancelado_rbx boolean NOT NULL DEFAULT false;
                                END IF;
                                CREATE INDEX IF NOT EXISTS idx_faturamento_cancelado_rbx ON faturamento_mensal_titulos (cancelado_rbx);
                            END IF;
                        END $$;
                    """);
                    log.info("Migração preventiva de schema concluída com sucesso (cancelado_rbx verificado).");
                }
            } catch (Exception e) {
                log.warn("Aviso na migração preventiva de schema: {}", e.getMessage());
            }
        }
    }
}
