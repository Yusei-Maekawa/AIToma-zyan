import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { MahjongScene } from './components/scene/MahjongScene'
import { GameControls } from './components/ui/GameControls'
import { TermInfoPanel } from './components/ui/TermInfoPanel'
import { TermTooltip } from './components/ui/TermTooltip'
import { TitleBar } from './components/ui/TitleBar'
import { SceneErrorBoundary, WebGLNotice } from './components/ui/SceneFallback'
import { createInitialState, gameReducer, handWithDrawn } from './game/gameReducer'
import { initialQuality, QUALITY_PRESETS, type QualityLevel } from './lib/quality'
import { getTerm } from './data/terms'
import { RotateNotice } from './components/ui/RotateNotice'
import { detectWebGL2 } from './lib/webgl'
import { playDiscard, playDraw, playSelect, setSoundEnabled, unlockAudio } from './lib/sound'
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
  const [soundOn, setSoundOn] = useState(false)
  const [hoverTermId, setHoverTermId] = useState<string | null>(null)
  const [cameraResetToken, setCameraResetToken] = useState(0)
  const webgl2 = useMemo(detectWebGL2, [])
  // スマホ縦向きでは回転を促し、裏の3D描画は止めて電池を節約する
  const portraitPhone = useMediaQuery(PORTRAIT_PHONE_QUERY)
  const touchDevice = useMediaQuery('(pointer: coarse)')
  const [fullscreen, setFullscreen] = useState(false)
  const [quality, setQuality] = useState(initialQuality)
  // アンチエイリアスはコンテキスト生成時だけ有効。起動後に Canvas を作り直さない
  const antialias = useRef(QUALITY_PRESETS[quality].antialias).current
  const showDebug = useMemo(() => new URLSearchParams(window.location.search).has('debug'), [])
  const debugRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onChange = () => setFullscreen(isFullscreen())
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const selectedTile = handWithDrawn(game).find((t) => t.uid === game.selectedUid) ?? null
  const isDiscarding = game.flying !== null
  const canDraw = game.drawn === null && game.wall.length > 0 && !isDiscarding
  const canDiscard = game.drawn !== null && selectedTile !== null && !isDiscarding
  // 再レンダー前の連打でも、鳴ったあとは同じツモで鳴らさない
  const canDrawRef = useRef(canDraw)
  canDrawRef.current = canDraw

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

  // ツモの可否は reducer が最終判定する。効果音は再レンダーを待たず、鳴らし始めたらフラグを折る。
  const handleDraw = useCallback(() => {
    unlockAudio()
    if (canDrawRef.current) {
      canDrawRef.current = false
      playDraw()
    }
    dispatch({ type: 'DRAW' })
  }, [])

  const handleDiscard = useCallback(() => {
    unlockAudio()
    dispatch({ type: 'DISCARD' })
  }, [])

  const handleRedeal = useCallback(() => {
    setHoverTermId(null)
    dispatch({ type: 'REDEAL', seed: Date.now() })
  }, [])

  const handleResetCamera = useCallback(() => setCameraResetToken((n) => n + 1), [])
  const handleQuality = useCallback((level: QualityLevel) => setQuality(level), [])
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
        case 't':
        case 'T':
          if (e.repeat) return
          handleDraw()
          break
        case 'r':
        case 'R':
          handleResetCamera()
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleDraw, handleDiscard, handleResetCamera])

  return (
    <div className="app">
      <div className="scene">
        {webgl2 ? (
          <SceneErrorBoundary>
            <MahjongScene
              hand={game.hand}
              drawn={game.drawn}
              wallCount={game.wall.length}
              selectedUid={game.selectedUid}
              discards={game.discards}
              flying={game.flying}
              dealId={game.dealId}
              showCategory={showCategory}
              cameraResetToken={cameraResetToken}
              paused={portraitPhone}
              antialias={antialias}
              quality={quality}
              onLowerQuality={handleQuality}
              debugRef={showDebug ? debugRef : null}
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
          canDraw={canDraw}
          canDiscard={canDiscard}
          isDiscarding={isDiscarding}
          hasDrawn={game.drawn !== null}
          selectedName={selectedTile ? getTerm(selectedTile.termId).name : null}
          handCount={handWithDrawn(game).length}
          wallCount={game.wall.length}
          discardCount={game.discards.length + (game.flying ? 1 : 0)}
          showCategory={showCategory}
          soundOn={soundOn}
          onDraw={handleDraw}
          onDiscard={handleDiscard}
          onRedeal={handleRedeal}
          onResetCamera={handleResetCamera}
          onToggleCategory={toggleCategory}
          onToggleSound={toggleSound}
          quality={quality}
          onQuality={handleQuality}
          fullscreen={touchDevice && canFullscreen() ? { active: fullscreen, onToggle: toggleFullscreen } : null}
        />
        <TermInfoPanel selectedTermId={selectedTile?.termId ?? null} />
      </div>

      <TermTooltip termId={hoverTermId} />
      {showDebug && <div ref={debugRef} className="debug-hud" aria-hidden="true" />}
      {portraitPhone && <RotateNotice />}
    </div>
  )
}
