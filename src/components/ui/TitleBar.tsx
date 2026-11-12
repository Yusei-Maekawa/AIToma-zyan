export function TitleBar() {
  return (
    <header className="title-bar">
      <div className="title-bar__mark" aria-hidden="true">
        <span />
      </div>
      <div>
        <h1 className="title">
          <span className="title__latin">AITo</span>
          <span className="title__ja">麻雀</span>
        </h1>
        <p className="subtitle">エイトマージャン</p>
      </div>
      <span className="poc-badge" title="React Three Fiber 技術検証プロトタイプ">
        R3F PoC
      </span>
    </header>
  )
}
