# Integracao dos projetos SOL

Este documento registra a migracao das telas dos projetos `dash-clientes` e `acp-event` para dentro do `sistemaprovedor`.

## Projetos avaliados

- `sistemaprovedor`: backend Spring Boot 3.2/Java 17, frontend React/Vite/MUI e Nginx na frente.
- `dash-clientes`: usado como referencia visual e funcional; os endpoints foram migrados para Spring Boot.
- `acp-event`: usado como referencia funcional; a tela foi recriada como pagina MUI dentro do frontend principal e os eventos agora sao persistidos pelo backend Spring Boot.

## Entrada pela aplicacao principal

As telas agora sao rotas internas do `sistemaprovedor`:

- `/financeiro/dashboard-clientes`: Dashboard Clientes, usando backend Spring Boot.
- `/noc-eventos`: ACP Eventos, usando frontend MUI e endpoints Spring Boot.

O Nginx continua com apenas `/api/` apontando para o backend Java. Nao ha mais proxy para containers satelites nessa stack.

## Subir tudo junto

Use o compose a partir da pasta `sistemaprovedor`:

```bash
docker compose -f docker-compose.platform.yml up -d --build
```

Variaveis importantes:

- `JWT_SECRET`: segredo JWT do backend principal.
- `LINK_RBX` e `API_KEY`: integracao RouterBox usada pelo backend Java.
- `FRONTEND_PORT`: porta publica do portal, padrao `80`.

## Proximos passos recomendados

- Evoluir os cards/tabelas do Dashboard Clientes com os mesmos filtros do antigo app, agora usando endpoints Java.
- Remover os projetos satelites do fluxo de deploy quando a migracao estiver homologada.
