import { memo, useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import type { DiscardedTile as DiscardedTileState } from '../../types/mahjong'
import { DISCARD_ROTATION, TILE, discardSlotPosition } from '../../game/layout'
import { MahjongTile, useTileFx } from './MahjongTile'
import { noRaycast } from './tileResources'

const { damp } = THREE.MathUtils

interface DiscardedTileProps {
  tile: DiscardedTileState
  showCategory: boolean
  onHover: (termId: string | null) => void
}

/** 河に置かれた牌。着地直後は牌面が発光し、ゆっくり消えていく */
const DiscardedTile = memo(function DiscardedTile({ tile, showCategory, onHover }: DiscardedTileProps) {
  const fx = useTileFx(tile.termId)
  const flash = useRef(1)
  const pos = discardSlotPosition(tile.slotIndex)

  useFrame((_, delta) => {
    if (flash.current <= 0.001) return
    flash.current = damp(flash.current, 0, 3.2, delta)
    fx.highlight.opacity = flash.current * 0.45
  })

  const handleOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    if (e.nativeEvent.pointerType === 'touch') return
    onHover(tile.termId)
    document.body.style.cursor = 'help'
  }
  const handleOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    onHover(null)
    document.body.style.cursor = 'auto'
  }

  return (
    <group position={pos} rotation={DISCARD_ROTATION} onPointerOver={handleOver} onPointerOut={handleOut}>
      <MahjongTile termId={tile.termId} showCategory={showCategory} fx={fx} />
    </group>
  )
})

/** 最新の捨て牌を示す浮遊マーカー（上下にゆっくり揺れる逆三角） */
function LastDiscardMarker({ slotIndex }: { slotIndex: number }) {
  const ref = useRef<THREE.Mesh>(null)
  const [x, , z] = discardSlotPosition(slotIndex)
  useFrame((state) => {
    const m = ref.current
    if (!m) return
    const t = state.clock.elapsedTime
    m.position.y = TILE.depth + 0.32 + Math.sin(t * 3) * 0.05
    m.rotation.y = t * 1.5
  })
  return (
    <mesh ref={ref} position={[x, TILE.depth + 0.32, z]} rotation-x={Math.PI} raycast={noRaycast}>
      <coneGeometry args={[0.09, 0.16, 3]} />
      <meshBasicMaterial color="#67e8f9" toneMapped={false} transparent opacity={0.9} />
    </mesh>
  )
}

interface DiscardPileProps {
  discards: DiscardedTileState[]
  showCategory: boolean
  onHover: (termId: string | null) => void
}

export const DiscardPile = memo(function DiscardPile({ discards, showCategory, onHover }: DiscardPileProps) {
  const last = discards[discards.length - 1]
  return (
    <group>
      {discards.map((t) => (
        <DiscardedTile key={t.uid} tile={t} showCategory={showCategory} onHover={onHover} />
      ))}
      {last && <LastDiscardMarker key={last.uid} slotIndex={last.slotIndex} />}
    </group>
  )
})
