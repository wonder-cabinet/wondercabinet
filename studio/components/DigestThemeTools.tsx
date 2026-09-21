import React, {useEffect, useState} from 'react'
import {useClient, useFormValue} from 'sanity'
import type {StringInputProps} from 'sanity'
import tinycolor from 'tinycolor2'

// Purely a display/tools field -- its own value is never read or written.
// Sits above the real digestThemeBg/digestThemeFg color pickers on
// weeklyIssue and does two things a plain color field can't:
//  1. Shows one-click swatches for color pairs used on past weeks (read
//     from the digestColorHistory singleton, which
//     api/generate-weekly-digest.mjs writes to every time a digest is
//     actually generated with a theme -- an auto-growing preset list
//     instead of a fixed one someone has to maintain).
//  2. A live preview of the cover slide (the one digest image that
//     doesn't depend on event content) that updates as either the
//     presets or the manual color pickers below change, via a
//     lightweight read-only preview endpoint (api/preview-weekly-cover.mjs)
//     -- so Ibrahim can see roughly what a theme will look like before
//     spending a full "Generate weekly digest" click on it.
const SITE_ORIGIN = process.env.SANITY_STUDIO_SITE_ORIGIN || 'https://www.wondercabinet.space'
const TOKEN = process.env.SANITY_STUDIO_GENERATE_TOKEN
const DEFAULT_BG = '#77FF90'
const DEFAULT_FG = '#4450D6'

type Pair = {_key?: string; bg?: string; fg?: string}
type ColorFieldValue = {hex?: string} | undefined

// A preset swatch stores plain hex strings (see digestColorHistory schema),
// but the real digestThemeBg/digestThemeFg fields are @sanity/color-input's
// full `color` object (hex + hsl + hsv + rgb). tinycolor2 is already a
// transitive dependency of @sanity/color-input itself (via react-color),
// so this doesn't add a new dependency to the actual rendering pipeline --
// only to the Studio's own UI code.
function hexToColorValue(hex: string) {
  const c = tinycolor(hex)
  const rgb = c.toRgb()
  const hsl = c.toHsl()
  const hsv = c.toHsv()
  return {
    _type: 'color',
    hex: c.toHexString(),
    alpha: rgb.a,
    rgb: {_type: 'rgbaColor', r: rgb.r, g: rgb.g, b: rgb.b, a: rgb.a},
    hsl: {_type: 'hslaColor', h: hsl.h, s: hsl.s, l: hsl.l, a: hsl.a},
    hsv: {_type: 'hsvaColor', h: hsv.h, s: hsv.s, v: hsv.v, a: hsv.a},
  }
}

export function DigestThemeTools(_props: StringInputProps) {
  const documentId = useFormValue(['_id']) as string | undefined
  const bgColor = useFormValue(['digestThemeBg']) as ColorFieldValue
  const fgColor = useFormValue(['digestThemeFg']) as ColorFieldValue
  const weekStart = (useFormValue(['weekStart']) as string | undefined) || ''
  const weekEnd = (useFormValue(['weekEnd']) as string | undefined) || ''
  const client = useClient({apiVersion: '2024-01-01'})

  const bg = bgColor?.hex || DEFAULT_BG
  const fg = fgColor?.hex || DEFAULT_FG

  const [history, setHistory] = useState<Pair[]>([])
  useEffect(() => {
    let cancelled = false
    client
      .fetch('*[_id == "digestColorHistory"][0]{pairs}')
      .then((doc: {pairs?: Pair[]} | null) => {
        if (!cancelled) setHistory((doc && doc.pairs) || [])
      })
      .catch(() => {
        // Non-critical -- presets just won't show if this fails.
      })
    return () => {
      cancelled = true
    }
  }, [client])

  const [previewSrc, setPreviewSrc] = useState('')
  useEffect(() => {
    if (!TOKEN) return undefined
    const t = setTimeout(() => {
      const params = new URLSearchParams({bg, fg, weekStart, weekEnd, token: TOKEN})
      setPreviewSrc(`${SITE_ORIGIN}/api/preview-weekly-cover?${params.toString()}`)
    }, 350) // debounce -- avoid firing a render on every drag tick of the color picker
    return () => clearTimeout(t)
  }, [bg, fg, weekStart, weekEnd])

  const applyPair = (pairBg: string, pairFg: string) => {
    if (!documentId) return
    client
      .patch(documentId)
      .set({
        digestThemeBg: hexToColorValue(pairBg),
        digestThemeFg: hexToColorValue(pairFg),
      })
      .commit({visibility: 'async'})
      .catch((err: Error) => console.error('DigestThemeTools: failed to apply preset', err))
  }

  return (
    <div style={{display: 'flex', flexWrap: 'wrap', gap: 20, padding: '8px 0', alignItems: 'flex-start'}}>
      <div style={{minWidth: 160}}>
        <div style={{fontSize: 12, opacity: 0.7, marginBottom: 6}}>
          {history.length > 0 ? 'Previously used pairs -- click to apply' : "No used pairs yet -- they'll appear here after a digest is generated"}
        </div>
        {history.length > 0 && (
          <div style={{display: 'flex', flexWrap: 'wrap', gap: 8}}>
            {history.map((pair, i) => (
              <button
                key={pair._key || i}
                type="button"
                title={`${pair.bg} / ${pair.fg}`}
                onClick={() => pair.bg && pair.fg && applyPair(pair.bg, pair.fg)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  border: '1px solid rgba(255,255,255,0.15)',
                  cursor: 'pointer',
                  padding: 0,
                  overflow: 'hidden',
                  display: 'flex',
                }}
              >
                <span style={{flex: 1, background: pair.bg}} />
                <span style={{flex: 1, background: pair.fg}} />
              </button>
            ))}
          </div>
        )}
      </div>
      <div>
        <div style={{fontSize: 12, opacity: 0.7, marginBottom: 6}}>Live preview (cover slide)</div>
        {!TOKEN ? (
          <div style={{fontSize: 12, opacity: 0.7, maxWidth: 200}}>
            Preview unavailable -- SANITY_STUDIO_GENERATE_TOKEN is not set for this Studio.
          </div>
        ) : (
          previewSrc && (
            <img
              key={previewSrc}
              src={previewSrc}
              alt="Cover slide preview"
              style={{
                width: 180,
                height: 225,
                objectFit: 'cover',
                borderRadius: 4,
                border: '1px solid rgba(255,255,255,0.15)',
                display: 'block',
              }}
            />
          )
        )}
      </div>
    </div>
  )
}
