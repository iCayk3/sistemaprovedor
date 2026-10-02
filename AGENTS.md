# Diretrizes do Projeto Sistema Provedor (SOL Provedor)

Este documento define as regras e restrições obrigatórias para qualquer agente, desenvolvedor ou assistente que for implementar, alterar ou refatorar funcionalidades neste repositório.

---

## 1. Diretrizes de Interface (UI/UX) - Exibição de Informações e Status

> [!IMPORTANT]
> **NÃO UTILIZE BADGES, PÍLULAS, MOLDURAS OU BORDAS PARA EXIBIR STATUS OU INFORMAÇÕES.**

1. **Tipografia Limpa com Cores Semânticas**:
   - Em tabelas, cards, headers, resumos e painéis, informações como status (*Pago, Aberta, Resolvido, Ativo, Bloqueado*), metas (*Abaixo da meta, Dentro da meta*), porcentagens (*% da meta, % de inadimplência*) e contadores **NÃO** devem ser envolvidas em badges ou contornos (`Chip variant="outlined"`, pills com border, molduras de caixa).
   - Utilize texto direto com a cor correspondente usando `<Typography>` do MUI:
     - **Sucesso / Positivo**: `color="success.main"` (ex: *Pago*, *Resolvido*, *Dentro da meta*, *Ativo*)
     - **Alerta / Erro**: `color="error.main"` (ex: *Abaixo da meta*, *Acima do limite*, *Bloqueado*, *Vencido*, *Excluída*)
     - **Atenção**: `color="warning.main"` (ex: *Pendente*, *Em atendimento*, *No limite*)
     - **Muted / Sutil**: `color="text.secondary"` ou `dashboardMutedTextSx` para rótulos secundários.
   - Utilize peso visual (`fontWeight: 700` ou `800`) para dar legibilidade sem poluição visual.

2. **Tema Centralizado (`frontend/src/Utils/appTheme.js`)**:
   - O componente `MuiChip` possui override global desabilitando bordas (`border: none !important`).
   - O uso de `<Chip>` é restrito a seletores de tags interativas em campos de entrada (ex: `Autocomplete multiple` para exclusão de tags com ícone de fechar), e nunca como exibidor passivo de status.

---

## 2. Regras de Negócio e Dados RouterBox (RBX)

1. **Separação de Planos Cobrados vs. Controle de Banda / TV**:
   - No RBX, contratos com `valorLiquido == 0 && valorBruto == 0` (R$ 0,00) são contratos auxiliares usados exclusivamente para controle de velocidade/banda ou associação ao login PPPoE / streaming de TV.
   - Planos cobrados são aqueles com mensalidade ativa (`valorLiquido > 0 || valorBruto > 0`).
   - Sempre que exibir relatórios comerciais ou quantitativos de planos, garanta a separação clara entre planos cobrados e controle de banda.

2. **Diferenciação de Métrica: Pessoas (Clientes Únicos) vs. Contratos**:
   - **Contratos**: Contagem bruta de contratos cadastrados.
   - **Pessoas (Clientes Únicos)**: Contagem desduplicada pelo código do cliente (`codigoCliente`), refletindo o número real de indivíduos/assinantes.

---

## 3. Integração RBX v2 e Auditoria de Conexões (Radius / Marco Civil)

1. **Particularidades do Webservice RBX v2 (`radius_extract`)**:
   - **Obrigatoriedade de Parâmetros**: Os campos `start_time` e `stop_time` são **estritamente obrigatórios em conjunto**. A omissão de qualquer um deles (ou envio apenas de `ipaddress`) resulta em erro `HTTP 412 Precondition Failed` retornado pelo RBX.
   - **Filtro de IP e Desempenho**: O RBX não filtra o IP indexado no SQL da API `radius_extract`; a consulta varre a tabela `radacct` com base no período de datas. O filtro estrito de IP (IPv4 e IPv6) deve ser garantido em memória pelo nosso backend.
   - **Timeouts Estendidos**: Consultas ao extrato de radius no RBX podem levar entre 60 e 120 segundos. Manter o timeout de leitura do backend em **240s** e o proxy do Nginx (`frontend/nginx.conf`) em **300s** para prevenir erros 504 Gateway Time-out.

2. **Desafio do Marco Civil (Conexões de Longa Duração)**:
   - Em ofícios judiciais/policiais, tem-se apenas o IP e a Data/Hora da ocorrência, sem conhecimento prévio do início ou término da conexão PPPoE do assinante.
   - No SQL interno do RBX, sessões cuja desconexão ocorreu após o `stop_time` informado são desconsideradas.
   - **Estratégia Heurística via API**: Em consultas pontuais de data/hora, expandir a janela de busca (+2 dias à frente, retroativo de 1 dia, limitada à data atual) e filtrar em memória a interseção temporal da sessão ativa no evento.
   - **Solução Ideal / Definitiva**: Conexão direta de leitura (`SELECT`) na tabela `radacct` do banco do FreeRADIUS/RBX (`framedipaddress = :ip AND acctstarttime <= :dt AND (acctstoptime >= :dt OR acctstoptime IS NULL)`), que responde de forma instantânea (< 50ms) e sem restrição de janela temporal.

---

## 4. Padrões de Ambiente, Deploy e Execução

1. **Build Obrigatório no Docker ("Builda no meu docker sempre")**:
   - Qualquer implementação, ajuste ou refatoração no backend (`backend/`) ou frontend (`frontend/`) deve ser **obrigatoriamente compilada e reiniciada no ambiente Docker local**:
     - Backend: `docker compose build backend && docker compose up -d backend`
     - Frontend: `docker compose build frontend && docker compose up -d frontend`
   - Sempre verificar logs e saúde do container (`docker ps` / `docker logs`) após o deploy.

2. **Backend (Java / Spring Boot)**:
   - Utilizar **Constructor Injection** com atributos `private final`. Não utilizar `@Autowired` em atributos privados.
   - O ambiente Docker compila com Eclipse Temurin 17.

3. **Frontend (React / Vite / MUI)**:
   - Utilizar a paleta e tema definidos em `appTheme.js` e `DashboardTheme.js`.
   - Não reintroduzir `@mui/joy` ou bibliotecas duplicadas.
   - Respeitar a API em `frontend/src/Services/Api`.

---

## 5. Diretrizes de Segurança da Informação e Hardening

1. **Validação Estrita de Entrada no Servidor (Bean Validation)**:
   - Todo DTO de requisição (`@RequestBody`) que receba dados de mutação deve conter anotações estritas do Jakarta Bean Validation (`@NotBlank`, `@NotNull`, `@Size`, `@Pattern`, `@PositiveOrZero`, `@DecimalMax`).
   - Nos Controllers, o parâmetro anotado com `@RequestBody` **deve obrigatoriamente possuir `@Valid`** (ou `@Validated` no nível de classe quando houver validação de coleções como `List<@Valid DTO>`).

2. **Prevenção de IDOR (Insecure Direct Object Reference) e Autorização de Exclusão**:
   - **Registros Operacionais e Comerciais**: Rotas de exclusão e mutação (ex: `Registro`, `Atividades`) devem validar a propriedade do registro (`deletarRegistro(id, usuario)`). Apenas o autor original (`login`), supervisores (`usuario.isSupervisor()`) ou administradores (`ADMIN`) têm permissão para excluir. Usuários comuns não podem excluir dados uns dos outros.
   - **Catálogos Globais e Infraestrutura**: Operações de mutação e exclusão em tabelas de configuração global (tipos de `Procedimento`, catálogo de `Evento`, incidentes de rede `NocEvento` e caixas `Cto`) devem ser **estritamente restritas a `ADMIN_ONLY`** (`@PreAuthorize(ADMIN_ONLY)`).

3. **Ciclo de Vida do JWT, Cookies de Sessão e Segredos**:
   - **Tolerância de Renovação JWT**: No endpoint de renovação de sessão (`/token/refresh`), a tolerância para aceitação de tokens expirados deve ser estritamente curta (**máximo de 5 minutos / 300 segundos**), absorvendo apenas *clock drift* e oscilações de rede. Nunca permitir janelas longas (como 24 horas).
   - **Cookies de Sessão**: Cookies contendo o JWT devem ser emitidos pelo helper centralizado `criarCookieToken()` com `HttpOnly`, `Path=/`, `SameSite=Lax` e ativação dinâmica de `Secure` quando em ambiente HTTPS (`isCookieSecure()`).
   - **Desacoplamento de Chaves Criptográficas**: Chaves simétricas AES de banco de dados (ex: `RBX_ENCRYPTION_KEY`) nunca devem ser acopladas ao `JWT_SECRET`. Segredos devem ser fornecidos exclusivamente via variáveis de ambiente no container, mantendo arquivos de exemplo (`.env.example`) livres de credenciais reais.

4. **Upload Seguro de Arquivos**:
   - Qualquer endpoint de upload de arquivos (ex: planilhas de faturamento em `FaturamentoMensalService`) deve:
     - Limitar o tamanho máximo do arquivo (limite de 15MB) para proteção contra exaustão de memória/DoS.
     - Sanitizar o nome original do arquivo contra ataques de *Path Traversal* (`..`, `/`, `\`).
     - Validar rigorosamente a extensão (`.xlsx`, `.xls`) e o MIME type do arquivo.
     - Tratar exceções de leitura de bibliotecas (ex: Apache POI) para retornar erro 400 amigável sem vazar *stack traces*.

5. **Rate Limiting no Nginx Reverse Proxy**:
   - Endpoints críticos de autenticação (`/api/usuario/logar`, `/api/usuario/solicitaredefinirsenha`, `/api/usuario/userchek`) devem possuir limitação de taxa via zona `auth_limit` (10 req/minuto com burst reduzido) retornando status **HTTP 429**.
   - Rotas de IA com custo de API externa (`/api/ia/`) devem ter cota restrita via zona `ai_limit` (30 req/minuto).
   - Todas as rotas gerais da API (`/api/`) devem possuir proteção de base contra requisições excessivas/DoS (`api_general_limit`).

6. **Tratamento Seguro de Erros e Prevenção de Information Disclosure**:
   - Em `TratadorDeErros.java`, nunca retornar mensagens internas de runtime (`ex.getLocalizedMessage()`), detalhes de schema do PostgreSQL (`DataIntegrityViolationException`) ou *stack traces* ao cliente HTTP.
   - Registrar internamente o erro completo com o logger (`log.error(...)`) e retornar mensagens genéricas e sanitizadas para o usuário final.
