-- Carga de teste para dashboards, leads, cobrancas e ACP Eventos.
-- Rode manualmente no PostgreSQL quando quiser popular o ambiente local.
-- Exemplo:
-- psql -h localhost -U seu_usuario -d seu_banco -f backend/src/main/resources/popular_banco_teste.sql

BEGIN;

-- Opcoes comerciais: atividades
INSERT INTO eventos (evento, segmento)
SELECT 'LIGACAO', 'ATIVIDADE'
WHERE NOT EXISTS (SELECT 1 FROM eventos WHERE evento = 'LIGACAO' AND segmento = 'ATIVIDADE');

INSERT INTO eventos (evento, segmento)
SELECT 'WHATSAPP', 'ATIVIDADE'
WHERE NOT EXISTS (SELECT 1 FROM eventos WHERE evento = 'WHATSAPP' AND segmento = 'ATIVIDADE');

INSERT INTO eventos (evento, segmento)
SELECT 'VISITA', 'ATIVIDADE'
WHERE NOT EXISTS (SELECT 1 FROM eventos WHERE evento = 'VISITA' AND segmento = 'ATIVIDADE');

INSERT INTO eventos (evento, segmento)
SELECT 'VENDA', 'ATIVIDADE'
WHERE NOT EXISTS (SELECT 1 FROM eventos WHERE evento = 'VENDA' AND segmento = 'ATIVIDADE');

INSERT INTO eventos (evento, segmento)
SELECT 'CANCELAMENTO', 'ATIVIDADE'
WHERE NOT EXISTS (SELECT 1 FROM eventos WHERE evento = 'CANCELAMENTO' AND segmento = 'ATIVIDADE');

-- Opcoes comerciais: leads
INSERT INTO eventos (evento, segmento)
SELECT 'INDICACAO', 'LEAD'
WHERE NOT EXISTS (SELECT 1 FROM eventos WHERE evento = 'INDICACAO' AND segmento = 'LEAD');

INSERT INTO eventos (evento, segmento)
SELECT 'WHATSAPP', 'LEAD'
WHERE NOT EXISTS (SELECT 1 FROM eventos WHERE evento = 'WHATSAPP' AND segmento = 'LEAD');

INSERT INTO eventos (evento, segmento)
SELECT 'INSTAGRAM', 'LEAD'
WHERE NOT EXISTS (SELECT 1 FROM eventos WHERE evento = 'INSTAGRAM' AND segmento = 'LEAD');

INSERT INTO eventos (evento, segmento)
SELECT 'SITE', 'LEAD'
WHERE NOT EXISTS (SELECT 1 FROM eventos WHERE evento = 'SITE' AND segmento = 'LEAD');

INSERT INTO eventos (evento, segmento)
SELECT 'EM NEGOCIACAO', 'LEAD'
WHERE NOT EXISTS (SELECT 1 FROM eventos WHERE evento = 'EM NEGOCIACAO' AND segmento = 'LEAD');

INSERT INTO eventos (evento, segmento)
SELECT 'CONVERTIDO', 'LEAD'
WHERE NOT EXISTS (SELECT 1 FROM eventos WHERE evento = 'CONVERTIDO' AND segmento = 'LEAD');

INSERT INTO eventos (evento, segmento)
SELECT 'PERDIDO', 'LEAD'
WHERE NOT EXISTS (SELECT 1 FROM eventos WHERE evento = 'PERDIDO' AND segmento = 'LEAD');

-- Opcoes financeiras: cobranca
INSERT INTO eventos (evento, segmento)
SELECT 'CONTATO REALIZADO', 'COBRANCA'
WHERE NOT EXISTS (SELECT 1 FROM eventos WHERE evento = 'CONTATO REALIZADO' AND segmento = 'COBRANCA');

INSERT INTO eventos (evento, segmento)
SELECT 'SEM RETORNO', 'COBRANCA'
WHERE NOT EXISTS (SELECT 1 FROM eventos WHERE evento = 'SEM RETORNO' AND segmento = 'COBRANCA');

INSERT INTO eventos (evento, segmento)
SELECT 'PROMESSA DE PAGAMENTO', 'COBRANCA'
WHERE NOT EXISTS (SELECT 1 FROM eventos WHERE evento = 'PROMESSA DE PAGAMENTO' AND segmento = 'COBRANCA');

INSERT INTO eventos (evento, segmento)
SELECT 'ACORDO', 'COBRANCA'
WHERE NOT EXISTS (SELECT 1 FROM eventos WHERE evento = 'ACORDO' AND segmento = 'COBRANCA');

INSERT INTO eventos (evento, segmento)
SELECT 'SEGUNDA VIA ENVIADA', 'COBRANCA'
WHERE NOT EXISTS (SELECT 1 FROM eventos WHERE evento = 'SEGUNDA VIA ENVIADA' AND segmento = 'COBRANCA');

INSERT INTO eventos (evento, segmento)
SELECT 'CONTESTACAO', 'COBRANCA'
WHERE NOT EXISTS (SELECT 1 FROM eventos WHERE evento = 'CONTESTACAO' AND segmento = 'COBRANCA');

INSERT INTO eventos (evento, segmento)
SELECT 'NEGATIVACAO', 'COBRANCA'
WHERE NOT EXISTS (SELECT 1 FROM eventos WHERE evento = 'NEGATIVACAO' AND segmento = 'COBRANCA');

INSERT INTO eventos (evento, segmento)
SELECT 'PAGO', 'COBRANCA'
WHERE NOT EXISTS (SELECT 1 FROM eventos WHERE evento = 'PAGO' AND segmento = 'COBRANCA');

-- Registros de atividades, leads e cobrancas dos ultimos dias.
INSERT INTO atividades (evento, cliente, data, usuario, segmento, valor)
SELECT * FROM (VALUES
    ('LIGACAO', 'Cliente 1001 - Maria Silva', CURRENT_DATE, 'admin', 'ATIVIDADE', NULL),
    ('WHATSAPP', 'Cliente 1002 - Joao Souza', CURRENT_DATE, 'admin', 'ATIVIDADE', NULL),
    ('VISITA', 'Cliente 1003 - Ana Costa', CURRENT_DATE - INTERVAL '1 day', 'admin', 'ATIVIDADE', NULL),
    ('VENDA', 'Cliente 1004 - Pedro Lima', CURRENT_DATE - INTERVAL '2 days', 'admin', 'ATIVIDADE', NULL),
    ('CANCELAMENTO', 'Cliente 1005 - Carla Rocha', CURRENT_DATE - INTERVAL '3 days', 'admin', 'ATIVIDADE', NULL),
    ('INDICACAO', 'Lead - Mercado Central', CURRENT_DATE, 'admin', 'LEAD', NULL),
    ('WHATSAPP', 'Lead - Panificadora Sol', CURRENT_DATE, 'admin', 'LEAD', NULL),
    ('INSTAGRAM', 'Lead - Larissa Almeida', CURRENT_DATE - INTERVAL '1 day', 'admin', 'LEAD', NULL),
    ('EM NEGOCIACAO', 'Lead - Condominio Primavera', CURRENT_DATE - INTERVAL '2 days', 'admin', 'LEAD', NULL),
    ('CONVERTIDO', 'Lead - Loja Norte', CURRENT_DATE - INTERVAL '3 days', 'admin', 'LEAD', NULL),
    ('CONTATO REALIZADO', 'Contrato 2001 - Roberto Dias', CURRENT_DATE, 'admin', 'COBRANCA', 149.90),
    ('PROMESSA DE PAGAMENTO', 'Contrato 2002 - Helena Martins', CURRENT_DATE, 'admin', 'COBRANCA', 229.80),
    ('SEGUNDA VIA ENVIADA', 'Contrato 2003 - Paulo Mendes', CURRENT_DATE - INTERVAL '1 day', 'admin', 'COBRANCA', 99.90),
    ('ACORDO', 'Contrato 2004 - Comercio Forte', CURRENT_DATE - INTERVAL '2 days', 'admin', 'COBRANCA', 459.70),
    ('PAGO', 'Contrato 2005 - Julia Ferreira', CURRENT_DATE - INTERVAL '3 days', 'admin', 'COBRANCA', 129.90)
) AS seed(evento, cliente, data, usuario, segmento, valor)
WHERE NOT EXISTS (
    SELECT 1
    FROM atividades a
    WHERE a.evento = seed.evento
      AND a.cliente = seed.cliente
      AND a.data = seed.data::date
      AND a.segmento = seed.segmento
);

-- Eventos ACP/NOC para acompanhamento.
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
SELECT * FROM (VALUES
    ('NOC-2026-9001', 'Rompimentos e sinistros', 'ROMPIMENTO', 'NOC - Lucas', 'Backbone zona norte', 'Capanema', 'Centro', NOW() - INTERVAL '5 hours', NULL, 'Aberto', 'Rompimento em trecho principal. Equipe em deslocamento.', NOW() - INTERVAL '5 hours'),
    ('NOC-2026-9002', 'Operadoras e transporte', 'OPERADORA', 'NOC - Aline', 'Link transporte regional', 'Quatipuru', 'Centro', NOW() - INTERVAL '18 hours', NULL, 'Em andamento', 'Chamado aberto com operadora, aguardando retorno.', NOW() - INTERVAL '18 hours'),
    ('NOC-2026-9003', 'Links dedicados', 'LINK DEDICADO', 'NOC - Rafael', 'Cliente empresarial Alfa', 'Salinopolis', 'Atalaia', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day 20 hours', 'Resolvido', 'Normalizado apos troca de equipamento no cliente.', NOW() - INTERVAL '2 days'),
    ('NOC-2026-9004', 'Rompimentos e sinistros', 'ATENUACAO', 'NOC - Bruna', 'Rede FTTH setor oeste', 'Maracana', 'Sao Jose', NOW() - INTERVAL '4 days', NULL, 'Pausado', 'Evento acima de 72h aguardando janela de manutencao.', NOW() - INTERVAL '4 days'),
    ('NOC-2026-9005', 'Operadoras e transporte', 'PANE ELETRICA', 'NOC - Lucas', 'POP Primavera', 'Primavera', 'Industrial', NOW() - INTERVAL '8 hours', NOW() - INTERVAL '6 hours', 'Resolvido', 'Energia restabelecida e equipamentos validados.', NOW() - INTERVAL '8 hours')
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
WHERE NOT EXISTS (
    SELECT 1 FROM noc_eventos n WHERE n.protocolo = seed.protocolo
);

COMMIT;
