import { getTerm } from '../../data/terms'
import type { MeldGroup, WinDecomposition } from '../../engine/win'

interface WinPanelProps {
  win: WinDecomposition
  onAgain: () => void
}

function meldTitle(meld: MeldGroup): string {
  if (meld.kind === 'same') return `${getTerm(meld.tile).name} ×3`
  return meld.tiles.map((id) => getTerm(id).name).join('・')
}

/** アガリの分解。手牌（画面下）に重ならない位置に出す */
export function WinPanel({ win, onAgain }: WinPanelProps) {
  return (
    <section className="panel win-panel" aria-label="アガリ">
      <h2 className="win-panel__title">アガリ</h2>
      <p className="win-panel__pair">
        ペア <strong>{getTerm(win.pair.tile).name}</strong>
      </p>
      <ol className="win-panel__melds">
        {win.melds.map((meld, i) => (
          <li key={`${meld.kind}-${i}`}>
            <span className="win-panel__name">{meldTitle(meld)}</span>
            <span className="win-panel__reason">{meld.kind === 'same' ? '同じ技術が3枚' : meld.reason}</span>
          </li>
        ))}
      </ol>
      <button type="button" className="btn btn--draw" onClick={onAgain}>
        もう一度
      </button>
    </section>
  )
}
