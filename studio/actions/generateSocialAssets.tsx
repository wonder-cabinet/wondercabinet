import React, {useCallback, useState} from 'react'
import type {DocumentActionComponent, DocumentActionProps} from 'sanity'

// Manual trigger for api/generate-social-assets.mjs, shown on `event`
// documents. Lets an editor generate (or refresh) the Instagram share image
// and A3 print poster on demand -- e.g. right after publishing an event, or
// after changing its type/date/title and wanting new assets without waiting
// for the next edit to no-op against the "only once" webhook rule.
//
// SANITY_STUDIO_SITE_ORIGIN and SANITY_STUDIO_GENERATE_TOKEN must be set in
// the Studio's env (see studio/.env.example) -- the token must match
// STUDIO_GENERATE_TOKEN in the Vercel project's env for api/generate-social-assets.mjs.
const SITE_ORIGIN = process.env.SANITY_STUDIO_SITE_ORIGIN || 'https://www.wondercabinet.space'
const TOKEN = process.env.SANITY_STUDIO_GENERATE_TOKEN

export const generateSocialAssetsAction: DocumentActionComponent = (props: DocumentActionProps) => {
  const {id, published, draft} = props
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)

  const exists = Boolean(published || draft)

  const handle = useCallback(async () => {
    if (!TOKEN) {
      setState('error')
      setMessage('SANITY_STUDIO_GENERATE_TOKEN is not set for this Studio -- ask whoever deployed Studio to add it.')
      return
    }
    setState('loading')
    setMessage(null)
    try {
      const res = await fetch(`${SITE_ORIGIN}/api/generate-social-assets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${TOKEN}`,
        },
        body: JSON.stringify({eventId: id}),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        throw new Error(json.error || `Request failed (${res.status})`)
      }
      setState('done')
      setMessage('Generated -- see the Social Post doc for the share image and A3 poster.')
    } catch (err: any) {
      setState('error')
      setMessage(String(err?.message || err))
    }
  }, [id])

  if (!exists) return null

  return {
    label: state === 'loading' ? 'Generating…' : 'Generate poster + social',
    icon: () => <span>🖼️</span>,
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
