'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function ProcessNew() {
  const router = useRouter()
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    const w = window as unknown as Record<string, unknown>
    const fd = w.__mf_pending__ as FormData | undefined
    delete w.__mf_pending__

    if (!fd) {
      router.replace('/')
      return
    }

    fetch('/api/graph/ontology', { method: 'POST', body: fd })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          router.replace(`/simulate/${json.data.project_id}`)
        } else {
          console.error(json.error)
          router.replace('/?error=' + encodeURIComponent(json.error))
        }
      })
      .catch((e) => router.replace('/?error=' + encodeURIComponent(String(e))))
  }, [router])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--text)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, border: '3px solid var(--neon)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--neon)', letterSpacing: 2 }}>ANALYSING DOCUMENTS</div>
        <div style={{ marginTop: 8, color: 'var(--text-2)', fontSize: 14 }}>Building ontology from your files…</div>
      </div>
    </div>
  )
}
