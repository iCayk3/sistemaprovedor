# SistemaProvedor


# Deploy com Portainer

Use `docker-compose.yml` como stack principal no Portainer.

## Servicos

- `db`: PostgreSQL 17
- `backend`: API Spring Boot na porta interna `8080`
- `frontend`: React servido por Nginx na porta publica `FRONTEND_PORT`

O frontend chama o backend por `/api/`, e o Nginx encaminha internamente para `http://backend:8080`.

## Variaveis para cadastrar no Portainer

```env
DB_CONTAINER_NAME=sistemaprovedor-db
BACKEND_CONTAINER_NAME=sistemaprovedor-backend
FRONTEND_CONTAINER_NAME=sistemaprovedor-frontend

POSTGRES_HOST=db
POSTGRES_DB=controle_instalacao
POSTGRES_USER=postgres
POSTGRES_PASSWORD=troque-por-uma-senha-forte

JWT_SECRET=troque-por-uma-chave-jwt-forte
LINK_RBX=https://seu-endpoint-rbx
API_KEY=sua-chave-rbx
API_FRONTEND=https://seudominio.com
IA_PROVIDER=gemini
OPENAI_API_KEY=sua-chave-openai
OPENAI_MODEL=gpt-5.6-luna
GEMINI_API_KEY=sua-chave-gemini
GEMINI_MODEL=gemini-3.6-flash
GEMINI_MAX_OUTPUT_TOKENS=4096

VITE_API_URL=/api/
VITE_GOOGLE_MAPS_API_KEY=

FRONTEND_PORT=80
```

## Observacoes importantes

- `POSTGRES_HOST` deve ficar como `db` quando o banco subir na mesma stack.
- `API_FRONTEND` deve ser o dominio publico do sistema, por exemplo `https://app.seudominio.com`.
- `VITE_API_URL` deve ficar `/api/` para usar o proxy do Nginx.
- O backend nao precisa publicar a porta `8080`; ele e acessado apenas pelo frontend dentro da rede Docker.
- O volume `postgres_data` preserva os dados do banco entre recriacoes dos containers.
- Nao use valores padrao de senha/segredo em producao.
- `IA_PROVIDER` seleciona `openai` ou `gemini`; reinicie o backend depois de mudar.
- `OPENAI_API_KEY` e `GEMINI_API_KEY` ficam somente no backend e nunca devem usar o prefixo `VITE_`.
- `OPENAI_MODEL` e `GEMINI_MODEL` podem ser alterados sem recompilar.
- `GEMINI_MAX_OUTPUT_TOKENS` controla o tamanho de cada parte; ao atingir o limite, o sistema tenta continuar uma vez.
- Apenas a chave do provedor selecionado precisa estar configurada.

## Passo a passo

1. No Portainer, crie uma Stack.
2. Cole o conteudo de `docker-compose.yml`.
3. Cadastre as variaveis acima em Environment variables.
4. Faca o deploy.
5. Acesse o dominio/porta configurada no `FRONTEND_PORT`.
6. Valide login, dashboards, cobrancas, ACP eventos e consultas RBX.

