import { useEffect, useLayoutEffect, useRef } from 'react'
import { getTerm } from '../../data/terms'
import { TermCard } from './TermCard'

const OFFSET = 18
const MARGIN = 12

/**
 * PC向けのホバー解説（マウスカーソルに追従）。
 * カーソル位置は React の state にせず、DOM の transform を直接更新するので
 * マウスを動かしても再レンダリングが発生しない。
 */
export function TermTooltip({ termId }: { termId: string | null }) {
  const ref = useRef<HTMLDivElement>(null)
  const mouse = useRef({ x: -9999, y: -9999 })

  const place = () => {
    const el = ref.current
    if (!el) return
    const { innerWidth: vw, innerHeight: vh } = window
    const w = el.offsetWidth
    const h = el.offsetHeight
    let x = mouse.current.x + OFFSET
    let y = mouse.current.y - h - OFFSET
    // 画面からはみ出す場合は反対側に出す
    if (x + w > vw - MARGIN) x = mouse.current.x - w - OFFSET
    if (y < MARGIN) y = mouse.current.y + OFFSET
    x = Math.max(MARGIN, Math.min(x, vw - w - MARGIN))
    y = Math.max(MARGIN, Math.min(y, vh - h - MARGIN))
    el.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`
  }

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      mouse.current.x = e.clientX
      mouse.current.y = e.clientY
      if (ref.current?.dataset.visible === 'true') place()
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  // 表示内容が変わったら、描画直後（ちらつく前）に位置を合わせる
  useLayoutEffect(() => {
    if (termId) place()
  }, [termId])

  return (
    <div ref={ref} className="term-tooltip" data-visible={termId ? 'true' : 'false'} role="tooltip">
      {termId && <TermCard term={getTerm(termId)} variant="compact" />}
    </div>
  )
}
