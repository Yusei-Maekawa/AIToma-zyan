import { memo, useCallback, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, Lightformer, Sparkles } from '@react-three/drei'
import type { DiscardedTile, FlyingTile as FlyingTileState, TileInstance, Vec3 } from '../../types/mahjong'
import { CAMERA_FOV, CAMERA_INTRO_POSITION } from '../../game/layout'
import { CATEGORIES } from '../../data/categories'
import { getTerm } from '../../data/terms'
import { setMaxAnisotropy } from '../../lib/textures'
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
  onSelect: (uid: string) => void
  onHover: (termId: string | null) => void
  onLand: (tile: FlyingTileState) => void
}

/** 照明：キーライト（影あり）＋環境光＋シアン/パープルのリムライト */
function Lighting() {
  return (
    <>
      <ambientLight intensity={0.18} />
      <hemisphereLight args={['#a5cdff', '#070b16', 0.5]} />
      <directionalLight
        position={[5, 13.5, 8.6]}
        intensity={2.3}
        color="#fff6ea"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
        shadow-camera-near={1}
        shadow-camera-far={36}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
      <pointLight position={[-8, 3.6, -5]} color="#8b5cf6" intensity={36} distance={22} />
      <pointLight position={[8, 3, 6.2]} color="#06b6d4" intensity={28} distance={20} />
      {/* 反射用の環境マップ。外部HDRを読まず、その場で光源パネルを焼き込む（ネットワーク不要・1回だけ描画） */}
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={1.6} color="#ffffff" position={[0, 8, 0]} rotation-x={Math.PI / 2} scale={[12, 12, 1]} />
        <Lightformer form="rect" intensity={1.3} color="#22d3ee" position={[-8, 3, 3]} rotation-y={Math.PI / 2} scale={[8, 3, 1]} />
        <Lightformer form="rect" intensity={1.1} color="#a855f7" position={[8, 3, -3]} rotation-y={-Math.PI / 2} scale={[8, 3, 1]} />
        <Lightformer form="ring" intensity={0.8} color="#ffffff" position={[0, 4, 10]} rotation-y={Math.PI} scale={4} />
      </Environment>
    </>
  )
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

  return (
    <Canvas
      shadows
      frameloop={paused ? 'never' : 'always'}
      dpr={[1, 2]}
      camera={{ position: CAMERA_INTRO_POSITION, fov: CAMERA_FOV, near: 0.1, far: 120 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => setMaxAnisotropy(gl.capabilities.getMaxAnisotropy())}
    >
      <color attach="background" args={['#04060c']} />
      <fog attach="fog" args={['#04060c', 30, 64]} />

      <Lighting />
      <CameraRig resetToken={cameraResetToken} />

      <MahjongTable />
      <OpponentHands />
      <WallTiles count={wallCount} />

      <HandTiles
        hand={hand}
        drawn={drawn}
        wallCount={wallCount}
        selectedUid={selectedUid}
        locked={flying !== null}
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

      {/* 卓上を漂うデータ粒子（控えめに） */}
      <Sparkles count={60} scale={[13.5, 2.4, 13.5]} position={[0, 1.5, 0]} size={2.2} speed={0.25} opacity={0.5} color="#67e8f9" noise={0.6} />
    </Canvas>
  )
})
