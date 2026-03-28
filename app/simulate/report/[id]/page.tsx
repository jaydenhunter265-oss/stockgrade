'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import type { Report } from '@/lib/workflow-types'

export default function ReportPage() {
  const params = useParams()
  const reportId = params.id as string
  const router = useRouter()

  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/report/${reportId}`)
      .then(r => r.json())
      .then(j => { if (j.success) setReport(j.data) })
      .finally(() => setLoading(false))
  }, [reportId])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-body)' }}>
      <style>{`
        .report-body { max-width:820px; margin:0 auto; padding:32px 24px; }
        .report-body h1 { font-family:var(--font-display); font-size:28px; color:var(--neon); letter-spacing:2px; margin-bottom:8px; }
        .report-body h2 { font-family:var(--font-display); font-size:20px; color:var(--cyan); letter-spacing:1px; margin:32px 0 12px; padding-bottom:8px; border-bottom:1px solid var(--border); }
        .report-body h3 { font-size:16px; color:var(--text); margin:20px 0 8px; }
        .report-body p { color:var(--text-2); line-height:1.8; margin-bottom:14px; font-size:14px; }
        .report-body ul, .report-body ol { color:var(--text-2); padding-left:20px; margin-bottom:14px; }
        .report-body li { line-height:1.8; font-size:14px; margin-bottom:4px; }
        .report-body strong { color:var(--text); }
        .report-body hr { border:none; border-top:1px solid var(--border); margin:32px 0; }
        .report-body code { font-family:var(--font-mono); background:var(--bg3); padding:2px 6px; border-radius:4px; font-size:12px; color:var(--neon); }
        .topbar { display:flex; align-items:center; justify-content:space-between; padding:0 24px; height:56px; border-bottom:1px solid var(--border); background:var(--bg2); position:sticky; top:0; z-index:10; }
        .btn { padding:10px 22px; border:none; border-radius:var(--radius); font-family:var(--font-display); font-size:13px; letter-spacing:1px; cursor:pointer; transition:all 0.2s; }
        .btn-primary { background:var(--neon); color:var(--bg); font-weight:700; }
        .btn-secondary { background:var(--purple-dim); color:#c4b5fd; border:1px solid var(--purple); }
        .skeleton { background:var(--bg3); border-radius:8px; animation:pulse-dot 1.5s ease-in-out infinite; }
      `}</style>

      <div className="topbar">
        <button onClick={() => router.push('/')} style={{ background:'none', border:'none', color:'var(--neon)', fontFamily:'var(--font-display)', fontSize:18, letterSpacing:2, cursor:'pointer' }}>
          MIROFISH
        </button>
        <div style={{ display:'flex', gap:10 }}>
          {report && (
            <>
              <button className="btn btn-secondary" onClick={() => {
                const blob = new Blob([report.markdown_content], { type:'text/markdown' })
                const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
                a.download = `${reportId}.md`; a.click()
              }}>↓ DOWNLOAD MD</button>
              <button className="btn btn-primary" onClick={() => router.push(`/simulate/interaction/${report.simulation_id}`)}>
                DEEP INTERACTION →
              </button>
            </>
          )}
        </div>
      </div>

      <div className="report-body">
        {loading && (
          <div>
            <div className="skeleton" style={{ height:36, width:'60%', marginBottom:16 }} />
            <div className="skeleton" style={{ height:16, width:'40%', marginBottom:32 }} />
            {[1,2,3].map(i => (
              <div key={i}>
                <div className="skeleton" style={{ height:24, width:'35%', marginBottom:12 }} />
                <div className="skeleton" style={{ height:12, marginBottom:8 }} />
                <div className="skeleton" style={{ height:12, marginBottom:8 }} />
                <div className="skeleton" style={{ height:12, width:'80%', marginBottom:24 }} />
              </div>
            ))}
          </div>
        )}

        {!loading && !report && (
          <div style={{ textAlign:'center', paddingTop:80 }}>
            <div style={{ fontSize:48, marginBottom:16 }}>◎</div>
            <div style={{ color:'var(--text-2)' }}>Report not found</div>
          </div>
        )}

        {report && (
          <MarkdownRenderer content={report.markdown_content} />
        )}
      </div>
    </div>
  )
}

function MarkdownRenderer({ content }: { content: string }) {
  // Simple markdown renderer for the report sections
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith('# ')) {
      elements.push(<h1 key={i}>{line.slice(2)}</h1>)
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={i}>{line.slice(3)}</h2>)
    } else if (line.startsWith('### ')) {
      elements.push(<h3 key={i}>{line.slice(4)}</h3>)
    } else if (line.startsWith('---')) {
      elements.push(<hr key={i} />)
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      const items: string[] = []
      while (i < lines.length && (lines[i].startsWith('- ') || lines[i].startsWith('* '))) {
        items.push(lines[i].slice(2))
        i++
      }
      elements.push(<ul key={i}>{items.map((it, j) => <li key={j} dangerouslySetInnerHTML={{ __html: renderInline(it) }} />)}</ul>)
      continue
    } else if (/^\d+\. /.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, ''))
        i++
      }
      elements.push(<ol key={i}>{items.map((it, j) => <li key={j} dangerouslySetInnerHTML={{ __html: renderInline(it) }} />)}</ol>)
      continue
    } else if (line.trim() === '') {
      elements.push(<div key={i} style={{ height: 8 }} />)
    } else {
      elements.push(<p key={i} dangerouslySetInnerHTML={{ __html: renderInline(line) }} />)
    }
    i++
  }

  return <>{elements}</>
}

function renderInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
}
