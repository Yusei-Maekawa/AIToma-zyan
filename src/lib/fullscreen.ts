/**
 * 全画面表示（スマホ横画面でアドレスバー等を隠し、卓を広く見せる）。
 * Fullscreen API に対応していない環境（iPhone の Safari など）ではボタン自体を出さない。
 */
export function canFullscreen(): boolean {
  return typeof document !== 'undefined' && !!document.fullscreenEnabled
}

export function isFullscreen(): boolean {
  return !!document.fullscreenElement
}

export async function toggleFullscreen(): Promise<void> {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen()
      return
    }
    await document.documentElement.requestFullscreen({ navigationUI: 'hide' })
    // Android Chrome などでは全画面中に限り向きを固定できる。非対応なら何もしない
    const orientation = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }
    await orientation.lock?.('landscape').catch(() => {})
  } catch {
    // ユーザー操作以外からの呼び出し・ブラウザの拒否などは無視する
  }
}
