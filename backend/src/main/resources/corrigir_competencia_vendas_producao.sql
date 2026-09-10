-- Correcao da competencia historica das vendas no dashboard comercial.
--
-- Este script e idempotente: pode ser executado mais de uma vez.
-- Ele preenche somente convertido_em ausente, usando a data original do lead,
-- e preserva todas as datas de conversao que ja estejam registradas.

BEGIN;

UPDATE atividades
SET convertido_em = data::timestamp + INTERVAL '12 hours',
    convertido_por = COALESCE(NULLIF(BTRIM(convertido_por), ''), usuario)
WHERE UPPER(segmento) = 'LEAD'
  AND UPPER(status) = 'CONVERTIDO'
  AND convertido_em IS NULL
  AND data IS NOT NULL;

COMMIT;

-- Conferencia da distribuicao apos a correcao:
SELECT
    EXTRACT(YEAR FROM convertido_em)::integer AS ano,
    EXTRACT(MONTH FROM convertido_em)::integer AS mes,
    COUNT(*) AS vendas
FROM atividades
WHERE UPPER(segmento) = 'LEAD'
  AND UPPER(status) = 'CONVERTIDO'
  AND convertido_em IS NOT NULL
GROUP BY 1, 2
ORDER BY 1, 2;
