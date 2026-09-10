INSERT INTO usuarios (id, usuario, senha, status, permissao)
SELECT 1, 'admin', '$2a$10$PaETbH5TwD7aAfrvEkB/kegbDIPdPppcaGnbb/kd9ALo/Ffwa2fXi', 0, 'ADMIN'
WHERE NOT EXISTS (
    SELECT 1 FROM usuarios WHERE usuario = 'admin'
);

-- Backfill idempotente da competencia das vendas anteriores ao novo fluxo comercial.
-- Nao altera conversoes que ja possuem uma data registrada.
UPDATE atividades
SET convertido_em = data::timestamp + INTERVAL '12 hours',
    convertido_por = COALESCE(NULLIF(BTRIM(convertido_por), ''), usuario)
WHERE UPPER(segmento) = 'LEAD'
  AND UPPER(status) = 'CONVERTIDO'
  AND convertido_em IS NULL
  AND data IS NOT NULL;
