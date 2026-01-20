-- Criação da Camada Bronze (Dados Brutos)
-- O PDF pede tipos flexíveis (TEXT/JSONB) para evitar erros de ingestão[cite: 125].
CREATE TABLE IF NOT EXISTS bronze_enrichments (
    -- Dados originais da API (recebidos como JSON ou colunas flexíveis)
    id TEXT PRIMARY KEY, -- ID original do enriquecimento
    id_workspace TEXT,
    workspace_name TEXT,
    total_contacts INTEGER,
    contact_type TEXT,
    status TEXT,
    created_at TEXT, -- Armazenamos como texto para garantir fidelidade ao original
    updated_at TEXT,
    
    -- Campos de Controle do Data Warehouse (Exigidos pelo PDF [cite: 121])
    dw_ingested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Quando entrou no banco
    dw_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP   -- Quando foi atualizado
);

-- Criação da Camada Gold (Dados Refinados)
-- O PDF exige nomes em PT-BR e campos calculados[cite: 128, 147].
CREATE TABLE IF NOT EXISTS gold_enrichments (
    id_enriquecimento UUID PRIMARY KEY, -- Tradução de 'id'
    id_workspace UUID,
    nome_workspace TEXT,               -- Tradução de 'workspace_name'
    total_contatos INTEGER,            -- Tradução de 'total_contacts'
    tipo_contato TEXT,                 -- Tradução de 'contact_type' (PESSOA/EMPRESA)
    status_processamento TEXT,         -- Tradução de 'status'
    data_criacao TIMESTAMP,            -- Convertido para Timestamp real
    data_atualizacao TIMESTAMP,        -- Convertido para Timestamp real
    
    -- Campos Calculados/Transformados (Exigidos pelo PDF [cite: 147-166])
    duracao_processamento_minutos FLOAT, -- Diferença entre atualização e criação
    tempo_por_contato_minutos FLOAT,     -- Duração / total_contatos
    processamento_sucesso BOOLEAN,       -- Se status == CONCLUIDO
    categoria_tamanho_job TEXT,          -- PEQUENO, MEDIO, GRANDE...
    necessita_reprocessamento BOOLEAN,   -- Se falhou ou cancelou
    
    -- Controle do DW
    data_atualizacao_dw TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Snapshot do processamento
);

-- (Opcional) Índices para performance
CREATE INDEX idx_gold_status ON gold_enrichments(status_processamento);
CREATE INDEX idx_gold_workspace ON gold_enrichments(id_workspace);WW