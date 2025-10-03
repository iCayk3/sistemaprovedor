INSERT INTO usuarios (id, usuario, senha, status, permissao)
SELECT 1, 'admin', '$2a$10$PaETbH5TwD7aAfrvEkB/kegbDIPdPppcaGnbb/kd9ALo/Ffwa2fXi', 0, 'ADMIN'
WHERE NOT EXISTS (
    SELECT 1 FROM usuarios WHERE usuario = 'admin'
);
