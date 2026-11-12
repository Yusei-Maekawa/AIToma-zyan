import { Component, type ErrorInfo, type ReactNode } from 'react'

/** WebGL 非対応・3D描画の初期化失敗時の案内 */
export function WebGLNotice({ detail }: { detail?: string }) {
  return (
    <div className="webgl-notice" role="alert">
      <div className="panel webgl-notice__box">
        <h2>3D表示を開始できませんでした</h2>
        <p>
          このゲームは <strong>WebGL 2</strong> を使って3Dの麻雀卓を描画します。
          お使いのブラウザまたは環境では WebGL 2 が利用できないか、無効になっている可能性があります。
        </p>
        <ul>
          <li>最新版の Google Chrome または Microsoft Edge でお試しください。</li>
          <li>
            ブラウザの設定で「ハードウェアアクセラレーション（グラフィックアクセラレーション）」が有効になっているか確認してください。
          </li>
          <li>グラフィックドライバーを更新すると改善する場合があります。</li>
        </ul>
        {detail && <p className="muted small">詳細: {detail}</p>}
      </div>
    </div>
  )
}

interface BoundaryState {
  error: Error | null
}

/** Canvas 内の描画エラー（WebGLコンテキスト生成失敗など）を捕捉して案内を表示する */
export class SceneErrorBoundary extends Component<{ children: ReactNode }, BoundaryState> {
  state: BoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[AITo] 3D scene error:', error, info.componentStack)
  }

  render() {
    if (this.state.error) return <WebGLNotice detail={this.state.error.message} />
    return this.props.children
  }
}
