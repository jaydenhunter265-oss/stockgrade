'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function InteractionPage() {
  const params = useParams()
  const simId = params.id as string
  const router = useRouter()

  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'I have analysed all simulation data and the knowledge graph. What would you like to know about the findings? You can ask about specific agents, sentiment trends, key themes, or any aspect of the simulation.' }
  ])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    if (!input.trim() || streaming) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setStreaming(true)

    const history = messages.map(m => ({ role: m.role, content: m.content }))

    const res = await fetch('/api/report/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ simulation_id: simId, message: userMsg, chat_history: history }),
    })

    if (!res.ok || !res.body) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error: failed to get response.' }])
      setStreaming(false)
      return
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let assistantContent = ''
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      assistantContent += decoder.decode(value, { stream: true })
      setMessages(prev => {
        const next = [...prev]
        next[next.length - 1] = { role: 'assistant', content: assistantContent }
        return next
      })
    }
    setStreaming(false)
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', color:'var(--text)', fontFamily:'var(--font-body)', display:'flex', flexDirection:'column' }}>
      <style>{`
        .chat-topbar { display:flex; align-items:center; justify-content:space-between; padding:0 24px; height:56px; border-bottom:1px solid var(--border); background:var(--bg2); flex-shrink:0; }
        .chat-msgs { flex:1; overflow-y:auto; padding:24px; display:flex; flex-direction:column; gap:16px; }
        .chat-input-bar { padding:16px 24px; border-top:1px solid var(--border); background:var(--bg2); display:flex; gap:12px; flex-shrink:0; }
        .msg-bubble { max-width:680px; padding:14px 18px; border-radius:var(--radius-lg); font-size:14px; line-height:1.7; white-space:pre-wrap; word-break:break-word; }
        .msg-user { background:var(--neon-dim); border:1px solid rgba(0,212,255,0.2); margin-left:auto; color:var(--text); }
        .msg-assistant { background:var(--bg3); border:1px solid var(--border); color:var(--text-2); }
        .msg-assistant strong { color:var(--text); }
        .cursor { display:inline-block; width:2px; height:1em; background:var(--neon); animation:pulse-dot 1s ease-in-out infinite; vertical-align:text-bottom; margin-left:2px; }
        .chat-input { flex:1; background:var(--bg3); border:1px solid var(--border); border-radius:var(--radius); padding:12px 16px; color:var(--text); font-family:var(--font-body); font-size:14px; outline:none; transition:border-color 0.2s; resize:none; min-height:44px; max-height:120px; }
        .chat-input:focus { border-color:var(--neon); }
        .send-btn { padding:12px 20px; background:var(--neon); color:var(--bg); border:none; border-radius:var(--radius); font-family:var(--font-display); font-size:13px; letter-spacing:1px; font-weight:700; cursor:pointer; white-space:nowrap; transition:all 0.2s; }
        .send-btn:disabled { opacity:0.4; cursor:not-allowed; }
        .send-btn:not(:disabled):hover { background:#00eaff; }
        .role-tag { font-family:var(--font-display); font-size:10px; letter-spacing:1.5px; margin-bottom:4px; }
      `}</style>

      <div className="chat-topbar">
        <button onClick={() => router.push('/')} style={{ background:'none', border:'none', color:'var(--neon)', fontFamily:'var(--font-display)', fontSize:18, letterSpacing:2, cursor:'pointer' }}>
          MIROFISH
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--green)', boxShadow:'0 0 8px var(--green)' }} />
          <span style={{ fontFamily:'var(--font-display)', fontSize:13, letterSpacing:1.5, color:'var(--text-2)' }}>ANALYST ONLINE</span>
        </div>
      </div>

      <div className="chat-msgs">
        {messages.map((m, i) => (
          <div key={i} style={{ display:'flex', flexDirection:'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div className="role-tag" style={{ color: m.role === 'user' ? 'var(--neon)' : 'var(--text-3)', paddingLeft: m.role === 'assistant' ? 4 : 0, paddingRight: m.role === 'user' ? 4 : 0 }}>
              {m.role === 'user' ? 'YOU' : 'ANALYST'}
            </div>
            <div className={`msg-bubble msg-${m.role}`}>
              {m.content || (streaming && i === messages.length - 1 ? '' : '')}
              {streaming && i === messages.length - 1 && m.role === 'assistant' && <span className="cursor" />}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-bar">
        <textarea
          className="chat-input"
          placeholder="Ask about the simulation findings, agent perspectives, sentiment drivers…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          rows={1}
        />
        <button className="send-btn" onClick={send} disabled={streaming || !input.trim()}>
          {streaming ? '●●●' : 'SEND →'}
        </button>
      </div>
    </div>
  )
}
