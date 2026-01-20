```markdown
# 🚀 Driva Data Pipeline Challenge

Solução completa de Engenharia de Dados desenvolvida para o desafio técnico da Driva.
O projeto implementa um pipeline **ETL (Extract, Transform, Load)** automatizado, utilizando arquitetura de microsserviços containerizados para ingestão, processamento, armazenamento e visualização de dados de enriquecimento corporativo.

## 🏗️ Arquitetura da Solução

O sistema foi desenhado seguindo o padrão de **Data Warehouse em Camadas (Bronze/Gold)**, garantindo rastreabilidade e integridade dos dados.

### Tech Stack
* **Orquestração & ETL:** n8n (Workflow Automation)
* **Banco de Dados:** PostgreSQL 14 (Camadas Bronze e Gold)
* **Backend/API:** Node.js + Express (Simulação de Fonte + Analytics)
* **Frontend:** React + Vite (Dashboard)
* **Infraestrutura:** Docker & Docker Compose

### Fluxo de Dados
1.  **Fonte (Source):** API Node.js gera dados sintéticos de enriquecimentos (com simulação de falhas 429 e paginação).
2.  **Ingestão (Bronze):** O n8n consome a API a cada 5 minutos, salvando o JSON bruto na tabela `bronze_enrichments`.
3.  **Processamento (Gold):** O n8n normaliza os dados, traduz para PT-BR, calcula métricas de tempo (`delta_t`) e categoriza o tamanho do job, salvando na `gold_enrichments`.
4.  **Visualização:** O Dashboard React consome a API de Analytics para exibir KPIs e Rankings.

---

## ⚡ Como Executar o Projeto

### Pré-requisitos
* Docker e Docker Compose instalados.

### 1. Inicialização
Na raiz do projeto, execute o comando para construir e subir todos os contêineres:

```bash
docker-compose up -d --build

```

Isso iniciará os seguintes serviços:

* **Postgres:** Porta 5432 (Banco de dados `driva_dw`)
* **n8n:** Porta 5678 (Interface de fluxos)
* **API:** Porta 3000 (Endpoints)
* **Frontend:** Porta 5173 (Dashboard)

### 2. Acesso

* **Dashboard:** [http://localhost:5173](https://www.google.com/search?q=http://localhost:5173)
* **n8n Editor:** [http://localhost:5678](https://www.google.com/search?q=http://localhost:5678)
* **API Health:** [http://localhost:3000/analytics/overview](https://www.google.com/search?q=http://localhost:3000/analytics/overview)

---

## ⚙️ Configuração dos Workflows (n8n)

Para ativar o pipeline de dados, é necessário importar os fluxos de automação:

1. Acesse o n8n em [http://localhost:5678](https://www.google.com/search?q=http://localhost:5678).
2. Configure a credencial do **PostgreSQL** com os dados do `docker-compose.yml` (Host: `postgres`, User: `user_driva`, Pass: `password_driva`, DB: `driva_dw`).
3. Configure a credencial **Header Auth** para a API (Name: `Authorization`, Value: `Bearer driva_test_key_abc123xyz789`).
4. Importe os arquivos JSON localizados na pasta `/workflows` deste repositório.
5. Ative o workflow **"Orquestrador"** (Switch "Active").

> **Nota:** O Orquestrador executa a cada 5 minutos. Para testar imediatamente, clique em "Execute Workflow" manualmente.

---

## 📡 Documentação da API

A API foi construída em Node.js e possui duas responsabilidades distintas:

### 1. Simulação de Fonte (Ingestão)

Simula o comportamento de um sistema externo de enriquecimento.

* **Endpoint:** `GET /people/v1/enrichments`
* **Auth:** `Bearer driva_test_key_abc123xyz789`
* **Features:**
* **Paginação:** Suporta `?page=X&limit=Y`.
* **Chaos Engineering:** Simula erros **429 Too Many Requests** aleatoriamente (30% de chance) para testar a resiliência (Retry/Backoff) do n8n.
* **Dados Dinâmicos:** Gera datas de criação e atualização realistas para cálculo de métricas.



### 2. Analytics (Consumo)

Fornece dados estruturados da camada Gold para o Dashboard.

* `GET /analytics/overview`: KPIs gerais (Total, Taxa de Sucesso, Tempo Médio).
* `GET /analytics/enrichments`: Lista dos últimos jobs processados.
* `GET /analytics/workspaces/top` (**Bônus**): Ranking dos workspaces com maior volume de contatos.

---

## 🧠 Decisões de Arquitetura

Durante o desenvolvimento, as seguintes decisões técnicas foram tomadas para atender aos requisitos:

1. **Estratégia de Upsert (Idempotência):**
Tanto na camada Bronze quanto na Gold, utilizamos a operação de *Insert or Update* baseada no ID. Isso garante que, se o pipeline rodar duas vezes sobre os mesmos dados, não haverá duplicidade, apenas atualização de estado.
2. **Resiliência (Retry com Backoff):**
Como a API de fonte simula erros 429 (Rate Limit), o workflow de ingestão no n8n foi configurado para tentar novamente após 2 segundos em caso de falha, garantindo robustez na coleta de dados.
3. **Separação de Camadas (Bronze vs Gold):**
* **Bronze:** Armazena o dado cru (`jsonb` ou texto fiel à origem) e datas de controle (`dw_ingested_at`). O objetivo é nunca perder o dado original.
* **Gold:** Aplica regras de negócio (tradução `COMPANY` -> `EMPRESA`, cálculo de `duracao_minutos`). O Dashboard lê apenas desta camada otimizada.


4. **Frontend Dockerizado:**
O Dashboard utiliza uma imagem `node:22-alpine` para compatibilidade com o Vite moderno, rodando em container para garantir que o ambiente seja agnóstico ao Sistema Operacional do host.

---

## 🧪 Como Rodar Testes Manuais

Para validar o funcionamento via terminal (cURL):

**Testar Ingestão (Simulando o n8n):**

```bash
curl -v -H "Authorization: Bearer driva_test_key_abc123xyz789" \
"http://localhost:3000/people/v1/enrichments?page=1&limit=5"

```

**Testar Analytics (Simulando o Dashboard):**

```bash
curl "http://localhost:3000/analytics/workspaces/top"

```

```

---

### Passo 2: O Roteiro do Vídeo (Baseado na Documentação)

Agora que você tem o README, aqui está como você vai usar ele para apresentar o vídeo. Siga essa lógica para mostrar que você entendeu tudo:

**1. Abertura (O Contexto)**
* "Olá, sou o [Seu Nome]. Apresento minha solução para o desafio de Engenharia de Dados da Driva. O objetivo foi construir um pipeline robusto para monitorar processos de enriquecimento de dados."
* "Usei uma arquitetura baseada em microsserviços com Docker, separando claramente as responsabilidades entre Ingestão, Processamento e Visualização."

**2. A Infraestrutura (Mostre o Docker/VS Code)**
* *Mostre o `docker-compose.yml` rapidamente.*
* "Aqui temos o orquestrador de contêineres. Temos o Postgres como Data Warehouse, o n8n para automação, a API Node.js e o Frontend. Tudo sobe com um único comando."

**3. O Pipeline (A Estrela do Show - Mostre o n8n)**
* *Abra o n8n na tela.*
* "O coração do sistema é o n8n. No workflow de **Ingestão**, configurei tratamento de erro. A API simula falhas 429 (Rate Limit), e implementei uma política de Retry com Backoff para garantir que o dado chegue na camada Bronze."
* "No fluxo de **Processamento**, pego o dado bruto da Bronze, aplico as regras de negócio (tradução de campos, cálculo de tempo de processamento) e salvo na camada Gold."

**4. A API e Banco de Dados (Mostre o Código/DBeaver ou Terminal)**
* "No banco, segui a arquitetura medalhão (Bronze/Gold). A Bronze guarda o histórico fiel e a Gold entrega o dado pronto para análise."
* "Desenvolvi a API com dois papéis: simular a fonte de dados e servir os dados analíticos."

**5. O Resultado Final (Mostre o Dashboard)**
* *Abra o http://localhost:5173.*
* "O resultado final é consumido por este Dashboard em React. Aqui temos os KPIs de tempo médio e sucesso."
* "Como bônus, implementei também o ranking de Top Workspaces, que faz uma agregação direta na camada Gold."

**6. Fechamento**
* "A solução é totalmente containerizada, resiliente a falhas de rede e segue boas práticas de modelagem dimensional. Obrigado!"

---

### Próximos Passos Imediatos:
1.  **Crie o arquivo README.md** com o conteúdo acima.
2.  **Exporte os Workflows:** Vá no n8n, baixe os JSONs dos 3 workflows e salve numa pasta `workflows` no seu projeto (o README menciona isso).
3.  **Grave o vídeo** seguindo o roteiro. Respire fundo, fale devagar. Você construiu tudo, você sabe como funciona! 🚀

```