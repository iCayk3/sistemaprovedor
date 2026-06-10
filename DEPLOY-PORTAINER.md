# Deploy com Portainer

Este projeto pode ser publicado no Portainer usando o arquivo [docker-compose.yml](C:/Users/Cayke/.codex/worktrees/6210/sistemaprovedor/docker-compose.yml).

## Estrutura

O stack sobe 3 serviços:

- `db`: PostgreSQL
- `backend`: API Spring Boot
- `frontend`: app React servido por Nginx

O frontend acessa o backend via proxy em `/api/`, evitando problemas de CORS no ambiente publicado.

## Arquivos usados

- [docker-compose.yml](C:/Users/Cayke/.codex/worktrees/6210/sistemaprovedor/docker-compose.yml)
- [.env.portainer.example](C:/Users/Cayke/.codex/worktrees/6210/sistemaprovedor/.env.portainer.example)
- [backend/Dockerfile](C:/Users/Cayke/.codex/worktrees/6210/sistemaprovedor/backend/Dockerfile)
- [frontend/Dockerfile](C:/Users/Cayke/.codex/worktrees/6210/sistemaprovedor/frontend/Dockerfile)
- [frontend/nginx.conf](C:/Users/Cayke/.codex/worktrees/6210/sistemaprovedor/frontend/nginx.conf)

## Variáveis importantes

Use [.env.portainer.example](C:/Users/Cayke/.codex/worktrees/6210/sistemaprovedor/.env.portainer.example) como base e preencha principalmente:

- `POSTGRES_PASSWORD`
- `JWT_SECRET`
- `LINK_RBX`
- `API_KEY`
- `API_FRONTEND`
- `VITE_GOOGLE_MAPS_API_KEY` se o mapa for usado

## Passo a passo no Portainer

1. Crie uma nova `Stack`.
2. Cole o conteúdo de [docker-compose.yml](C:/Users/Cayke/.codex/worktrees/6210/sistemaprovedor/docker-compose.yml).
3. Preencha as variáveis de ambiente com base em [.env.portainer.example](C:/Users/Cayke/.codex/worktrees/6210/sistemaprovedor/.env.portainer.example).
4. Faça o deploy da stack.

## Observações

- O frontend publica por padrão na porta definida em `FRONTEND_PORT`.
- O backend não precisa expor porta pública; ele é acessado internamente pelo Nginx.
- O volume `postgres_data` preserva os dados do banco entre reinicializações.
- Para produção, não use os valores padrão de senha/segredo do exemplo.

## Exemplo de valores

```env
POSTGRES_DB=controle_instalacao
POSTGRES_USER=postgres
POSTGRES_PASSWORD=uma-senha-forte

JWT_SECRET=uma-chave-jwt-forte
LINK_RBX=https://seu-endpoint-rbx
API_KEY=sua-chave-rbx
API_FRONTEND=https://app.seudominio.com

VITE_API_URL=/api/
VITE_GOOGLE_MAPS_API_KEY=
FRONTEND_PORT=80
```

## Pós-deploy

Depois que subir:

1. acesse o frontend pela porta/domínio configurado
2. teste login
3. valide chamadas ao backend
4. valide exportação PDF/Excel
5. valide o mapa, se a chave do Google Maps tiver sido configurada
