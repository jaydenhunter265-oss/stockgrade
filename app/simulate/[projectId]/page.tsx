'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import type { Project, Task, Simulation } from '@/lib/workflow-types'

type Step = 1 | 2 | 3 | 4 | 5

const STEP_LABELS = ['Ontology', 'Graph Build', 'Simulation', 'Report', 'Interview']

// ─── Poll helper ──────────────────────────────────────────────────────────────
function usePoll(taskId: string | null, onDone: (t: Task) => void, onFail: (e: string) => void) {
  const active = useRef(false)
  useEffect(() => {
    if (!taskId) return
    active.current = true
    const tick = async () => {
      if (!active.current) return
      const r = await fetch(`/api/task/${taskId}`).then(x => x.json())
      if (!r.success) return
      const t: Task = r.data
      if (t.status === 'completed') { active.current = false; onDone(t) }
      else if (t.status === 'failed') { active.current = false; onFail(t.error ?? 'Failed') }
      else setTimeout(tick, 2500)
    }
    tick()
    return () => { active.current = false }
  }, [taskId]) // eslint-disable-line react-hooks/exhaustive-deps
}

export default function ProcessPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const router = useRouter()

  const [project, setProject] = useState<Project | null>(null)
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 2 – graph build
  const [buildTaskId, setBuildTaskId] = useState<string | null>(null)
  const [buildProgress, setBuildProgress] = useState(0)
  const [buildMsg, setBuildMsg] = useState('')

  // Step 3 – simulation
  const [simTaskId, setSimTaskId] = useState<string | null>(null)
  const [simProgress, setSimProgress] = useState(0)
  const [simMsg, setSimMsg] = useState('')
  const [simulation, setSimulation] = useState<Simulation | null>(null)

  // Step 4 – report
  const [reportTaskId, setReportTaskId] = useState<string | null>(null)
  const [reportProgress, setReportProgress] = useState(0)
  const [reportMsg, setReportMsg] = useState('')
  const [reportId, setReportId] = useState<string | null>(null)

  // Load project
  useEffect(() => {
    fetch(`/api/project`)
      .then(r => r.json())
      .then(j => {
        const p = j.data?.find((x: Project) => x.project_id === projectId)
        if (p) {
          setProject(p)
          // resume at correct step
          if (p.status === 'ontology_generated') setStep(2)
          else if (p.status === 'graph_completed') setStep(3)
          else if (p.status === 'simulation_completed') setStep(4)
        }
      })
  }, [projectId])

  // Poll build task
  usePoll(buildTaskId, (t) => {
    setBuildProgress(100)
    setBuildMsg('Graph build complete!')
    setProject(prev => prev ? { ...prev, status: 'graph_completed', graph_id: (t.result as Record<string, string>)?.graph_id ?? prev.graph_id } : prev)
    setTimeout(() => setStep(3), 1000)
  }, (e) => { setBuildMsg('Error: ' + e); setError(e) })

  // Poll sim task
  usePoll(simTaskId, (t) => {
    setSimProgress(100)
    setSimMsg('Simulation complete!')
    fetch(`/api/simulation/${(t.result as Record<string, string>)?.simulation_id}`)
      .then(r => r.json()).then(j => { if (j.success) setSimulation(j.data) })
    setTimeout(() => setStep(4), 1000)
  }, (e) => { setSimMsg('Error: ' + e); setError(e) })

  // Poll report task
  usePoll(reportTaskId, (t) => {
    setReportProgress(100)
    setReportMsg('Report ready!')
    const rid = (t.result as Record<string, string>)?.report_id
    if (rid) { setReportId(rid); setTimeout(() => router.push(`/simulate/report/${rid}`), 1200) }
  }, (e) => { setReportMsg('Error: ' + e); setError(e) })

  // Live progress poll for active tasks
  useEffect(() => {
    if (!buildTaskId) return
    const iv = setInterval(async () => {
      const r = await fetch(`/api/task/${buildTaskId}`).then(x => x.json())
      if (r.success) { setBuildProgress(r.data.progress); setBuildMsg(r.data.message) }
    }, 2000)
    return () => clearInterval(iv)
  }, [buildTaskId])

  useEffect(() => {
    if (!simTaskId) return
    const iv = setInterval(async () => {
      const r = await fetch(`/api/task/${simTaskId}`).then(x => x.json())
      if (r.success) { setSimProgress(r.data.progress); setSimMsg(r.data.message) }
    }, 2000)
    return () => clearInterval(iv)
  }, [simTaskId])

  useEffect(() => {
    if (!reportTaskId) return
    const iv = setInterval(async () => {
      const r = await fetch(`/api/task/${reportTaskId}`).then(x => x.json())
      if (r.success) { setReportProgress(r.data.progress); setReportMsg(r.data.message) }
    }, 2000)
    return () => clearInterval(iv)
  }, [reportTaskId])

  const startGraphBuild = useCallback(async () => {
    setLoading(true); setError('')
    const r = await fetch('/api/graph/build', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId }),
    }).then(x => x.json())
    setLoading(false)
    if (r.success) { setBuildTaskId(r.data.task_id); setBuildMsg('Initialising…') }
    else setError(r.error)
  }, [projectId])

  const startSimulation = useCallback(async () => {
    setLoading(true); setError('')
    const r = await fetch('/api/simulation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId, num_agents: 8, rounds: 2 }),
    }).then(x => x.json())
    setLoading(false)
    if (r.success) { setSimTaskId(r.data.task_id); setSimMsg('Initialising agents…') }
    else setError(r.error)
  }, [projectId])

  const startReport = useCallback(async () => {
    if (!simulation) return
    setLoading(true); setError('')
    const r = await fetch('/api/report/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ simulation_id: simulation.simulation_id }),
    }).then(x => x.json())
    setLoading(false)
    if (r.success) { setReportTaskId(r.data.task_id); setReportMsg('Initialising report agent…') }
    else setError(r.error)
  }, [simulation])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-body)' }}>
      <style>{`
        .step-bar { display:flex; gap:0; border-bottom:1px solid var(--border); }
        .step-item { flex:1; padding:16px 8px; text-align:center; font-size:12px; letter-spacing:1px; font-family:var(--font-display); cursor:default; border-right:1px solid var(--border); transition:all 0.2s; }
        .step-item:last-child { border-right:none; }
        .step-item.active { background:var(--neon-dim); color:var(--neon); }
        .step-item.done { color:var(--green); }
        .step-item.pending { color:var(--text-3); }
        .card { background:var(--bg2); border:1px solid var(--border); border-radius:var(--radius-lg); padding:28px; margin-bottom:20px; }
        .card-title { font-family:var(--font-display); font-size:20px; font-weight:600; letter-spacing:1.5px; margin-bottom:16px; }
        .btn { padding:12px 28px; border:none; border-radius:var(--radius); font-family:var(--font-display); font-size:14px; letter-spacing:1px; cursor:pointer; transition:all 0.2s; }
        .btn-primary { background:var(--neon); color:var(--bg); font-weight:700; }
        .btn-primary:hover { background:#00eaff; transform:translateY(-1px); }
        .btn-primary:disabled { opacity:0.4; cursor:not-allowed; transform:none; }
        .progress-bar-wrap { height:6px; background:var(--bg3); border-radius:3px; overflow:hidden; margin:12px 0; }
        .progress-bar-fill { height:100%; border-radius:3px; background:linear-gradient(90deg,var(--purple),var(--neon)); transition:width 0.4s; }
        .entity-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:10px; margin-top:12px; }
        .entity-chip { background:var(--bg3); border:1px solid var(--border); border-radius:8px; padding:10px 14px; font-size:13px; }
        .entity-chip .name { color:var(--neon); font-weight:600; margin-bottom:4px; }
        .entity-chip .desc { color:var(--text-2); font-size:11px; line-height:1.4; }
        .post-feed { display:flex; flex-direction:column; gap:10px; max-height:400px; overflow-y:auto; }
        .post-card { background:var(--bg3); border-radius:var(--radius); padding:14px; border-left:3px solid transparent; }
        .post-card.bullish { border-color:var(--green); }
        .post-card.bearish { border-color:var(--red); }
        .post-card.neutral  { border-color:var(--text-3); }
        .post-meta { font-size:11px; color:var(--text-2); margin-bottom:6px; display:flex; gap:10px; }
        .post-content { font-size:13px; line-height:1.5; }
        .stat-pill { display:inline-flex; align-items:center; gap:6px; background:var(--bg3); border:1px solid var(--border); border-radius:20px; padding:6px 14px; font-size:13px; }
        .stat-val { font-family:var(--font-mono); color:var(--neon); font-weight:700; }
      `}</style>

      {/* Top bar */}
      <div style={{ display:'flex', alignItems:'center', padding:'0 24px', height:56, borderBottom:'1px solid var(--border)', background:'var(--bg2)' }}>
        <button onClick={() => router.push('/')} style={{ background:'none', border:'none', color:'var(--neon)', fontFamily:'var(--font-display)', fontSize:18, letterSpacing:2, cursor:'pointer' }}>
          MIROFISH
        </button>
        <span style={{ marginLeft:16, color:'var(--text-3)', fontSize:13 }}>/</span>
        <span style={{ marginLeft:16, color:'var(--text-2)', fontSize:13, fontFamily:'var(--font-mono)' }}>{projectId}</span>
      </div>

      {/* Step bar */}
      <div className="step-bar">
        {STEP_LABELS.map((label, i) => {
          const n = (i + 1) as Step
          const cls = n === step ? 'active' : n < step ? 'done' : 'pending'
          return <div key={label} className={`step-item ${cls}`}>{n < step ? '✓ ' : `${String(n).padStart(2,'0')} `}{label}</div>
        })}
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>
        {error && <div style={{ background:'rgba(255,77,77,0.1)', border:'1px solid var(--red)', borderRadius:8, padding:'12px 16px', marginBottom:20, color:'var(--red)', fontSize:13 }}>{error}</div>}

        {/* ── Step 1: Ontology Review ── */}
        {step === 1 && (
          <div className="card">
            <div className="card-title" style={{ color:'var(--neon)' }}>01 — ONTOLOGY REVIEW</div>
            {project ? (
              <>
                <p style={{ color:'var(--text-2)', marginBottom:16, fontSize:14, lineHeight:1.6 }}>{project.analysis_summary}</p>
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:12, color:'var(--text-3)', letterSpacing:1, marginBottom:8 }}>ENTITY TYPES ({project.ontology?.entity_types.length ?? 0})</div>
                  <div className="entity-grid">
                    {project.ontology?.entity_types.map(e => (
                      <div key={e.name} className="entity-chip">
                        <div className="name">{e.name}</div>
                        <div className="desc">{e.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom:24 }}>
                  <div style={{ fontSize:12, color:'var(--text-3)', letterSpacing:1, marginBottom:8 }}>RELATIONSHIP TYPES ({project.ontology?.edge_types.length ?? 0})</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                    {project.ontology?.edge_types.map(e => (
                      <span key={e.name} style={{ background:'var(--purple-dim)', border:'1px solid var(--purple)', borderRadius:20, padding:'4px 12px', fontSize:12, color:'#c4b5fd' }}>{e.name}</span>
                    ))}
                  </div>
                </div>
                <button className="btn btn-primary" onClick={() => { setStep(2); startGraphBuild() }} disabled={loading}>
                  {loading ? 'STARTING…' : 'BUILD KNOWLEDGE GRAPH →'}
                </button>
              </>
            ) : (
              <div style={{ color:'var(--text-2)', fontSize:14 }}>Loading project…</div>
            )}
          </div>
        )}

        {/* ── Step 2: Graph Build ── */}
        {step === 2 && (
          <div className="card">
            <div className="card-title" style={{ color:'var(--purple)' }}>02 — GRAPH BUILD</div>
            <p style={{ color:'var(--text-2)', fontSize:14, marginBottom:20 }}>
              Extracting entities and relationships from your documents and building the Zep knowledge graph.
            </p>
            <div style={{ marginBottom:8, display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--text-2)' }}>
              <span>{buildMsg || 'Queued…'}</span>
              <span style={{ fontFamily:'var(--font-mono)', color:'var(--neon)' }}>{buildProgress}%</span>
            </div>
            <div className="progress-bar-wrap">
              <div className="progress-bar-fill" style={{ width:`${buildProgress}%` }} />
            </div>
            {buildProgress === 100 && (
              <div style={{ marginTop:16, color:'var(--green)', fontSize:14 }}>✓ Knowledge graph built successfully</div>
            )}
            {!buildTaskId && (
              <button className="btn btn-primary" style={{ marginTop:16 }} onClick={startGraphBuild} disabled={loading}>
                {loading ? 'STARTING…' : 'START GRAPH BUILD'}
              </button>
            )}
          </div>
        )}

        {/* ── Step 3: Simulation ── */}
        {step === 3 && (
          <div className="card">
            <div className="card-title" style={{ color:'var(--yellow)' }}>03 — SIMULATION</div>
            <p style={{ color:'var(--text-2)', fontSize:14, marginBottom:20 }}>
              Running multi-agent social media simulation. 8 AI agents with different personas will debate and react to the scenario.
            </p>
            {!simTaskId ? (
              <button className="btn btn-primary" onClick={startSimulation} disabled={loading}>
                {loading ? 'STARTING…' : 'LAUNCH SIMULATION →'}
              </button>
            ) : (
              <>
                <div style={{ marginBottom:8, display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--text-2)' }}>
                  <span>{simMsg || 'Running…'}</span>
                  <span style={{ fontFamily:'var(--font-mono)', color:'var(--yellow)' }}>{simProgress}%</span>
                </div>
                <div className="progress-bar-wrap">
                  <div className="progress-bar-fill" style={{ background:'linear-gradient(90deg,var(--purple),var(--yellow))', width:`${simProgress}%` }} />
                </div>
                {simulation && (
                  <div style={{ marginTop:20 }}>
                    <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:16 }}>
                      <span className="stat-pill">Posts <span className="stat-val">{simulation.summary?.total_posts}</span></span>
                      <span className="stat-pill">Bullish <span className="stat-val" style={{ color:'var(--green)' }}>{simulation.summary?.bullish_count}</span></span>
                      <span className="stat-pill">Bearish <span className="stat-val" style={{ color:'var(--red)' }}>{simulation.summary?.bearish_count}</span></span>
                      <span className="stat-pill">Score <span className="stat-val">{simulation.summary?.sentiment_score?.toFixed(2)}</span></span>
                    </div>
                    <div style={{ fontSize:12, color:'var(--text-3)', letterSpacing:1, marginBottom:8 }}>LATEST POSTS</div>
                    <div className="post-feed">
                      {simulation.posts.slice(-12).map((p, i) => (
                        <div key={i} className={`post-card ${p.sentiment}`}>
                          <div className="post-meta">
                            <span style={{ color:'var(--neon)' }}>@{p.agent_name}</span>
                            <span>{p.entity_type}</span>
                            <span>{p.platform}</span>
                            <span style={{ marginLeft:'auto', color: p.sentiment === 'bullish' ? 'var(--green)' : p.sentiment === 'bearish' ? 'var(--red)' : 'var(--text-3)' }}>{p.sentiment}</span>
                          </div>
                          <div className="post-content">{p.content}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Step 4: Report ── */}
        {step === 4 && (
          <div className="card">
            <div className="card-title" style={{ color:'var(--cyan)' }}>04 — REPORT GENERATION</div>
            <p style={{ color:'var(--text-2)', fontSize:14, marginBottom:20 }}>
              The Report Agent will analyse all simulation data and knowledge graph insights to generate a comprehensive analysis report.
            </p>
            {simulation && (
              <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:20 }}>
                <span className="stat-pill">Posts <span className="stat-val">{simulation.summary?.total_posts}</span></span>
                <span className="stat-pill">Sentiment <span className="stat-val">{simulation.summary?.sentiment_score?.toFixed(2)}</span></span>
                <span className="stat-pill">Agents <span className="stat-val">{simulation.agents.length}</span></span>
              </div>
            )}
            {!reportTaskId ? (
              <button className="btn btn-primary" onClick={startReport} disabled={loading || !simulation}>
                {loading ? 'STARTING…' : 'GENERATE REPORT →'}
              </button>
            ) : (
              <>
                <div style={{ marginBottom:8, display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--text-2)' }}>
                  <span>{reportMsg || 'Running…'}</span>
                  <span style={{ fontFamily:'var(--font-mono)', color:'var(--cyan)' }}>{reportProgress}%</span>
                </div>
                <div className="progress-bar-wrap">
                  <div className="progress-bar-fill" style={{ background:'linear-gradient(90deg,var(--neon),var(--cyan))', width:`${reportProgress}%` }} />
                </div>
                {reportId && (
                  <div style={{ marginTop:16, display:'flex', gap:12, alignItems:'center' }}>
                    <span style={{ color:'var(--green)', fontSize:14 }}>✓ Report complete — redirecting…</span>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Step 5: Interview (redirect) ── */}
        {step === 5 && (
          <div className="card">
            <div className="card-title" style={{ color:'var(--green)' }}>05 — DEEP INTERACTION</div>
            <p style={{ color:'var(--text-2)', fontSize:14, marginBottom:20 }}>
              The simulation and report are complete. You can now converse with the AI analyst about the findings.
            </p>
            {reportId && (
              <div style={{ display:'flex', gap:12 }}>
                <button className="btn btn-primary" onClick={() => router.push(`/simulate/report/${reportId}`)}>
                  VIEW REPORT →
                </button>
                <button className="btn" style={{ background:'var(--purple-dim)', color:'#c4b5fd', border:'1px solid var(--purple)' }} onClick={() => router.push(`/simulate/interaction/${simulation?.simulation_id}`)}>
                  DEEP INTERACTION →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
