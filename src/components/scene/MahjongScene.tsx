import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Lightformer, Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import type { DiscardedTile, FlyingTile as FlyingTileState, TileInstance, Vec3 } from '../../types/mahjong'
import { CAMERA_FOV, CAMERA_INTRO_POSITION } from '../../game/layout'
import { CATEGORIES } from '../../data/categories'
import { getTerm } from '../../data/terms'
import { setMaxAnisotropy } from '../../lib/textures'
import {
  QUALITY_FPS_FLOOR,
  QUALITY_FPS_LOW_SECONDS,
  QUALITY_FPS_WINDOW,
  QUALITY_PRESETS,
  lowerQuality,
  type QualityLevel,
  type QualitySettings,
} from '../../lib/quality'
import { MahjongTable } from './MahjongTable'
import { HandTiles } from './HandTiles'
import { DiscardPile } from './DiscardPile'
import { FlyingTile } from './FlyingTile'
import { OpponentHands } from './OpponentHands'
import { WallTiles } from './WallTiles'
import { CameraRig } from './CameraRig'
import { DiscardImpact } from './effects/DiscardImpact'
import { TileTransformRegistry } from './tileRegistry'

interface Impact {
  id: number
  position: Vec3
  color: string
}

export interface MahjongSceneProps {
  hand: TileInstance[]
  drawn: TileInstance | null
  wallCount: number
  selectedUid: string | null
  discards: DiscardedTile[]
  flying: FlyingTileState | null
  dealId: number
  showCategory: boolean
  cameraResetToken: number
  /** true の間は描画ループを止める（スマホ縦向きで回転案内を出している間など） */
  paused: boolean
  /** アガリ後は牌を選べない */
  won: boolean
  /** 起動時に決めたアンチエイリアス。切替では変えない（コンテキスト再生成を避ける） */
  antialias: boolean
  quality: QualityLevel
  /** 平均 FPS が低いまま続いたとき、1段下のレベルを渡す */
  onLowerQuality: (level: QualityLevel) => void
  /** ?debug のときだけ渡す。毎フレーム textContent を書き換える */
  debugRef: RefObject<HTMLDivElement | null> | null
  onSelect: (uid: string) => void
  onHover: (termId: string | null) => void
  onLand: (tile: FlyingTileState) => void
}

/** 照明。影の解像度とポイントライト・環境マップはプリセットに従う */
function Lighting({ settings }: { settings: QualitySettings }) {
  const keyRef = useRef<THREE.DirectionalLight>(null)

  useLayoutEffect(() => {
    const light = keyRef.current
    if (!light) return
    light.shadow.mapSize.set(settings.shadowMapSize, settings.shadowMapSize)
    light.shadow.map?.dispose()
    light.shadow.map = null
  }, [settings.shadowMapSize, settings.shadows])

  return (
    <>
      <ambientLight intensity={0.18} />
      <hemisphereLight args={['#a5cdff', '#070b16', 0.5]} />
      <directionalLight
        ref={keyRef}
        position={[5, 13.5, 8.6]}
        intensity={2.3}
        color="#fff6ea"
        castShadow={settings.shadows}
        shadow-mapSize={[settings.shadowMapSize, settings.shadowMapSize]}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
        shadow-camera-near={1}
        shadow-camera-far={36}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
      {settings.pointLights >= 1 && (
        <pointLight position={[-8, 3.6, -5]} color="#8b5cf6" intensity={36} distance={22} />
      )}
      {settings.pointLights >= 2 && (
        <pointLight position={[8, 3, 6.2]} color="#06b6d4" intensity={28} distance={20} />
      )}
      {/* 反射用の環境マップ。外部HDRを読まず、その場で光源パネルを焼き込む（ネットワーク不要・1回だけ描画） */}
      {settings.environment && (
        <Environment key={settings.environmentResolution} resolution={settings.environmentResolution} frames={1}>
          <Lightformer form="rect" intensity={1.6} color="#ffffff" position={[0, 8, 0]} rotation-x={Math.PI / 2} scale={[12, 12, 1]} />
          <Lightformer form="rect" intensity={1.3} color="#22d3ee" position={[-8, 3, 3]} rotation-y={Math.PI / 2} scale={[8, 3, 1]} />
          <Lightformer form="rect" intensity={1.1} color="#a855f7" position={[8, 3, -3]} rotation-y={-Math.PI / 2} scale={[8, 3, 1]} />
          <Lightformer form="ring" intensity={0.8} color="#ffffff" position={[0, 4, 10]} rotation-y={Math.PI} scale={4} />
        </Environment>
      )}
    </>
  )
}

/**
 * 直近 QUALITY_FPS_WINDOW フレームの平均が QUALITY_FPS_FLOOR 未満の状態が
 * QUALITY_FPS_LOW_SECONDS 秒続いたら 1 段下げる。上げない。
 * 数値は ref のみ。React state には毎フレーム書かない。
 */
function QualityMonitor({ level, onLower }: { level: QualityLevel; onLower: (level: QualityLevel) => void }) {
  const samples = useRef<number[]>([])
  const lowSince = useRef<number | null>(null)
  const levelRef = useRef(level)
  levelRef.current = level
  const onLowerRef = useRef(onLower)
  onLowerRef.current = onLower

  useEffect(() => {
    samples.current = []
    lowSince.current = null
  }, [level])

  useFrame((state, delta) => {
    const buf = samples.current
    buf.push(1 / Math.max(delta, 1e-4))
    if (buf.length > QUALITY_FPS_WINDOW) buf.shift()
    if (buf.length < QUALITY_FPS_WINDOW) return
    let sum = 0
    for (const v of buf) sum += v
    const avg = sum / buf.length
    const now = state.clock.elapsedTime
    if (avg >= QUALITY_FPS_FLOOR) {
      lowSince.current = null
      return
    }
    if (lowSince.current === null) {
      lowSince.current = now
      return
    }
    if (now - lowSince.current < QUALITY_FPS_LOW_SECONDS) return
    lowSince.current = now
    buf.length = 0
    const next = lowerQuality(levelRef.current)
    if (next) onLowerRef.current(next)
  })

  return null
}

/** ?debug 用。DOM の textContent だけを毎フレーム更新する */
function FrameStats({ target }: { target: RefObject<HTMLDivElement | null> }) {
  const samples = useRef<number[]>([])
  useFrame((state, delta) => {
    const node = target.current
    if (!node) return
    const buf = samples.current
    buf.push(1 / Math.max(delta, 1e-4))
    if (buf.length > 60) buf.shift()
    let sum = 0
    for (const v of buf) sum += v
    const { calls, triangles } = state.gl.info.render
    node.textContent = `FPS ${(sum / buf.length).toFixed(0)}   DPR ${state.gl.getPixelRatio().toFixed(2)}\ncalls ${calls}   tris ${triangles}`
  })
  return null
}

/**
 * 3Dシーンのルート。
 * ゲーム状態は App から受け取り、ここでは「表示」と「演出」だけを担当する。
 * 頻繁に変わる値（アニメーションの位置など）は各コンポーネント内の ref と useFrame で扱い、
 * React の再レンダリングは選択・打牌などの離散的なイベント時だけに限定している。
 */
export const MahjongScene = memo(function MahjongScene({
  hand,
  drawn,
  wallCount,
  selectedUid,
  discards,
  flying,
  dealId,
  showCategory,
  cameraResetToken,
  paused,
  won,
  antialias,
  quality,
  onLowerQuality,
  debugRef,
  onSelect,
  onHover,
  onLand,
}: MahjongSceneProps) {
  const registry = useMemo(() => new TileTransformRegistry(), [])
  const [impacts, setImpacts] = useState<Impact[]>([])
  const impactId = useRef(0)

  const handleLand = useCallback(
    (tile: FlyingTileState, position: Vec3) => {
      impactId.current += 1
      const color = CATEGORIES[getTerm(tile.termId).primaryCategory].uiColor
      setImpacts((list) => [...list, { id: impactId.current, position: [position[0], 0, position[2]], color }])
      onLand(tile)
    },
    [onLand],
  )
  const removeImpact = useCallback((id: number) => {
    setImpacts((list) => list.filter((i) => i.id !== id))
  }, [])

  const settings = QUALITY_PRESETS[quality]
  const gl = useMemo(
    () => ({ antialias, powerPreference: 'high-performance' as const }),
    [antialias],
  )

  return (
    <Canvas
      shadows={settings.shadows}
      frameloop={paused ? 'never' : 'always'}
      dpr={[1, settings.dprMax]}
      camera={{ position: CAMERA_INTRO_POSITION, fov: CAMERA_FOV, near: 0.1, far: 120 }}
      gl={gl}
      onCreated={({ gl: renderer }) => setMaxAnisotropy(renderer.capabilities.getMaxAnisotropy())}
    >
      <color attach="background" args={['#04060c']} />
      <fog attach="fog" args={['#04060c', 30, 64]} />

      <Lighting settings={settings} />
      <QualityMonitor level={quality} onLower={onLowerQuality} />
      {debugRef && <FrameStats target={debugRef} />}
      <CameraRig resetToken={cameraResetToken} />

      <MahjongTable />
      <OpponentHands />
      <WallTiles count={wallCount} />

      <HandTiles
        hand={hand}
        drawn={drawn}
        wallCount={wallCount}
        selectedUid={selectedUid}
        locked={flying !== null || won}
        showCategory={showCategory}
        dealId={dealId}
        registry={registry}
        onSelect={onSelect}
        onHover={onHover}
      />
      <DiscardPile discards={discards} showCategory={showCategory} onHover={onHover} />
      {flying && (
        <FlyingTile key={flying.uid} tile={flying} showCategory={showCategory} registry={registry} onLand={handleLand} />
      )}

      {impacts.map((i) => (
        <DiscardImpact key={i.id} position={i.position} color={i.color} onDone={() => removeImpact(i.id)} />
      ))}

      {/* 卓上を漂うデータ粒子。low では出さない */}
      {settings.sparkles > 0 && (
        <Sparkles
          key={settings.sparkles}
          count={settings.sparkles}
          scale={[13.5, 2.4, 13.5]}
          position={[0, 1.5, 0]}
          size={2.2}
          speed={0.25}
          opacity={0.5}
          color="#67e8f9"
          noise={0.6}
        />
      )}
    </Canvas>
  )
})
