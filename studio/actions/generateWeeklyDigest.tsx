import React, {useCallback, useState} from 'react'
import type {DocumentActionComponent, DocumentActionProps} from 'sanity'

// Manual trigger for api/generate-weekly-digest.mjs, shown on `weeklyIssue`
// documents. Renders the three digest slides (cover/EN/AR) plus the
// combined A3 print PDF from that week's Highlighted/Also-happening
// events, and writes them onto this same weeklyIssue doc.
//
// Reuses the same SANITY_STUDIO_SITE_ORIGIN / SANITY_STUDIO_GENERATE_TOKEN
// env vars as generateSocialAssets.tsx -- one shared secret, two actions.
const SITE_ORIGIN = process.env.SANITY_STUDIO_SITE_ORIGIN || 'https://www.wondercabinet.space'
const TOKEN = process.env.SANITY_STUDIO_GENERATE_TOKEN

export const generateWeeklyDigestAction: DocumentActionComponent = (props: DocumentActionProps) => {
  const {id, published, draft} = props
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)

  const exists = Boolean(published || draft)
  const weekStart = (published as any)?.weekStart || (draft as any)?.weekStart

  const handle = useCallback(async () => {
    if (!TOKEN) {
      setState('error')
      setMessage('SANITY_STUDIO_GENERATE_TOKEN is not set for this Studio -- ask whoever deployed Studio to add it.')
      return
    }
    setState('loading')
    setMessage(null)
    try {
      const res = await fetch(`${SITE_ORIGIN}/api/generate-weekly-digest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${TOKEN}`,
        },
        body: JSON.stringify({weeklyIssueId: id}),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        throw new Error(json.error || `Request failed (${res.status})`)
      }
      setState('done')
      setMessage('Generated -- see the Digest fields below for the 3 slides and the A3 PDF.')
    } catch (err: any) {
      setState('error')
      setMessage(String(err?.message || err))
    }
  }, [id])

  if (!exists) return null
  if (!weekStart) {
    return {
      label: 'Generate weekly digest',
      icon: () => <span>🗓️</span>,
      disabled: true,
      onHandle: () => {},
      dialog: undefined,
    }
  }

  return {
    label: state === 'loading' ? 'Generating…' : 'Generate weekly digest',
    icon: () => <span>🗓️</span>,
    disabled: state === 'loading',
    onHandle: handle,
    dialog:
      state === 'done' || state === 'error'
        ? {
            type: 'dialog',
            onClose: () => setState('idle'),
            header: state === 'done' ? 'Done' : 'Failed',
            content: <div style={{padding: 16}}>{message}</div>,
          }
        : undefined,
  }
}
