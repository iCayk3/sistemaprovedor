-- Carga completa de teste para exercitar o sistema inteiro.
-- Pensado para PostgreSQL local com schema criado pelo Hibernate (ddl-auto=update).
--
-- Execute a partir da pasta do projeto:
-- & "C:\Program Files\PostgreSQL\17\bin\psql.exe" -h localhost -U postgres -d controle_instalacao -f "backend/src/main/resources/popular_banco_completo_teste.sql"

BEGIN;

-- Hash bcrypt reaproveitado do admin atual para ambiente local de teste.
INSERT INTO usuarios (usuario, senha, status, permissao)
VALUES
    ('admin', '$2a$10$PaETbH5TwD7aAfrvEkB/kegbDIPdPppcaGnbb/kd9ALo/Ffwa2fXi', 0, 'ADMIN'),
    ('tecnico', '$2a$10$PaETbH5TwD7aAfrvEkB/kegbDIPdPppcaGnbb/kd9ALo/Ffwa2fXi', 0, 'TECNICO'),
    ('comercial', '$2a$10$PaETbH5TwD7aAfrvEkB/kegbDIPdPppcaGnbb/kd9ALo/Ffwa2fXi', 0, 'COMERCIAL'),
    ('financeiro', '$2a$10$PaETbH5TwD7aAfrvEkB/kegbDIPdPppcaGnbb/kd9ALo/Ffwa2fXi', 0, 'FINANCEIRO'),
    ('noc', '$2a$10$PaETbH5TwD7aAfrvEkB/kegbDIPdPppcaGnbb/kd9ALo/Ffwa2fXi', 0, 'TECNICO_COMERCIAL'),
    ('atendimento', '$2a$10$PaETbH5TwD7aAfrvEkB/kegbDIPdPppcaGnbb/kd9ALo/Ffwa2fXi', 0, 'COMERCIAL_FINANCEIRO'),
    ('usuario_pendente', '$2a$10$PaETbH5TwD7aAfrvEkB/kegbDIPdPppcaGnbb/kd9ALo/Ffwa2fXi', 2, 'GUEST')
ON CONFLICT (usuario) DO UPDATE
SET status = EXCLUDED.status,
    permissao = EXCLUDED.permissao;

-- Equipes e tecnicos
INSERT INTO equipe_tecnica (nome_equipe)
SELECT seed.nome_equipe
FROM (VALUES
    ('Equipe Norte'),
    ('Equipe Centro'),
    ('Equipe Sul'),
    ('Equipe Fibra'),
    ('Equipe Backbone')
) AS seed(nome_equipe)
WHERE NOT EXISTS (SELECT 1 FROM equipe_tecnica e WHERE e.nome_equipe = seed.nome_equipe);

INSERT INTO tecnicos (nome, equipe_tecnica_id)
SELECT seed.nome, e.id
FROM (VALUES
    ('Lucas NOC', 'Equipe Backbone'),
    ('Aline Torres', 'Equipe Norte'),
    ('Rafael Costa', 'Equipe Centro'),
    ('Bruna Matos', 'Equipe Sul'),
    ('Diego Almeida', 'Equipe Fibra'),
    ('Marcos Lima', 'Equipe Fibra'),
    ('Joana Silva', 'Equipe Centro'),
    ('Paulo Dias', 'Equipe Norte')
) AS seed(nome, equipe)
JOIN equipe_tecnica e ON e.nome_equipe = seed.equipe
WHERE NOT EXISTS (SELECT 1 FROM tecnicos t WHERE t.nome = seed.nome);

-- Procedimentos tecnicos
INSERT INTO procedimentos (procedimento, cor, ativo)
SELECT seed.procedimento, seed.cor, true
FROM (VALUES
    ('INSTALACAO', '#00F07A'),
    ('MUDANCA DE ENDERECO', '#5A76ED'),
    ('SEM INTERNET', '#F0D60D'),
    ('LENTIDAO', '#8338EC'),
    ('MUDANCA DE COMODO', '#B55AED'),
    ('TROCA DE EQUIPAMENTO', '#CA5AED'),
    ('CANCELAMENTO', '#F00700'),
    ('REATIVACAO', '#3A18F0'),
    ('MIGRACAO', '#5C3C92'),
    ('TROCA DE SENHA', '#2EC4B6'),
    ('REPARO', '#E27B58'),
    ('OUTROS', '#A9CAED')
) AS seed(procedimento, cor)
WHERE NOT EXISTS (SELECT 1 FROM procedimentos p WHERE p.procedimento = seed.procedimento);

-- Clientes
INSERT INTO clientes (nome, codigo)
SELECT seed.nome, seed.codigo
FROM (VALUES
    ('Maria Silva', 1001),
    ('Joao Souza', 1002),
    ('Ana Costa', 1003),
    ('Pedro Lima', 1004),
    ('Carla Rocha', 1005),
    ('Roberto Dias', 1006),
    ('Helena Martins', 1007),
    ('Paulo Mendes', 1008),
    ('Comercio Forte LTDA', 1009),
    ('Julia Ferreira', 1010),
    ('Mercado Central', 1011),
    ('Panificadora Sol', 1012),
    ('Condominio Primavera', 1013),
    ('Loja Norte', 1014),
    ('Cliente Empresarial Alfa', 1015),
    ('Backbone Zona Norte', 1016),
    ('POP Primavera', 1017),
    ('Link Transporte Regional', 1018),
    ('Rede FTTH Setor Oeste', 1019),
    ('Cliente Dedicado Omega', 1020)
) AS seed(nome, codigo)
ON CONFLICT (codigo) DO UPDATE
SET nome = EXCLUDED.nome;

-- OLTs, CTOs e portas
INSERT INTO olts (nome)
SELECT seed.nome
FROM (VALUES
    ('OLT-CAPANEMA-01'),
    ('OLT-SALINAS-01'),
    ('OLT-PRIMAVERA-01'),
    ('OLT-QUATIPURU-01')
) AS seed(nome)
WHERE NOT EXISTS (SELECT 1 FROM olts o WHERE o.nome = seed.nome);

INSERT INTO ctos (nome_cto, olt_id, lat, longi)
SELECT seed.nome_cto, o.id, seed.lat, seed.longi
FROM (VALUES
    ('CTO-CAP-001', 'OLT-CAPANEMA-01', '-1.196120', '-47.180210'),
    ('CTO-CAP-002', 'OLT-CAPANEMA-01', '-1.198540', '-47.175820'),
    ('CTO-SAL-001', 'OLT-SALINAS-01', '-0.613340', '-47.356980'),
    ('CTO-SAL-002', 'OLT-SALINAS-01', '-0.618910', '-47.350120'),
    ('CTO-PRI-001', 'OLT-PRIMAVERA-01', '-0.945410', '-47.112370'),
    ('CTO-QUA-001', 'OLT-QUATIPURU-01', '-0.899500', '-47.006200')
) AS seed(nome_cto, olt_nome, lat, longi)
JOIN olts o ON o.nome = seed.olt_nome
ON CONFLICT (nome_cto) DO UPDATE
SET olt_id = EXCLUDED.olt_id,
    lat = EXCLUDED.lat,
    longi = EXCLUDED.longi;

INSERT INTO portas (porta, cliente_id, login, cto_id)
SELECT seed.porta, c.id, seed.login, cto.id
FROM (VALUES
    (1, 1001, 'maria.silva', 'CTO-CAP-001'),
    (2, 1002, 'joao.souza', 'CTO-CAP-001'),
    (3, 1003, 'ana.costa', 'CTO-CAP-001'),
    (4, 1004, 'pedro.lima', 'CTO-CAP-002'),
    (5, 1005, 'carla.rocha', 'CTO-CAP-002'),
    (1, 1006, 'roberto.dias', 'CTO-SAL-001'),
    (2, 1007, 'helena.martins', 'CTO-SAL-001'),
    (3, 1008, 'paulo.mendes', 'CTO-SAL-002'),
    (4, 1009, 'comercio.forte', 'CTO-SAL-002'),
    (1, 1010, 'julia.ferreira', 'CTO-PRI-001'),
    (2, 1011, 'mercado.central', 'CTO-PRI-001'),
    (1, 1012, 'panificadora.sol', 'CTO-QUA-001')
) AS seed(porta, codigo_cliente, login, nome_cto)
JOIN clientes c ON c.codigo = seed.codigo_cliente
JOIN ctos cto ON cto.nome_cto = seed.nome_cto
ON CONFLICT (login) DO UPDATE
SET porta = EXCLUDED.porta,
    cliente_id = EXCLUDED.cliente_id,
    cto_id = EXCLUDED.cto_id;

-- Registros tecnicos para dashboards e overview
INSERT INTO registros (
    cliente_registro,
    olt_registro,
    cto_registros,
    porta_registro,
    equipe_tecnica_registro,
    data_registro,
    procedimento_registro,
    cto_antiga,
    localidade,
    observacao,
    login,
    mac
)
SELECT *
FROM (VALUES
    ('1001', 'OLT-CAPANEMA-01', 'CTO-CAP-001', '1', 'Equipe Norte : Aline Torres, Paulo Dias', CURRENT_DATE, 'INSTALACAO', NULL, 'Capanema', 'Instalacao residencial concluida.', 'maria.silva', 'AA:BB:CC:00:01:01'),
    ('1002', 'OLT-CAPANEMA-01', 'CTO-CAP-001', '2', 'Equipe Norte : Aline Torres', CURRENT_DATE, 'SEM INTERNET', NULL, 'Capanema', 'Drop rompido substituido.', 'joao.souza', 'AA:BB:CC:00:01:02'),
    ('1003', 'OLT-CAPANEMA-01', 'CTO-CAP-001', '3', 'Equipe Centro : Rafael Costa', CURRENT_DATE - INTERVAL '1 day', 'LENTIDAO', NULL, 'Capanema', 'Nivel optico ajustado.', 'ana.costa', 'AA:BB:CC:00:01:03'),
    ('1004', 'OLT-CAPANEMA-01', 'CTO-CAP-002', '4', 'Equipe Fibra : Diego Almeida, Marcos Lima', CURRENT_DATE - INTERVAL '2 days', 'MUDANCA DE ENDERECO', 'CTO-CAP-001', 'Capanema', 'Mudanca concluida.', 'pedro.lima', 'AA:BB:CC:00:01:04'),
    ('1005', 'OLT-CAPANEMA-01', 'CTO-CAP-002', '5', 'Equipe Centro : Joana Silva', CURRENT_DATE - INTERVAL '3 days', 'CANCELAMENTO', NULL, 'Capanema', 'Retirada agendada.', 'carla.rocha', 'AA:BB:CC:00:01:05'),
    ('1006', 'OLT-SALINAS-01', 'CTO-SAL-001', '1', 'Equipe Sul : Bruna Matos', CURRENT_DATE - INTERVAL '4 days', 'REATIVACAO', NULL, 'Salinopolis', 'Cliente reativado.', 'roberto.dias', 'AA:BB:CC:00:02:01'),
    ('1007', 'OLT-SALINAS-01', 'CTO-SAL-001', '2', 'Equipe Sul : Bruna Matos', CURRENT_DATE - INTERVAL '5 days', 'TROCA DE EQUIPAMENTO', NULL, 'Salinopolis', 'ONU substituida.', 'helena.martins', 'AA:BB:CC:00:02:02'),
    ('1008', 'OLT-SALINAS-01', 'CTO-SAL-002', '3', 'Equipe Fibra : Diego Almeida', CURRENT_DATE - INTERVAL '6 days', 'REPARO', NULL, 'Salinopolis', 'Conector recrimpado.', 'paulo.mendes', 'AA:BB:CC:00:02:03'),
    ('1009', 'OLT-SALINAS-01', 'CTO-SAL-002', '4', 'Equipe Backbone : Lucas NOC', CURRENT_DATE - INTERVAL '7 days', 'MIGRACAO', NULL, 'Salinopolis', 'Migracao de plano empresarial.', 'comercio.forte', 'AA:BB:CC:00:02:04'),
    ('1010', 'OLT-PRIMAVERA-01', 'CTO-PRI-001', '1', 'Equipe Centro : Rafael Costa, Joana Silva', CURRENT_DATE - INTERVAL '8 days', 'TROCA DE SENHA', NULL, 'Primavera', 'Senha PPPoE atualizada.', 'julia.ferreira', 'AA:BB:CC:00:03:01'),
    ('1011', 'OLT-PRIMAVERA-01', 'CTO-PRI-001', '2', 'Equipe Fibra : Marcos Lima', CURRENT_DATE - INTERVAL '20 days', 'INSTALACAO', NULL, 'Primavera', 'Instalacao comercial.', 'mercado.central', 'AA:BB:CC:00:03:02'),
    ('1012', 'OLT-QUATIPURU-01', 'CTO-QUA-001', '1', 'Equipe Norte : Paulo Dias', CURRENT_DATE - INTERVAL '35 days', 'SEM INTERNET', NULL, 'Quatipuru', 'Atendimento em campo.', 'panificadora.sol', 'AA:BB:CC:00:04:01'),
    ('1013', 'OLT-PRIMAVERA-01', 'CTO-PRI-001', '3', 'Equipe Backbone : Lucas NOC', CURRENT_DATE - INTERVAL '65 days', 'OUTROS', NULL, 'Primavera', 'Vistoria tecnica.', 'condominio.primavera', 'AA:BB:CC:00:03:03'),
    ('1014', 'OLT-QUATIPURU-01', 'CTO-QUA-001', '2', 'Equipe Sul : Bruna Matos', CURRENT_DATE - INTERVAL '95 days', 'INSTALACAO', NULL, 'Quatipuru', 'Instalacao loja.', 'loja.norte', 'AA:BB:CC:00:04:02'),
    ('1015', 'OLT-SALINAS-01', 'CTO-SAL-002', '5', 'Equipe Backbone : Lucas NOC', CURRENT_DATE - INTERVAL '125 days', 'MIGRACAO', NULL, 'Salinopolis', 'Link dedicado migrado.', 'cliente.alfa', 'AA:BB:CC:00:02:05')
) AS seed(
    cliente_registro,
    olt_registro,
    cto_registros,
    porta_registro,
    equipe_tecnica_registro,
    data_registro,
    procedimento_registro,
    cto_antiga,
    localidade,
    observacao,
    login,
    mac
)
WHERE NOT EXISTS (
    SELECT 1
    FROM registros r
    WHERE r.login = seed.login
      AND r.data_registro = seed.data_registro::date
      AND r.procedimento_registro = seed.procedimento_registro
);

-- Tipos de atividades, leads e cobrancas
INSERT INTO eventos (evento, segmento)
SELECT seed.evento, seed.segmento
FROM (VALUES
    ('LIGACAO', 'ATIVIDADE'),
    ('WHATSAPP', 'ATIVIDADE'),
    ('VISITA', 'ATIVIDADE'),
    ('VENDA', 'ATIVIDADE'),
    ('CANCELAMENTO', 'ATIVIDADE'),
    ('POS-VENDA', 'ATIVIDADE'),
    ('INDICACAO', 'LEAD'),
    ('WHATSAPP', 'LEAD'),
    ('INSTAGRAM', 'LEAD'),
    ('SITE', 'LEAD'),
    ('EM NEGOCIACAO', 'LEAD'),
    ('CONVERTIDO', 'LEAD'),
    ('PERDIDO', 'LEAD'),
    ('CONTATO REALIZADO', 'COBRANCA'),
    ('SEM RETORNO', 'COBRANCA'),
    ('PROMESSA DE PAGAMENTO', 'COBRANCA'),
    ('ACORDO', 'COBRANCA'),
    ('SEGUNDA VIA ENVIADA', 'COBRANCA'),
    ('CONTESTACAO', 'COBRANCA'),
    ('NEGATIVACAO', 'COBRANCA'),
    ('PAGO', 'COBRANCA')
) AS seed(evento, segmento)
WHERE NOT EXISTS (
    SELECT 1 FROM eventos e WHERE e.evento = seed.evento AND e.segmento = seed.segmento
);

INSERT INTO atividades (evento, cliente, data, usuario, segmento, valor)
SELECT *
FROM (VALUES
    ('LIGACAO', 'Cliente 1001 - Maria Silva', CURRENT_DATE, 'comercial', 'ATIVIDADE', NULL),
    ('WHATSAPP', 'Cliente 1002 - Joao Souza', CURRENT_DATE, 'comercial', 'ATIVIDADE', NULL),
    ('VISITA', 'Cliente 1003 - Ana Costa', CURRENT_DATE, 'atendimento', 'ATIVIDADE', NULL),
    ('VENDA', 'Cliente 1004 - Pedro Lima', CURRENT_DATE - INTERVAL '1 day', 'comercial', 'ATIVIDADE', NULL),
    ('POS-VENDA', 'Cliente 1011 - Mercado Central', CURRENT_DATE - INTERVAL '2 days', 'atendimento', 'ATIVIDADE', NULL),
    ('CANCELAMENTO', 'Cliente 1005 - Carla Rocha', CURRENT_DATE - INTERVAL '3 days', 'comercial', 'ATIVIDADE', NULL),
    ('INDICACAO', 'Lead - Mercado Central', CURRENT_DATE, 'comercial', 'LEAD', NULL),
    ('WHATSAPP', 'Lead - Panificadora Sol', CURRENT_DATE, 'atendimento', 'LEAD', NULL),
    ('INSTAGRAM', 'Lead - Larissa Almeida', CURRENT_DATE, 'comercial', 'LEAD', NULL),
    ('SITE', 'Lead - Provedor Rural', CURRENT_DATE - INTERVAL '1 day', 'atendimento', 'LEAD', NULL),
    ('EM NEGOCIACAO', 'Lead - Condominio Primavera', CURRENT_DATE - INTERVAL '2 days', 'comercial', 'LEAD', NULL),
    ('CONVERTIDO', 'Lead - Loja Norte', CURRENT_DATE - INTERVAL '3 days', 'comercial', 'LEAD', NULL),
    ('PERDIDO', 'Lead - Sitio Bela Vista', CURRENT_DATE - INTERVAL '4 days', 'atendimento', 'LEAD', NULL),
    ('CONTATO REALIZADO', 'Contrato 2001 - Roberto Dias', CURRENT_DATE, 'financeiro', 'COBRANCA', 149.90),
    ('PROMESSA DE PAGAMENTO', 'Contrato 2002 - Helena Martins', CURRENT_DATE, 'financeiro', 'COBRANCA', 229.80),
    ('SEGUNDA VIA ENVIADA', 'Contrato 2003 - Paulo Mendes', CURRENT_DATE, 'atendimento', 'COBRANCA', 99.90),
    ('ACORDO', 'Contrato 2004 - Comercio Forte', CURRENT_DATE - INTERVAL '1 day', 'financeiro', 'COBRANCA', 459.70),
    ('SEM RETORNO', 'Contrato 2006 - Cliente Teste', CURRENT_DATE - INTERVAL '1 day', 'financeiro', 'COBRANCA', 179.90),
    ('CONTESTACAO', 'Contrato 2007 - Cliente Contestacao', CURRENT_DATE - INTERVAL '2 days', 'atendimento', 'COBRANCA', 319.40),
    ('NEGATIVACAO', 'Contrato 2008 - Cliente Negativacao', CURRENT_DATE - INTERVAL '3 days', 'financeiro', 'COBRANCA', 699.00),
    ('PAGO', 'Contrato 2005 - Julia Ferreira', CURRENT_DATE - INTERVAL '4 days', 'financeiro', 'COBRANCA', 129.90)
) AS seed(evento, cliente, data, usuario, segmento, valor)
WHERE NOT EXISTS (
    SELECT 1
    FROM atividades a
    WHERE a.evento = seed.evento
      AND a.cliente = seed.cliente
      AND a.data = seed.data::date
      AND a.segmento = seed.segmento
);

-- ACP/NOC
INSERT INTO noc_eventos (
    protocolo,
    origem,
    tipo_evento,
    tecnico,
    cliente,
    cidade,
    bairro,
    inicio,
    fim,
    status_problema,
    observacoes,
    criado_em
)
SELECT *
FROM (VALUES
    ('NOC-2026-9001', 'Rompimentos e sinistros', 'ROMPIMENTO', 'NOC - Lucas', 'Backbone zona norte', 'Capanema', 'Centro', NOW() - INTERVAL '5 hours', NULL, 'Aberto', 'Rompimento em trecho principal. Equipe em deslocamento.', NOW() - INTERVAL '5 hours'),
    ('NOC-2026-9002', 'Operadoras e transporte', 'OPERADORA', 'NOC - Aline', 'Link transporte regional', 'Quatipuru', 'Centro', NOW() - INTERVAL '18 hours', NULL, 'Em andamento', 'Chamado aberto com operadora, aguardando retorno.', NOW() - INTERVAL '18 hours'),
    ('NOC-2026-9003', 'Links dedicados', 'LINK DEDICADO', 'NOC - Rafael', 'Cliente empresarial Alfa', 'Salinopolis', 'Atalaia', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day 20 hours', 'Resolvido', 'Normalizado apos troca de equipamento no cliente.', NOW() - INTERVAL '2 days'),
    ('NOC-2026-9004', 'Rompimentos e sinistros', 'ATENUACAO', 'NOC - Bruna', 'Rede FTTH setor oeste', 'Maracana', 'Sao Jose', NOW() - INTERVAL '4 days', NULL, 'Pausado', 'Evento acima de 72h aguardando janela de manutencao.', NOW() - INTERVAL '4 days'),
    ('NOC-2026-9005', 'Operadoras e transporte', 'PANE ELETRICA', 'NOC - Lucas', 'POP Primavera', 'Primavera', 'Industrial', NOW() - INTERVAL '8 hours', NOW() - INTERVAL '6 hours', 'Resolvido', 'Energia restabelecida e equipamentos validados.', NOW() - INTERVAL '8 hours'),
    ('NOC-2026-9006', 'Links dedicados', 'QUEIMA DE EQUIPAMENTO', 'NOC - Joana', 'Cliente Dedicado Omega', 'Capanema', 'Sao Cristovao', NOW() - INTERVAL '26 hours', NULL, 'Aberto', 'Equipamento aguardando substituicao.', NOW() - INTERVAL '26 hours')
) AS seed(
    protocolo,
    origem,
    tipo_evento,
    tecnico,
    cliente,
    cidade,
    bairro,
    inicio,
    fim,
    status_problema,
    observacoes,
    criado_em
)
WHERE NOT EXISTS (SELECT 1 FROM noc_eventos n WHERE n.protocolo = seed.protocolo);

-- Cobrancas no fluxo novo
INSERT INTO cobrancas (
    protocolo,
    acao,
    codigo_cliente,
    cliente,
    data,
    data_promessa,
    valor,
    status,
    observacao,
    criado_em,
    atualizado_em,
    fechado_em
)
SELECT *
FROM (VALUES
    ('COB-2026-9001', 'Contato', 1001, 'Maria Silva', CURRENT_DATE, NULL, 189.90, 'Aberto', 'Cliente solicitou retorno no fim do dia.', NOW() - INTERVAL '4 hours', NULL, NULL),
    ('COB-2026-9002', 'Promessa de pagamento', 1002, 'Helena Martins', CURRENT_DATE, CURRENT_DATE, 229.80, 'Promessa de pagamento', 'Promessa para pagamento hoje via PIX.', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '1 hour', NULL),
    ('COB-2026-9003', 'Segunda via enviada', 1003, 'Paulo Mendes', CURRENT_DATE - INTERVAL '1 day', NULL, 99.90, 'Em negociacao', 'Segunda via enviada por WhatsApp.', NOW() - INTERVAL '1 day', NOW() - INTERVAL '3 hours', NULL),
    ('COB-2026-9004', 'Acordo', 1004, 'Comercio Forte', CURRENT_DATE - INTERVAL '2 days', NULL, 459.70, 'Fechado', 'Acordo fechado e registrado no RBX.', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
    ('COB-2026-9005', 'Pago', 1005, 'Julia Ferreira', CURRENT_DATE - INTERVAL '3 days', NULL, 129.90, 'Pago', 'Pagamento confirmado.', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
    ('COB-2026-9006', 'Sem retorno', 1006, 'Cliente Teste', CURRENT_DATE - INTERVAL '4 days', CURRENT_DATE - INTERVAL '1 day', 179.90, 'Promessa de pagamento', 'Promessa vencida para testar alerta.', NOW() - INTERVAL '4 days', NOW() - INTERVAL '2 days', NULL)
) AS seed(
    protocolo,
    acao,
    codigo_cliente,
    cliente,
    data,
    data_promessa,
    valor,
    status,
    observacao,
    criado_em,
    atualizado_em,
    fechado_em
)
WHERE NOT EXISTS (SELECT 1 FROM cobrancas c WHERE c.protocolo = seed.protocolo);

-- Solicitacoes pendentes de redefinicao de senha.
-- Se sua tabela foi criada com outro nome pelo Hibernate, esta parte e ignorada.
DO $$
BEGIN
    IF to_regclass('public.redefinir_senhas') IS NOT NULL THEN
        INSERT INTO redefinir_senhas (usuario, senha, status)
        SELECT seed.usuario, seed.senha, seed.status
        FROM (VALUES
            ('usuario_pendente', '$2a$10$PaETbH5TwD7aAfrvEkB/kegbDIPdPppcaGnbb/kd9ALo/Ffwa2fXi', 2),
            ('financeiro', '$2a$10$PaETbH5TwD7aAfrvEkB/kegbDIPdPppcaGnbb/kd9ALo/Ffwa2fXi', 2)
        ) AS seed(usuario, senha, status)
        WHERE NOT EXISTS (SELECT 1 FROM redefinir_senhas r WHERE r.usuario = seed.usuario);
    ELSIF to_regclass('public.redefinirsenhas') IS NOT NULL THEN
        INSERT INTO redefinirsenhas (usuario, senha, status)
        SELECT seed.usuario, seed.senha, seed.status
        FROM (VALUES
            ('usuario_pendente', '$2a$10$PaETbH5TwD7aAfrvEkB/kegbDIPdPppcaGnbb/kd9ALo/Ffwa2fXi', 2),
            ('financeiro', '$2a$10$PaETbH5TwD7aAfrvEkB/kegbDIPdPppcaGnbb/kd9ALo/Ffwa2fXi', 2)
        ) AS seed(usuario, senha, status)
        WHERE NOT EXISTS (SELECT 1 FROM redefinirsenhas r WHERE r.usuario = seed.usuario);
    END IF;
END $$;

COMMIT;
