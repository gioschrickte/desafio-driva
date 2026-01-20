import { useState, useEffect } from 'react'

function App() {
  const [overview, setOverview] = useState(null)
  const [enrichments, setEnrichments] = useState([])
  const [loading, setLoading] = useState(true)
  const [topWorkspaces, setTopWorkspaces] = useState([])

  // Função que busca os dados da sua API
  const fetchData = async () => {
    try {
      // 1. Busca os KPIs (Visão Geral)
      const resOverview = await fetch('http://localhost:3000/analytics/overview')
      const dataOverview = await resOverview.json()
      setOverview(dataOverview)

      // 2. Busca a Lista de Enriquecimentos
      const resList = await fetch('http://localhost:3000/analytics/enrichments')
      const dataList = await resList.json()
      setEnrichments(dataList)

      // 3. Busca o Bônus (Top Workspaces)
      const resTop = await fetch('http://localhost:3000/analytics/workspaces/top')
      if (resTop.ok) {
        const dataTop = await resTop.json()
        setTopWorkspaces(dataTop)
      }
      
      setLoading(false)
    } catch (error) {
      console.error("Erro ao conectar na API:", error)
      setLoading(false)
    }
  }

  // Roda assim que a tela abre
  useEffect(() => {
    fetchData()
    // Atualiza a cada 5 segundos para ver o n8n trabalhando
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [])

  if (loading) return <div style={{padding: '20px'}}>Carregando Dashboard...</div>

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: '#ffffff' }}>🚀 Driva Analytics Dashboard</h1>
        <small style={{ color: '#888' }}>Atualizando em tempo real...</small>
      </div>
      
      {/* SEÇÃO 1: CARDS DE KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <Card title="Total de Jobs" value={overview?.total_jobs || 0} />
        <Card title="Sucesso" value={overview?.total_sucesso || 0} color="#4caf50" />
        <Card title="Tempo Médio" value={`${parseFloat(overview?.tempo_medio || 0).toFixed(2)} min`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
        
        {/* SEÇÃO 2: TOP CLIENTES (BÔNUS) - Estilo Simples */}
        <div>
          <h2 style={{ color: '#ffffff' }}>🏆 Top 5 Clientes</h2>
          <div style={{ overflowX: 'auto', border: '1px solid #ffffff', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: '#505050' }}>
                <tr>
                  <th style={thStyle}>Workspace</th>
                  <th style={thStyle}>Total Contatos</th>
                  <th style={thStyle}>Jobs</th>
                </tr>
              </thead>
              <tbody>
                {topWorkspaces.length > 0 ? topWorkspaces.map((ws, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{...tdStyle, fontWeight: 'bold'}}>{index + 1}. {ws.nome_workspace}</td>
                    <td style={tdStyle}>{ws.soma_contatos}</td>
                    <td style={tdStyle}>{ws.total_jobs}</td>
                  </tr>
                )) : <tr><td colSpan="3" style={tdStyle}>Carregando ranking...</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* SEÇÃO 3: TABELA PRINCIPAL */}
        <div>
          <h2 style={{ color: '#ffffff' }}>Últimos Enriquecimentos</h2>
          <div style={{ overflowX: 'auto', border: '1px solid #ddd', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: '#505050' }}>
                <tr>
                  <th style={thStyle}>Empresa</th>
                  <th style={thStyle}>Contatos</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Tamanho</th>
                  <th style={thStyle}>Duração</th>
                </tr>
              </thead>
              <tbody>
                {enrichments.slice(0, 10).map((job) => (
                  <tr key={job.id_enriquecimento} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={tdStyle}>{job.nome_workspace}</td>
                    <td style={tdStyle}>{job.total_contatos}</td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: '4px 8px', borderRadius: '12px', fontSize: '12px',
                        background: job.status_processamento === 'CONCLUIDO' ? '#e8f5e9' : 
                                    job.status_processamento === 'FALHOU' ? '#ffebee' : '#e3f2fd',
                        color: job.status_processamento === 'CONCLUIDO' ? '#2e7d32' : 
                               job.status_processamento === 'FALHOU' ? '#c62828' : '#0d47a1'
                      }}>
                        {job.status_processamento}
                      </span>
                    </td>
                    <td style={tdStyle}>{job.categoria_tamanho_job}</td>
                    <td style={{ ...tdStyle, fontFamily: 'monospace' }}>
                      {job.duracao_processamento_minutos ? job.duracao_processamento_minutos.toFixed(2) : '0.00'} min
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  )
}

// Estilos simples para componentes
const Card = ({ title, value, color = '#505050' }) => (
  <div style={{ padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', background: 'white' }}>
    <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666' }}>{title}</h3>
    <div style={{ fontSize: '24px', fontWeight: 'bold', color: color }}>{value}</div>
  </div>
)

const thStyle = { padding: '12px 15px', color: '#ffffff', fontSize: '14px' }
const tdStyle = { padding: '12px 15px', fontSize: '14px', color: '#dfdfdf' }

export default App