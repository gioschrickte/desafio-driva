# Desafio de Engenharia de Dados - Pipeline ETL e Analytics

Este repositório contém a solução implementada para o desafio técnico de Engenharia de Dados. O projeto consiste em uma arquitetura de microsserviços containerizados para a ingestão, processamento, armazenamento e visualização de dados de enriquecimento corporativo, seguindo o padrão de arquitetura em camadas (Medallion Architecture - Bronze/Gold).

## Arquitetura da Solução

O sistema foi desenvolvido utilizando Docker Compose para orquestração dos seguintes serviços:

* **API (Node.js/Express):** Atua com dupla responsabilidade: simular a fonte de dados externa (com paginação e simulação de *rate limiting*) e servir os endpoints analíticos para o dashboard.
* **Orquestrador (n8n):** Gerencia os workflows de ETL (Extração, Transformação e Carga). Responsável pela resiliência na ingestão e aplicação das regras de negócio.
* **Data Warehouse (PostgreSQL 15):** Armazenamento persistente dividido em camadas lógicas (Bronze para dados brutos, Gold para dados refinados).
* **Frontend (React/Vite):** Interface de visualização de métricas (KPIs) e listagem de dados processados.

---

## Estrutura do Repositório

```text
.
├── api/                # Código fonte da API (Node.js)
├── frontend/           # Código fonte do Dashboard (React)
├── workflows/          # Definições dos fluxos do n8n (JSON)
├── docker-compose.yml  # Orquestração dos containers
├── init.sql            # Scripts DDL para inicialização do Banco de Dados
└── README.md           # Documentação do projeto

```

---

## Pré-requisitos e Execução

Para instanciar o ambiente, é necessário ter o **Docker** e **Docker Compose** instalados.

### 1. Inicialização do Ambiente

Na raiz do projeto, execute o comando para build e start dos containers:

```bash
docker-compose up -d --build

```

O comando irá expor os seguintes serviços:

* **PostgreSQL:** Porta `5432`
* **n8n (Workflow Editor):** Porta `5678`
* **API:** Porta `3000`
* **Dashboard:** Porta `5173`

### 2. Configuração dos Workflows de ETL

Os fluxos de automação não são persistidos automaticamente via volume do Docker por questões de portabilidade. É necessário importá-los manualmente:

1. Acesse o editor do n8n em `http://localhost:5678`.
2. Configure as credenciais:
* **PostgreSQL:** Host: `postgres`, User: `user_driva`, Pass: `password_driva`, DB: `driva_dw`.
* **Header Auth:** Name: `Authorization`, Value: `Bearer driva_test_key_abc123xyz789`.


3. Importe os arquivos `.json` localizados no diretório `/workflows` deste repositório:
* `ingestao.json`
* `processamento.json`
* `orquestrador.json`


4. Ative o workflow **Orquestrador**.

---

## Detalhes de Implementação e Decisões Técnicas

### 1. Modelagem de Dados (Camadas)

A persistência adota uma estratégia de separação de responsabilidades:

* **Camada Bronze (`bronze_enrichments`):**
* Armazena o dado bruto recebido da API.
* Objetivo: Rastreabilidade e *replayability*.
* Estratégia de Carga: *Upsert* baseado no ID original para evitar duplicação.
* Campos de Controle: `dw_ingested_at`, `dw_updated_at`.


* **Camada Gold (`gold_enrichments`):**
* Armazena dados normalizados, traduzidos e com métricas calculadas.
* Transformações aplicadas: Tradução de domínios (EN -> PT), categorização de tamanho de job e cálculo de tempo de processamento (`delta_t`).
* Fonte exclusiva para a API de Analytics.



### 2. Resiliência e Tolerância a Falhas

A API de origem foi configurada para simular instabilidades através de respostas **HTTP 429 (Too Many Requests)** de forma aleatória.

Para mitigar essas falhas, o workflow de ingestão no n8n implementa uma política de **Retry com Exponential Backoff**. O sistema realiza até 5 tentativas com intervalos progressivos antes de marcar a execução como falha, garantindo a robustez do pipeline de dados.

### 3. API e Geração de Dados

A API utiliza `crypto.randomUUID()` para garantir a unicidade dos registros de enriquecimento, evitando colisões de chave primária no banco de dados e permitindo distribuição estatística correta nos relatórios de "Top Workspaces".

**Endpoints Disponíveis:**

* **Fonte de Dados:**
* `GET /people/v1/enrichments`: Retorna lista paginada de enriquecimentos sintéticos. Requer Token Bearer.


* **Analytics (Camada Gold):**
* `GET /analytics/overview`: KPIs de performance (Taxa de sucesso, Tempo médio).
* `GET /analytics/enrichments`: Listagem detalhada dos jobs processados.
* `GET /analytics/workspaces/top`: Agregação de volume por workspace.



---

## Testes Manuais

Para validar a ingestão e a API via terminal, utilize os comandos abaixo:

**Validar Ingestão (Simulação):**

```bash
curl -v -H "Authorization: Bearer driva_test_key_abc123xyz789" \
"http://localhost:3000/people/v1/enrichments?page=1&limit=10"

```

**Validar Analytics:**

```bash
curl "http://localhost:3000/analytics/overview"

```