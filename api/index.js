const express = require('express'); // HTTP
const { Pool } = require('pg');     // Postgres
const cors = require('cors');       // Dashboard
const crypto = require('crypto'); // UUID

const FAKE_WORKSPACES = [
    { id: 'e6bb64bf-46e4-410d-8406-c61e267ea607', name: 'Tech Solutions Corp' },
    { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', name: 'Retail Giant SA' },
    { id: '550e8400-e29b-41d4-a716-446655440000', name: 'Driva Analytics' },
    { id: '123e4567-e89b-12d3-a456-426614174000', name: 'Logistics Pro' },
    { id: 'c73bcdcc-2669-4bf6-81d3-e4ae73fb11fd', name: 'Financeira Top' }
];

const app = express();
app.use(express.json());
app.use(cors());

// Configuração do Banco de Dados
const pool = new Pool({
    connectionString: `postgres://${process.env.DB_POSTGRESDB_USER}:${process.env.DB_POSTGRESDB_PASSWORD}@${process.env.DB_POSTGRESDB_HOST}:5432/${process.env.DB_POSTGRESDB_DATABASE}`
});


// O PDF pede autenticação via Bearer Token 
app.get('/people/v1/enrichments', (req, res) => {
    // 1. Verificação de Segurança (Auth)
    const authHeader = req.headers.authorization;
    if (authHeader !== 'Bearer driva_test_key_abc123xyz789') { // Chave fixa do PDF
        return res.status(401).json({ error: 'Não autorizado' });
    }


    // 2. Simulação de Rate Limit
    if (Math.random() < 0.3) { 
        console.log(`[SIMULAÇÃO] Rejeitando requisição com 429 (Too Many Requests)`);
        return res.status(429).json({ 
            error: 'Too Many Requests', 
            message: 'Você está indo rápido demais! Tente novamente em instantes.'
        });
    }

    // Lógica de Paginação (Query Params)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    
    // Simulando "Milhares de registros" gerando dados em tempo real
    const totalItems = 5000; 
    const totalPages = Math.ceil(totalItems / limit);

    // Se pedir uma página que não existe, retorna vazio
    if (page > totalPages) {
        return res.json({ 
            meta: { current_page: page, total_pages: totalPages, total_items: totalItems },
            data: [] 
        });
    }

    // Gera dados falsos para essa página
    const data = [];
    for (let i = 0; i < limit; i++) {

        const randomWorkspace = FAKE_WORKSPACES[Math.floor(Math.random() * FAKE_WORKSPACES.length)];
        const idEnrichment = crypto.randomUUID();


        const dataCriacao = new Date();
        // Joga a criação para um tempo aleatório no passado (0 a 60 min atrás)
        dataCriacao.setMinutes(dataCriacao.getMinutes() - Math.floor(Math.random() * 60));
        const dataAtualizacao = new Date(dataCriacao);
        // Adiciona um tempo aleatório de processamento (1 a 15 min depois da criação)
        dataAtualizacao.setMinutes(dataAtualizacao.getMinutes() + Math.floor(Math.random() * 15) + 1);

        data.push({
            id: idEnrichment,
            id_workspace: randomWorkspace.id,
            workspace_name: randomWorkspace.name,
            total_contacts: Math.floor(Math.random() * 2000), // Random entre 0 e 2000
            contact_type: Math.random() > 0.5 ? "COMPANY" : "PERSON",
            status: Math.random() > 0.1 ? "COMPLETED" : "FAILED", // 10% de chance de falha
            created_at: dataCriacao.toISOString(),
            updated_at: dataAtualizacao.toISOString()
        });
    }

    // Retorna o JSON conforme estrutura do PDF 
    res.json({
        meta: { current_page: page, items_per_page: limit, total_items: totalItems, total_pages: totalPages },
        data: data
    });
});



//Leitura do Banco de Dados para o Dashboar
// O PDF pede KPIs e lista paginada da camada GOLD

// Rota de Visão Geral (KPIs)
app.get('/analytics/overview', async (req, res) => {
    try {
        // SQL query para contar totais e calcular médias
        const result = await pool.query(`
            SELECT 
                COUNT(*) as total_jobs,
                COUNT(*) FILTER (WHERE processamento_sucesso = true) as total_sucesso,
                AVG(duracao_processamento_minutos) as tempo_medio
            FROM gold_enrichments
        `);
        
        // Retorna o primeiro resultado
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro no banco de dados' });
    }
});

// Rota de Listagem (Tabela)
app.get('/analytics/enrichments', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM gold_enrichments LIMIT 100');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro no banco de dados' });
    }
});

// (Bônus) Ranking de Workspaces
app.get('/analytics/workspaces/top', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                nome_workspace, 
                COUNT(*) as total_jobs, 
                SUM(total_contatos) as soma_contatos 
            FROM gold_enrichments 
            GROUP BY nome_workspace 
            ORDER BY soma_contatos DESC 
            LIMIT 5
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar ranking' });
    }
});

// Inicia o servidor na porta 3000
app.listen(3000, () => {
    console.log('API rodando na porta 3000');
});