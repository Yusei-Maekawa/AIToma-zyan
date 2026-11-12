import { useState } from 'react'
import { getTerm } from '../../data/terms'
import { TermCard } from './TermCard'

interface TermInfoPanelProps {
  /** 選択中の牌の用語ID（未選択なら null） */
  selectedTermId: string | null
}

/**
 * 選択中の牌の情報＋IT用語解説パネル（画面左下）。
 *
 * タッチ操作との競合対策:
 *   タップ＝牌の選択に一本化し、選択した牌の解説はこのパネルに常に表示する。
 *   打牌は「打牌」ボタンでしか行わないため、解説を読むためのタップで誤って牌を捨てることがない。
 *
 * 関連技術のうち辞書にある用語はクリックでプレビューでき、「戻る」で選択中の牌に戻れる。
 */
export function TermInfoPanel({ selectedTermId }: TermInfoPanelProps) {
  // 縦長の狭い画面ではパネルが手牌に重なるので最初はたたむ。
  // スマホ横画面ではパネルを手牌より上に配置するので、開いたままにする
  const [collapsed, setCollapsed] = useState(
    () => window.matchMedia('(max-width: 760px) and (min-height: 501px)').matches,
  )
  const [preview, setPreview] = useState<{ base: string | null; id: string } | null>(null)

  // 選択中の牌が変わったらプレビューを解除する（effect を使わず描画中に判定）
  const previewId = preview && preview.base === selectedTermId ? preview.id : null
  const shownId = previewId ?? selectedTermId

  return (
    <aside className={`panel term-panel${collapsed ? ' is-collapsed' : ''}`} aria-live="polite">
      <div className="panel__bar">
        <span className="panel__label">{previewId ? '関連技術のプレビュー' : '選択中の牌'}</span>
        <button
          type="button"
          className="icon-btn"
          onClick={() => setCollapsed((v) => !v)}
          aria-expanded={!collapsed}
          aria-label={collapsed ? '解説を開く' : '解説をたたむ'}
          title={collapsed ? '解説を開く' : '解説をたたむ'}
        >
          {collapsed ? '▴' : '▾'}
        </button>
      </div>

      {!collapsed &&
        (shownId ? (
          <div className="term-panel__body">
            <TermCard
              term={getTerm(shownId)}
              variant="full"
              onRelatedClick={(id) => setPreview({ base: selectedTermId, id })}
            />
            {previewId && (
              <button type="button" className="text-btn" onClick={() => setPreview(null)}>
                ← 選択中の牌に戻る
              </button>
            )}
          </div>
        ) : (
          <p className="term-panel__empty">
            牌をクリック（タップ）して選択すると、ここにIT用語の解説が表示されます。
            <br />
            <span className="muted">PCでは牌にカーソルを合わせるだけでも解説を確認できます。</span>
          </p>
        ))}
    </aside>
  )
}
