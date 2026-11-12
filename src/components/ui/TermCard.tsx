import type { CSSProperties } from 'react'
import type { ITTerm } from '../../types/mahjong'
import { CATEGORIES } from '../../data/categories'
import { findTermByName } from '../../data/terms'

interface TermCardProps {
  term: ITTerm
  /** compact: ホバー用の小さい表示 / full: 解説パネル用 */
  variant: 'compact' | 'full'
  /** 関連技術のうち辞書にあるものをクリックしたとき */
  onRelatedClick?: (termId: string) => void
}

/** IT用語の解説カード（ホバー解説と解説パネルで共通） */
export function TermCard({ term, variant, onRelatedClick }: TermCardProps) {
  const primary = CATEGORIES[term.primaryCategory]
  const style = { '--accent': primary.uiColor } as CSSProperties
  const others = term.categories.filter((c) => c !== term.primaryCategory)

  return (
    <article className={`term-card term-card--${variant}`} style={style}>
      <header className="term-card__head">
        <span className="term-card__swatch" aria-hidden="true" />
        <div>
          <h3 className="term-card__name">{term.name}</h3>
          <p className="term-card__reading">{term.reading}</p>
        </div>
      </header>

      <ul className="term-card__cats" aria-label="カテゴリ">
        <li className="cat-chip cat-chip--primary" style={{ '--chip': primary.uiColor } as CSSProperties}>
          <span className="cat-chip__tag">主</span>
          {primary.label}
        </li>
        {others.map((id) => (
          <li key={id} className="cat-chip" style={{ '--chip': CATEGORIES[id].uiColor } as CSSProperties}>
            {CATEGORIES[id].label}
          </li>
        ))}
      </ul>

      <p className="term-card__desc">{term.description}</p>

      <section className="term-card__section">
        <h4>使用例</h4>
        <ul className="term-card__examples">
          {term.examples.map((ex) => (
            <li key={ex}>{ex}</li>
          ))}
        </ul>
      </section>

      <section className="term-card__section">
        <h4>関連技術</h4>
        <ul className="term-card__related">
          {term.related.map((name) => {
            const linked = findTermByName(name)
            if (linked && onRelatedClick) {
              return (
                <li key={name}>
                  <button
                    type="button"
                    className="related-chip related-chip--link"
                    style={{ '--chip': CATEGORIES[linked.primaryCategory].uiColor } as CSSProperties}
                    onClick={() => onRelatedClick(linked.id)}
                    title={`${linked.name} の解説を見る`}
                  >
                    {name}
                  </button>
                </li>
              )
            }
            return (
              <li key={name}>
                <span className={`related-chip${linked ? ' related-chip--known' : ''}`}>{name}</span>
              </li>
            )
          })}
        </ul>
      </section>
    </article>
  )
}
