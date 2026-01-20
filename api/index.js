const express = require('express'); // Biblioteca que cria o servidor HTTP
const { Pool } = require('pg');     // Biblioteca que conecta no Postgres
const cors = require('cors');       // Permite que o Dashboard (frontend) acesse a API

const app = express();
app.use(express.json());
app.use(cors());

// Configuração do Banco de Dados (Lê as variáveis do Docker)
const pool = new Pool({
    connectionString: `postgres://${process.env.DB_POSTGRESDB_USER}:${process.env.DB_POSTGRESDB_PASSWORD}@${process.env.DB_POSTGRESDB_HOST}:5432/${process.env.DB_POSTGRESDB_DATABASE}`
});

// --- PARTE 1: SIMULAÇÃO DA FONTE DE DADOS (Endpoint exigido no PDF) ---
// O PDF pede autenticação via Bearer Token e paginação [cite: 67, 73]
app.get('/people/v1/enrichments', (req, res) => {
    // 1. Verificação de Segurança (Auth)
    const authHeader = req.headers.authorization;
    if (authHeader !== 'Bearer driva_test_key_abc123xyz789') { // Chave fixa do PDF [cite: 70]
        return res.status(401).json({ error: 'Não autorizado' });
    }


    // 2. Simulação de Rate Limit
    // Vamos dar 30% de chance da API rejeitar com 429
    if (Math.random() < 0.3) { 
        console.log(`[SIMULAÇÃO] Rejeitando requisição com 429 (Too Many Requests)`);
        // Retorna o erro e encerra a função
        return res.status(429).json({ 
            error: 'Too Many Requests', 
            message: 'Você está indo rápido demais! Tente novamente em instantes.'
        });
    }

    // 2. Lógica de Paginação (Query Params)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    
    // Simulando "Milhares de registros" gerando dados em tempo real (Runtime) [cite: 77]
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
        const idGlobal = (page - 1) * limit + i; // ID sequencial fictício
        if (idGlobal >= totalItems) break;

        // LÓGICA DE DATAS REALISTA
        const dataCriacao = new Date();
        // Joga a criação para um tempo aleatório no passado (0 a 60 min atrás)
        dataCriacao.setMinutes(dataCriacao.getMinutes() - Math.floor(Math.random() * 60));

        const dataAtualizacao = new Date(dataCriacao);
        // Adiciona um tempo aleatório de processamento (1 a 15 min depois da criação)
        dataAtualizacao.setMinutes(dataAtualizacao.getMinutes() + Math.floor(Math.random() * 15) + 1);

        // Cria um objeto JSON (parecido com struct)
        data.push({
            id: `uuid-falso-${idGlobal}`,
            id_workspace: `workspace-${(idGlobal % 5) + 1}`, // Simula 5 empresas diferentes
            workspace_name: `Empresa Teste ${(idGlobal % 5) + 1}`,
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

// --- PARTE 2: ANALYTICS (Leitura do Banco de Dados para o Dashboard) ---
// O PDF pede KPIs e lista paginada da camada GOLD [cite: 104, 107]

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

// (Bônus) Ranking de Workspaces [cite: 109]
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