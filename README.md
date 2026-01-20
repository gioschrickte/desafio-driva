# Driva Data Pipeline Challenge

Solução de Engenharia de Dados desenvolvida para o desafio técnico da **Driva**.  
O projeto implementa um pipeline **ETL (Extract, Transform, Load)** automatizado, utilizando arquitetura de microsserviços containerizados para ingestão, processamento, armazenamento e visualização de dados de enriquecimento corporativo.

---

## Arquitetura da Solução

O sistema foi projetado seguindo o padrão de **Data Warehouse em Camadas (Bronze / Gold)**, priorizando rastreabilidade, idempotência e separação clara de responsabilidades.

### Stack Tecnológica

- **Orquestração & ETL:** n8n  
- **Banco de Dados:** PostgreSQL 14  
- **Backend / API:** Node.js + Express  
- **Frontend:** React + Vite  
- **Infraestrutura:** Docker e Docker Compose  

### Fluxo de Dados

1. **Fonte (Source)**  
   API em Node.js gera dados sintéticos de enriquecimentos corporativos, incluindo paginação e simulação de falhas HTTP 429 (Rate Limit).

2. **Ingestão (Bronze Layer)**  
   O n8n consome a API periodicamente e persiste o JSON bruto na tabela `bronze_enrichments`, preservando o dado original.

3. **Processamento (Gold Layer)**  
   O n8n normaliza os dados, aplica regras de negócio, traduz campos para PT-BR, calcula métricas temporais (`delta_t`) e categoriza o tamanho dos jobs, persistindo o resultado em `gold_enrichments`.

4. **Visualização**  
   Um dashboard em React consome a API de Analytics para exibição de KPIs e rankings.

---

## Como Executar o Projeto

### Pré-requisitos

- Docker  
- Docker Compose  

### Inicialização

Na raiz do projeto, execute:

```bash
docker-compose up -d --build
```

Os seguintes serviços serão iniciados:

* **PostgreSQL:** porta `5432` (database `driva_dw`)
* **n8n:** porta `5678`
* **API:** porta `3000`
* **Frontend:** porta `5173`

### Acesso aos Serviços

* Dashboard: [http://localhost:5173](http://localhost:5173)
* n8n Editor: [http://localhost:5678](http://localhost:5678)
* API (Analytics): [http://localhost:3000/analytics/overview](http://localhost:3000/analytics/overview)

---

## Configuração dos Workflows (n8n)

Para ativar o pipeline de dados:

1. Acesse o n8n em [http://localhost:5678](http://localhost:5678)
2. Configure a credencial **PostgreSQL** com:

   * Host: `postgres`
   * User: `user_driva`
   * Password: `password_driva`
   * Database: `driva_dw`
3. Configure a credencial **Header Auth**:

   * Name: `Authorization`
   * Value: `Bearer driva_test_key_abc123xyz789`
4. Importe os arquivos JSON localizados na pasta `/workflows`
5. Ative o workflow **Orquestrador**

> O workflow é executado automaticamente a cada 5 minutos.
> Para testes imediatos, utilize a opção **Execute Workflow** no n8n.

---

## Documentação da API

A API possui duas responsabilidades principais.

### 1. Simulação de Fonte (Ingestão)

Simula um sistema externo de enriquecimento de dados.

* **Endpoint:** `GET /people/v1/enrichments`
* **Autenticação:** Bearer Token

**Funcionalidades:**

* Paginação via `page` e `limit`
* Simulação de erros HTTP 429 (30% de chance)
* Geração dinâmica de datas para cálculo de métricas

---

### 2. Analytics (Consumo)

Fornece dados estruturados da camada Gold para o Dashboard.

* `GET /analytics/overview`
  KPIs gerais (volume total, taxa de sucesso, tempo médio)

* `GET /analytics/enrichments`
  Lista dos jobs processados recentemente

* `GET /analytics/workspaces/top`
  Ranking de workspaces com maior volume de contatos processados

---

## Decisões de Arquitetura

### 1. Idempotência via Upsert

As camadas Bronze e Gold utilizam operações de **Insert or Update**, garantindo que múltiplas execuções do pipeline não gerem duplicidade de dados.

### 2. Resiliência a Falhas (Retry com Backoff)

A ingestão foi projetada para lidar com falhas de Rate Limit (HTTP 429), utilizando retry com atraso configurado no n8n, garantindo robustez na coleta.

### 3. Separação de Camadas (Bronze / Gold)

* **Bronze:**
  Armazena o dado bruto, fiel à origem, com controle de ingestão (`dw_ingested_at`).

* **Gold:**
  Contém dados tratados, normalizados e prontos para consumo analítico.

O frontend consome exclusivamente a camada Gold.

### 4. Frontend Containerizado

O dashboard é executado em container utilizando `node:22-alpine`, garantindo consistência de ambiente e compatibilidade com o Vite.

---

## Testes Manuais

### Teste de Ingestão

```bash
curl -v -H "Authorization: Bearer driva_test_key_abc123xyz789" \
"http://localhost:3000/people/v1/enrichments?page=1&limit=5"
```

### Teste de Analytics

```bash
curl "http://localhost:3000/analytics/workspaces/top"
```
