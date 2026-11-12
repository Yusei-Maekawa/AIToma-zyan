/** スマホを縦向きで持っているときに、横画面への回転を促す */
export function RotateNotice() {
  return (
    <div className="rotate-notice" role="alert">
      <div className="rotate-notice__phone" aria-hidden="true">
        <span />
      </div>
      <p className="rotate-notice__title">端末を横向きにしてください</p>
      <p className="rotate-notice__text">AITo麻雀は、スマートフォンでは横画面でプレイします。</p>
    </div>
  )
}
