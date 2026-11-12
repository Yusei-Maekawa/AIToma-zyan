import { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import { MahjongScene } from './components/scene/MahjongScene'
import { GameControls } from './components/ui/GameControls'
import { TermInfoPanel } from './components/ui/TermInfoPanel'
import { TermTooltip } from './components/ui/TermTooltip'
import { TitleBar } from './components/ui/TitleBar'
import { SceneErrorBoundary, WebGLNotice } from './components/ui/SceneFallback'
import { createInitialState, gameReducer } from './game/gameReducer'
import { getTerm } from './data/terms'
import { RotateNotice } from './components/ui/RotateNotice'
import { detectWebGL2 } from './lib/webgl'
import { playDiscard, playSelect, setSoundEnabled, unlockAudio } from './lib/sound'
import { PORTRAIT_PHONE_QUERY, useMediaQuery } from './lib/useMediaQuery'
import { canFullscreen, isFullscreen, toggleFullscreen } from './lib/fullscreen'

/**
 * アプリのルート。ゲーム状態（useReducer）と表示設定を持ち、
 * 3Dシーン（MahjongScene）と HTML の UI に配る。
 *
 * 再レンダリング対策:
 *   ホバー中の用語など UI だけで使う状態が変わっても、MahjongScene（memo）に渡す props は変わらないため
 *   3D 側は再レンダリングされない。コールバックは useCallback で参照を固定している。
 */
export default function App() {
  const [game, dispatch] = useReducer(gameReducer, undefined, createInitialState)
  const [showCategory, setShowCategory] = useState(true)
  const [soundOn, setSoundOn] = useState(true)
  const [hoverTermId, setHoverTermId] = useState<string | null>(null)
  const [cameraResetToken, setCameraResetToken] = useState(0)
  const webgl2 = useMemo(detectWebGL2, [])
  // スマホ縦向きでは回転を促し、裏の3D描画は止めて電池を節約する
  const portraitPhone = useMediaQuery(PORTRAIT_PHONE_QUERY)
  const touchDevice = useMediaQuery('(pointer: coarse)')
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    const onChange = () => setFullscreen(isFullscreen())
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const selectedTile = game.hand.find((t) => t.uid === game.selectedUid) ?? null
  const isDiscarding = game.flying !== null
  const canDiscard = selectedTile !== null && !isDiscarding

  useEffect(() => setSoundEnabled(soundOn), [soundOn])

  const handleSelect = useCallback((uid: string) => {
    unlockAudio()
    playSelect()
    dispatch({ type: 'SELECT', uid })
  }, [])

  const handleLand = useCallback(() => {
    playDiscard()
    dispatch({ type: 'LAND' })
  }, [])

  // 打牌の可否は reducer 側でも判定するので、ボタン連打・キー連打でも二重に捨てられない
  const handleDiscard = useCallback(() => {
    unlockAudio()
    dispatch({ type: 'DISCARD' })
  }, [])

  const handleRedeal = useCallback(() => {
    setHoverTermId(null)
    dispatch({ type: 'REDEAL' })
  }, [])

  const handleResetCamera = useCallback(() => setCameraResetToken((n) => n + 1), [])
  const toggleCategory = useCallback(() => setShowCategory((v) => !v), [])
  const toggleSound = useCallback(() => setSoundOn((v) => !v), [])

  // キーボード操作
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const el = e.target as HTMLElement | null
      const tag = el?.tagName
      if (tag === 'TEXTAREA' || (tag === 'INPUT' && (el as HTMLInputElement).type === 'text')) return
      // ボタン・スイッチにフォーカスがあるときの Enter/Space は、その要素本来の動作に任せる
      const nativeActivation = tag === 'BUTTON' || tag === 'INPUT' || tag === 'SUMMARY'

      switch (e.key) {
        case 'ArrowLeft':
        case 'ArrowRight':
          e.preventDefault()
          unlockAudio()
          playSelect()
          dispatch({ type: 'SELECT_NEIGHBOR', direction: e.key === 'ArrowLeft' ? -1 : 1 })
          break
        case 'Enter':
        case ' ':
          if (nativeActivation || e.repeat) return
          e.preventDefault()
          handleDiscard()
          break
        case 'Escape':
          dispatch({ type: 'DESELECT' })
          break
        case 'r':
        case 'R':
          handleResetCamera()
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleDiscard, handleResetCamera])

  return (
    <div className="app">
      <div className="scene">
        {webgl2 ? (
          <SceneErrorBoundary>
            <MahjongScene
              hand={game.hand}
              selectedUid={game.selectedUid}
              discards={game.discards}
              flying={game.flying}
              dealId={game.dealId}
              showCategory={showCategory}
              cameraResetToken={cameraResetToken}
              paused={portraitPhone}
              onSelect={handleSelect}
              onHover={setHoverTermId}
              onLand={handleLand}
            />
          </SceneErrorBoundary>
        ) : (
          <WebGLNotice />
        )}
      </div>

      <div className="hud">
        <TitleBar />
        <GameControls
          canDiscard={canDiscard}
          isDiscarding={isDiscarding}
          selectedName={selectedTile ? getTerm(selectedTile.termId).name : null}
          handCount={game.hand.length}
          discardCount={game.discards.length + (game.flying ? 1 : 0)}
          showCategory={showCategory}
          soundOn={soundOn}
          onDiscard={handleDiscard}
          onRedeal={handleRedeal}
          onResetCamera={handleResetCamera}
          onToggleCategory={toggleCategory}
          onToggleSound={toggleSound}
          fullscreen={touchDevice && canFullscreen() ? { active: fullscreen, onToggle: toggleFullscreen } : null}
        />
        <TermInfoPanel selectedTermId={selectedTile?.termId ?? null} />
      </div>

      <TermTooltip termId={hoverTermId} />
      {portraitPhone && <RotateNotice />}
    </div>
  )
}
