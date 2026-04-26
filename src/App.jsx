import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  Upload, FileText, Sparkles, TrendingDown, Download, Sun, Moon,
  AlertTriangle, CheckCircle, Zap, Hash, DollarSign, Info,
  ChevronDown, X, History, Shield
} from 'lucide-react'
import './index.css'

const CHARTCOLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899']

const API_BASE = 'http://localhost:3002'

async function fetchAPI(endpoint, body) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || err.message || 'Request failed')
  }
  
  return response.json()
}

function App() {
  const [darkMode, setDarkMode] = useState(true)
  const [pageContent, setPageContent] = useState('')
  const [prompt, setPrompt] = useState('')
  const [selectedModel, setSelectedModel] = useState('gpt-4o')
  const [analyzing, setAnalyzing] = useState(false)
  const [optimizing, setOptimizing] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [optimization, setOptimization] = useState(null)
  const [showOptimizer, setShowOptimizer] = useState(false)
  const [optimizeMode, setOptimizeMode] = useState('safe')
  const [history, setHistory] = useState([])
  const [models, setModels] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    const saved = localStorage.getItem('toknify_history')
    if (saved) {
      try {
        setHistory(JSON.parse(saved))
      } catch (e) {
        console.error(e)
      }
    }
    
    fetchAPI('/api/models', {}).catch(console.error)
  }, [])

  useEffect(() => {
    if (darkMode) {
      document.body.classList.remove('light')
    } else {
      document.body.classList.add('light')
    }
  }, [darkMode])

  const handleFileUpload = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      setPageContent(event.target?.result || '')
    }
    reader.readAsText(file)
  }, [])

  const handleAnalyze = useCallback(async () => {
    if (!prompt.trim()) return

    setAnalyzing(true)
    setError(null)
    setAnalysis(null)

    try {
      const data = await fetchAPI('/api/analyze', {
        prompt,
        pageContent,
        models: [selectedModel],
      })

      setAnalysis(data.results?.[0] || null)

      const entry = {
        id: Date.now(),
        prompt,
        model: selectedModel,
        tokens: data.results?.[0]?.tokens || 0,
        cost: data.results?.[0]?.inputCost || 0,
        timestamp: new Date().toISOString(),
      }
      setHistory(prev => {
        const updated = [entry, ...prev].slice(0, 20)
        localStorage.setItem('toknify_history', JSON.stringify(updated))
        return updated
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setAnalyzing(false)
    }
  }, [pageContent, prompt, selectedModel])

  const handleCompare = useCallback(async () => {
    if (!prompt.trim()) return

    setAnalyzing(true)
    setError(null)
    setAnalysis(null)

    try {
      const compareModels = [
        'gpt-4o', 'gpt-4o-mini', 'claude-3-5-sonnet', 
        'gemini-1.5-flash', 'claude-3-5-haiku'
      ]
      
      const data = await fetchAPI('/api/analyze', {
        prompt,
        pageContent,
        models: compareModels,
      })

      setAnalysis({
        model: 'comparison',
        results: data.results || [],
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setAnalyzing(false)
    }
  }, [pageContent, prompt])

  const handleOptimize = useCallback(async () => {
    if (!prompt.trim()) return

    setOptimizing(true)
    setError(null)
    setOptimization(null)

    try {
      const data = await fetchAPI('/api/optimize', {
        prompt,
        mode: optimizeMode,
      })

      setOptimization(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setOptimizing(false)
    }
  }, [prompt, optimizeMode])

  const handleExport = useCallback(() => {
    if (!optimization?.optimizedPrompt) return
    const blob = new Blob([optimization.optimizedPrompt], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'optimized-prompt.txt'
    a.click()
  }, [optimization])

  const tokenChartData = useMemo(() => {
    if (!analysis?.tokens) return []
    return [
      { name: 'Page Content', value: analysis.pageTokens || 0, fill: CHARTCOLORS[0] },
      { name: 'Prompt', value: analysis.promptTokens || 0, fill: CHARTCOLORS[1] },
    ]
  }, [analysis])

  const costChartData = useMemo(() => {
    if (!analysis?.results) return []
    return analysis.results.map(item => ({
      name: item.modelName,
      cost: item.inputCost,
    }))
  }, [analysis])

  const isComparison = analysis?.model === 'comparison'

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-bg-secondary)]/80 backdrop-blur-xl border-b border-[var(--color-border-subtle)]">
        <div className="max-w-[1600px] mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)] flex items-center justify-center">
              <Zap className="w-4 h-4 text-[var(--color-bg-primary)]" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight">Toknify</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="appearance-none bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg px-4 py-2 pr-10 text-sm font-medium text-[var(--color-text-primary)] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-opacity-50"
              >
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                <option value="claude-3-5-haiku">Claude 3.5 Haiku</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                <option value="gpt-4">GPT-4</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] pointer-events-none" />
            </div>
            
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="w-9 h-9 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      <main className="pt-14 min-h-screen">
        <div className="max-w-[1600px] mx-auto p-4 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
          <aside className="lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)] flex flex-col gap-4">
            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] rounded-xl p-4 flex flex-col gap-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Page Content</h2>
                <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  Upload
                  <input type="file" accept=".txt,.md,.js,.jsx,.ts,.tsx,.json,.html,.css" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
              
              {pageContent ? (
                <div className="relative flex-1 min-h-[200px]">
                  <div className="absolute inset-0 bg-[var(--color-bg-tertiary)] rounded-lg border border-[var(--color-border)] p-3 overflow-auto">
                    <pre className="text-xs text-[var(--color-text-secondary)] whitespace-pre-wrap font-mono">{pageContent.slice(0, 1000)}{pageContent.length > 1000 ? '...' : ''}</pre>
                  </div>
                  <button
                    onClick={() => setPageContent('')}
                    className="absolute top-2 right-2 w-6 h-6 rounded-md bg-[var(--color-bg-secondary)]/80 flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-error)] transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex-1 min-h-[200px] border-2 border-dashed border-[var(--color-border)] rounded-lg flex flex-col items-center justify-center gap-2 text-[var(--color-text-muted)]">
                  <FileText className="w-8 h-8" />
                  <p className="text-xs">Upload file or paste content</p>
                </div>
              )}
              
              {pageContent && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--color-text-muted)]">{pageContent.length} chars</span>
                </div>
              )}
            </div>

            {history.length > 0 && (
              <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] rounded-xl p-4 flex-1 flex flex-col gap-3 animate-fade-in stagger-1">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-[var(--color-text-muted)]" />
                  <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Recent</h2>
                </div>
                <div className="flex-1 overflow-auto flex flex-col gap-2">
                  {history.slice(0, 5).map(entry => (
                    <button
                      key={entry.id}
                      onClick={() => setPrompt(entry.prompt)}
                      className="w-full text-left p-2 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors group"
                    >
                      <p className="text-xs text-[var(--color-text-secondary)] truncate">{entry.prompt.slice(0, 50)}...</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-[var(--color-text-muted)]">{entry.tokens} tokens</span>
                        <span className="text-[10px] text-[var(--color-accent)]">${entry.cost.toFixed(4)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </aside>

          <div className="flex flex-col gap-4 pb-8">
            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] rounded-xl p-5 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Enter your prompt</h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--color-text-muted)]">{prompt.length} chars</span>
                </div>
              </div>
              
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Write a clear, specific prompt for an AI model. Be descriptive about what you want the model to do, any constraints, and the output format expected..."
                className="w-full h-[200px] bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-xl p-4 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-opacity-30 transition-shadow"
              />

              <div className="flex items-center gap-3 mt-3">
                <span className="text-xs text-[var(--color-text-muted)]">Optimization:</span>
                <button
                  onClick={() => { setShowOptimizer(false); setOptimizeMode('safe') }}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    !showOptimizer 
                      ? 'bg-[var(--color-accent-muted)] text-[var(--color-accent)] border border-[var(--color-accent)]' 
                      : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] border border-[var(--color-border)]'
                  }`}
                >
                  Safe
                </button>
                <button
                  onClick={() => { setShowOptimizer(true); setOptimizeMode('aggressive') }}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    showOptimizer 
                      ? 'bg-[var(--color-accent-muted)] text-[var(--color-accent)] border border-[var(--color-accent)]' 
                      : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] border border-[var(--color-border)]'
                  }`}
                >
                  Aggressive
                </button>
              </div>
              
              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={handleAnalyze}
                  disabled={!prompt.trim() || analyzing}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[var(--color-accent)] text-[var(--color-bg-primary)] font-semibold text-sm hover:bg-[var(--color-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {analyzing ? (
                    <div className="w-4 h-4 border-2 border-[var(--color-bg-primary)]/30 border-t-[var(--color-bg-primary)] rounded-full animate-spin" />
                  ) : (
                    <>
                      <Hash className="w-4 h-4" />
                      Analyze
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleCompare}
                  disabled={!prompt.trim() || analyzing}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-[var(--color-text-primary)] font-semibold text-sm hover:border-[var(--color-info)] hover:text-[var(--color-info)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {analyzing ? (
                    <div className="w-4 h-4 border-2 border-[var(--color-info)]/30 border-t-[var(--color-info)] rounded-full animate-spin" />
                  ) : (
                    <>
                      <TrendingDown className="w-4 h-4" />
                      Compare
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleOptimize}
                  disabled={!prompt.trim() || optimizing}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-[var(--color-text-primary)] font-semibold text-sm hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {optimizing ? (
                    <div className="w-4 h-4 border-2 border-[var(--color-accent)]/30 border-t-[var(--color-accent)] rounded-full animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Optimize
                    </>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 rounded-xl p-4 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-[var(--color-error)]" />
                <p className="text-sm text-[var(--color-error)]">{error}</p>
                <button onClick={() => setError(null)} className="ml-auto text-[var(--color-error)] hover:opacity-70">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {analysis && !isComparison && (
              <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] rounded-xl p-5 animate-fade-in stagger-2">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Analysis Results</h2>
                  {analysis.tokens > analysis.contextLimit && analysis.contextLimit > 0 && (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-error)]/10 text-[var(--color-error)] text-xs font-medium">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Exceeds limit
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-[var(--color-bg-tertiary)] rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-[var(--color-accent)]" />
                      <span className="text-xs text-[var(--color-text-muted)]">Tokens</span>
                    </div>
                    <p className="text-2xl font-bold text-[var(--color-text-primary)] font-mono">{analysis.tokens?.toLocaleString()}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{analysis.provider}</p>
                  </div>
                  
                  <div className="bg-[var(--color-bg-tertiary)] rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Hash className="w-4 h-4 text-[var(--color-chart-2)]" />
                      <span className="text-xs text-[var(--color-text-muted)]">Context Limit</span>
                    </div>
                    <p className="text-2xl font-bold text-[var(--color-text-primary)] font-mono">{analysis.contextLimit?.toLocaleString()}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">max tokens</p>
                  </div>
                  
                  <div className="bg-[var(--color-bg-tertiary)] rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4 text-[var(--color-chart-3)]" />
                      <span className="text-xs text-[var(--color-text-muted)]">Cost</span>
                    </div>
                    <p className="text-2xl font-bold text-[var(--color-accent)] font-mono">${analysis.inputCost?.toFixed(4)}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">${analysis.inputPricePer1M}/1M tokens</p>
                  </div>
                  
                  <div className="bg-[var(--color-bg-tertiary)] rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-[var(--color-chart-4)]" />
                      <span className="text-xs text-[var(--color-text-muted)]">Fits</span>
                    </div>
                    <p className="text-2xl font-bold text-[var(--color-text-primary)] font-mono">
                      {analysis.tokens <= analysis.contextLimit ? '✓' : '✗'}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">within limit</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-[var(--color-bg-tertiary)] rounded-lg text-xs text-[var(--color-text-muted)]">
                  <Shield className="w-4 h-4" />
                  <span>Provider-accurate tokenization using official tokenizer implementations. Final billed tokens may vary slightly due to provider formatting/system overhead.</span>
                </div>
              </div>
            )}

            {analysis && isComparison && (
              <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] rounded-xl p-5 animate-fade-in stagger-3">
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-5">Model Comparison</h2>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[var(--color-border)]">
                        <th className="text-left py-3 px-4 text-xs font-medium text-[var(--color-text-muted)]">Model</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-[var(--color-text-muted)]">Provider</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-[var(--color-text-muted)]">Context Limit</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-[var(--color-text-muted)]">Tokens</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-[var(--color-text-muted)]">Cost/1K</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-[var(--color-text-muted)]">Est. Cost</th>
                        <th className="text-left py-3 px-4 text-xs font-medium text-[var(--color-text-muted)]">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.results.map((item, i) => (
                        <tr key={i} className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-bg-tertiary)] transition-colors">
                          <td className="py-3 px-4 text-sm font-medium text-[var(--color-text-primary)]">{item.modelName}</td>
                          <td className="py-3 px-4 text-sm text-[var(--color-text-secondary)]">{item.provider}</td>
                          <td className="py-3 px-4 text-sm font-mono text-[var(--color-text-secondary)]">{item.contextLimit?.toLocaleString()}</td>
                          <td className="py-3 px-4 text-sm font-mono text-[var(--color-accent)]">{item.tokens?.toLocaleString()}</td>
                          <td className="py-3 px-4 text-sm font-mono text-[var(--color-text-secondary)]">${item.inputPricePer1M}</td>
                          <td className="py-3 px-4 text-sm font-mono text-[var(--color-accent)]">${item.inputCost?.toFixed(4)}</td>
                          <td className="py-3 px-4">
                            {item.tokens <= item.contextLimit ? (
                              <span className="flex items-center gap-1 text-xs text-[var(--color-accent)]">
                                <CheckCircle className="w-3.5 h-3.5" />
                                Fits
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs text-[var(--color-error)]">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Exceeds
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="h-[250px] mt-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={costChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={10} angle={-45} textAnchor="end" height={80} />
                      <YAxis stroke="var(--color-text-muted)" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--color-bg-elevated)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                        formatter={(value) => [`$${Number(value).toFixed(4)}`, 'Est. Cost']}
                      />
                      <Bar dataKey="cost" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex items-center gap-2 p-3 bg-[var(--color-bg-tertiary)] rounded-lg text-xs text-[var(--color-text-muted)] mt-4">
                  <Info className="w-4 h-4" />
                  <span>Provider-accurate tokenization using official tokenizer implementations. Final billed tokens may vary slightly due to provider formatting/system overhead.</span>
                </div>
              </div>
            )}

            {optimization && (
              <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] rounded-xl p-5 animate-fade-in stagger-4">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Optimization Results</h2>
                  <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-5">
                  <div className="bg-[var(--color-bg-tertiary)] rounded-xl p-4">
                    <p className="text-xs text-[var(--color-text-muted)] mb-1">Original</p>
                    <p className="text-xl font-bold text-[var(--color-text-secondary)] font-mono">{optimization.originalTokens?.toLocaleString()}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">tokens</p>
                  </div>
                  <div className="bg-[var(--color-bg-tertiary)] rounded-xl p-4">
                    <p className="text-xs text-[var(--color-text-muted)] mb-1">Optimized</p>
                    <p className="text-xl font-bold text-[var(--color-accent)] font-mono">{optimization.optimizedTokens?.toLocaleString()}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">tokens</p>
                  </div>
                  <div className="bg-[var(--color-accent-muted)] rounded-xl p-4">
                    <p className="text-xs text-[var(--color-text-muted)] mb-1">Reduction</p>
                    <p className="text-xl font-bold text-[var(--color-accent)] font-mono">{optimization.reductionPercent}%</p>
                    <p className="text-xs text-[var(--color-text-muted)]">saved</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-[var(--color-bg-tertiary)] rounded-xl p-4">
                    <p className="text-xs text-[var(--color-text-muted)] mb-2">Original</p>
                    <pre className="text-xs text-[var(--color-text-secondary)] whitespace-pre-wrap h-[150px] overflow-auto font-mono">{optimization.originalPrompt}</pre>
                  </div>
                  <div className="bg-[var(--color-accent-muted)] rounded-xl p-4">
                    <p className="text-xs text-[var(--color-accent)] mb-2">Optimized</p>
                    <pre className="text-xs text-[var(--color-text-primary)] whitespace-pre-wrap h-[150px] overflow-auto font-mono">{optimization.optimizedPrompt}</pre>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-[var(--color-bg-tertiary)] rounded-xl p-3">
                    <p className="text-xs text-[var(--color-text-muted)]">Optimization Cost</p>
                    <p className="text-sm font-mono text-[var(--color-text-secondary)]">${optimization.optimizationCost?.toFixed(4)}</p>
                  </div>
                  <div className="bg-[var(--color-accent-muted)] rounded-xl p-3">
                    <p className="text-xs text-[var(--color-text-muted)]">Net Savings</p>
                    <p className="text-sm font-mono text-[var(--color-accent)]">${optimization.savings?.toFixed(4)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-[var(--color-bg-tertiary)] rounded-lg text-xs text-[var(--color-text-muted)]">
                  <Shield className="w-4 h-4" />
                  <span>{optimization.disclaimer}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default App