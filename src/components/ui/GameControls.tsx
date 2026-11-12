import type { CSSProperties } from 'react'
import { CATEGORY_LIST } from '../../data/categories'

interface GameControlsProps {
  canDraw: boolean
  canDiscard: boolean
  isDiscarding: boolean
  /** ツモ済み（14枚）か */
  hasDrawn: boolean
  selectedName: string | null
  handCount: number
  wallCount: number
  discardCount: number
  showCategory: boolean
  soundOn: boolean
  onDraw: () => void
  onDiscard: () => void
  onRedeal: () => void
  onResetCamera: () => void
  onToggleCategory: () => void
  onToggleSound: () => void
  /** 全画面ボタン（タッチ端末かつ対応ブラウザのみ。非表示なら null） */
  fullscreen: { active: boolean; onToggle: () => void } | null
}

/** long: 通常の表示名 / short: スマホ横画面など狭い場所での表示名 */
function Label({ long, short }: { long: string; short: string }) {
  return (
    <>
      <span className="label-long">{long}</span>
      <span className="label-short">{short}</span>
    </>
  )
}

function Switch({
  checked,
  onChange,
  label,
  shortLabel,
}: {
  checked: boolean
  onChange: () => void
  label: string
  shortLabel: string
}) {
  return (
    <label className="switch">
      <input type="checkbox" role="switch" checked={checked} onChange={onChange} />
      <span className="switch__track" aria-hidden="true">
        <span className="switch__thumb" />
      </span>
      <span className="switch__label">
        <Label long={label} short={shortLabel} />
      </span>
    </label>
  )
}

/**
 * 操作UI。
 *  - 右上: 表示設定（カテゴリ表示・効果音・カメラリセット）、カテゴリ凡例、操作方法
 *  - 右下: ツモ・打牌ボタン・配り直し・枚数表示
 */
export function GameControls({
  canDraw,
  canDiscard,
  isDiscarding,
  hasDrawn,
  selectedName,
  handCount,
  wallCount,
  discardCount,
  showCategory,
  soundOn,
  onDraw,
  onDiscard,
  onRedeal,
  onResetCamera,
  onToggleCategory,
  onToggleSound,
  fullscreen,
}: GameControlsProps) {
  return (
    <>
      <section className="panel settings" aria-label="表示設定">
        <Switch checked={showCategory} onChange={onToggleCategory} label="カテゴリ名を表示" shortLabel="カテゴリ名" />
        <Switch checked={soundOn} onChange={onToggleSound} label="効果音" shortLabel="効果音" />
        <button type="button" className="btn btn--ghost" onClick={onResetCamera} title="カメラを初期位置に戻す（R）">
          <span aria-hidden="true">⟲</span> <Label long="カメラリセット" short="視点" />
        </button>
        {fullscreen && (
          <button type="button" className="btn btn--ghost" onClick={fullscreen.onToggle}>
            <span aria-hidden="true">{fullscreen.active ? '⤡' : '⤢'}</span>{' '}
            <Label long={fullscreen.active ? '全画面を終了' : '全画面'} short={fullscreen.active ? '終了' : '全画面'} />
          </button>
        )}

        <details className="fold">
          <summary>カテゴリ凡例</summary>
          <ul className="legend">
            {CATEGORY_LIST.map((c) => (
              <li key={c.id} style={{ '--chip': c.uiColor } as CSSProperties}>
                <span className="legend__dot" aria-hidden="true" />
                {c.label}
                <span className="legend__short">{c.shortLabel}</span>
              </li>
            ))}
          </ul>
        </details>

        <details className="fold">
          <summary>操作方法</summary>
          <dl className="help">
            <dt>ツモ</dt>
            <dd>「ツモ」ボタン / T</dd>
            <dt>牌を選ぶ</dt>
            <dd>クリック / タップ（もう一度で解除）</dd>
            <dt>打牌</dt>
            <dd>ツモ後（14枚）に「打牌」ボタン / Enter・Space</dd>
            <dt>選択を移動</dt>
            <dd>← → キー</dd>
            <dt>選択解除</dt>
            <dd>Esc</dd>
            <dt>カメラ</dt>
            <dd>ドラッグで回転・ホイールでズーム・R でリセット</dd>
            <dt>解説</dt>
            <dd>PC: 牌にカーソル / スマホ（横画面）: 選択した牌の解説が左上に表示</dd>
          </dl>
        </details>
      </section>

      <section className="panel action-bar" aria-label="操作">
        <div className="action-bar__status">
          <span>
            手牌 <strong>{handCount}</strong>
          </span>
          <span>
            山 <strong>{wallCount}</strong>
          </span>
          <span>
            河 <strong>{discardCount}</strong>
          </span>
        </div>
        <p className="action-bar__selected" aria-live="polite">
          {isDiscarding
            ? '打牌中…'
            : !hasDrawn
              ? wallCount > 0
                ? 'ツモしてください'
                : '牌山がありません'
              : selectedName
                ? `選択中: ${selectedName}`
                : '捨てる牌を選択'}
        </p>
        <button type="button" className="btn btn--draw" onClick={onDraw} disabled={!canDraw} title="牌山から1枚引く（T）">
          ツモ
        </button>
        <button
          type="button"
          className="btn btn--discard"
          onClick={onDiscard}
          disabled={!canDiscard}
          title="選択した牌を捨てる（Enter）"
        >
          打牌
        </button>
        <button type="button" className="btn btn--ghost btn--small" onClick={onRedeal} disabled={isDiscarding}>
          配り直す
        </button>
      </section>
    </>
  )
}
