import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { FlyingTile as FlyingTileState, Vec3 } from '../../types/mahjong'
import {
  DISCARD_ROTATION,
  HAND_SCALE,
  HAND_TILT,
  HAND_Y,
  HAND_Z,
  discardSlotPosition,
} from '../../game/layout'
import { MahjongTile, useTileFx } from './MahjongTile'
import type { TileTransformRegistry } from './tileRegistry'

/** 打牌の飛行時間（秒） */
const FLIGHT_DURATION = 0.62
/** 放物線の頂点の高さ */
const ARC_HEIGHT = 0.95

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
const lerp = THREE.MathUtils.lerp

interface FlyingTileProps {
  tile: FlyingTileState
  showCategory: boolean
  registry: TileTransformRegistry
  onLand: (tile: FlyingTileState, position: Vec3) => void
}

/**
 * 手牌から河（捨て牌エリア）へ飛んでいく牌。
 * - 進行度 t = 経過時間 / 飛行時間 で計算するのでフレームレートに依存しない
 * - 水平移動は easeInOutCubic、高さは放物線、回転はひねり（sin 波）を加えて着地時にちょうど0へ戻す
 * - t が 1 に達したら onLand を一度だけ呼ぶ
 */
export function FlyingTile({ tile, showCategory, registry, onLand }: FlyingTileProps) {
  const groupRef = useRef<THREE.Group>(null)
  const fx = useTileFx(tile.termId)
  const anim = useRef<{
    t: number
    landed: boolean
    from: { position: THREE.Vector3; rotation: THREE.Euler; scale: number } | null
  }>({ t: 0, landed: false, from: null })
  const to = discardSlotPosition(tile.slotIndex)

  useFrame((_, delta) => {
    const g = groupRef.current
    const a = anim.current
    if (!g || a.landed) return

    if (!a.from) {
      // 手牌が最後に表示されていた姿勢から飛び立つ（無ければ計算上の位置）
      const snap = registry.read(tile.uid)
      a.from = snap
        ? { position: snap.position.clone(), rotation: snap.rotation.clone(), scale: snap.scale }
        : {
            position: new THREE.Vector3(0, HAND_Y, HAND_Z),
            rotation: new THREE.Euler(HAND_TILT, 0, 0),
            scale: HAND_SCALE,
          }
      registry.delete(tile.uid)
      g.visible = true
    }

    // タブ復帰直後などの極端な delta で瞬間移動しないよう上限を設ける
    a.t = Math.min(1, a.t + Math.min(delta, 0.1) / FLIGHT_DURATION)
    const t = a.t
    const e = easeInOutCubic(t)
    const f = a.from

    g.position.set(
      lerp(f.position.x, to[0], e),
      lerp(f.position.y, to[1], e) + ARC_HEIGHT * 4 * t * (1 - t),
      lerp(f.position.z, to[2], e),
    )
    const twist = Math.sin(Math.PI * t)
    g.rotation.set(
      lerp(f.rotation.x, DISCARD_ROTATION[0], easeOutCubic(t)),
      lerp(f.rotation.y, DISCARD_ROTATION[1], e) + twist * 0.55,
      lerp(f.rotation.z, DISCARD_ROTATION[2], e) - twist * 0.3,
    )
    g.scale.setScalar(lerp(f.scale, 1, e))

    fx.glow.opacity = twist * 0.85
    fx.highlight.opacity = 0.08 + twist * 0.12

    if (t >= 1) {
      a.landed = true
      onLand(tile, to)
    }
  })

  return (
    <group ref={groupRef} visible={false}>
      <MahjongTile termId={tile.termId} showCategory={showCategory} fx={fx} />
    </group>
  )
}
