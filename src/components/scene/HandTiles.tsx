import { memo, useEffect, useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import type { TileInstance } from '../../types/mahjong'
import {
  HAND_HOVER_LIFT,
  HAND_LIFT,
  HAND_SCALE,
  HAND_TILT,
  HAND_Y,
  HAND_Z,
  handSlotX,
} from '../../game/layout'
import { MahjongTile, useTileFx } from './MahjongTile'
import type { TileTransformRegistry } from './tileRegistry'

const { damp } = THREE.MathUtils

/** ドラッグ（カメラ回転）とクリックを区別する閾値（px） */
const CLICK_DRAG_TOLERANCE = 6

interface HandTileProps {
  uid: string
  termId: string
  x: number
  selected: boolean
  locked: boolean
  showCategory: boolean
  /** 配牌アニメーションの開始遅延（秒） */
  dealDelay: number
  registry: TileTransformRegistry
  onSelect: (uid: string) => void
  onHover: (termId: string | null) => void
}

/**
 * 手牌1枚。
 * 目標値（位置・傾き・発光）を props から決め、useFrame 内で damp（指数減衰）により追従する。
 * damp は経過時間 delta を使うため、60fps でも144fpsでも同じ速さで動く（フレームレート非依存）。
 */
const HandTile = memo(function HandTile({
  uid,
  termId,
  x,
  selected,
  locked,
  showCategory,
  dealDelay,
  registry,
  onSelect,
  onHover,
}: HandTileProps) {
  const groupRef = useRef<THREE.Group>(null)
  const hovered = useRef(false)
  const age = useRef(0)
  const fx = useTileFx(termId)

  // 最新の props を useFrame から参照するための ref（useFrame の再登録を避ける）
  const target = useRef({ x, selected })
  target.current.x = x
  target.current.selected = selected

  useFrame((state, delta) => {
    const g = groupRef.current
    if (!g) return
    age.current += delta

    // 配牌演出：遅延が過ぎるまでは非表示で、上空から降りてくる
    if (age.current < dealDelay) {
      g.visible = false
      return
    }
    if (!g.visible) {
      g.visible = true
      g.position.set(target.current.x, HAND_Y + 1.6, HAND_Z - 0.9)
      g.rotation.set(HAND_TILT - 0.9, 0, 0)
    }

    const isSel = target.current.selected
    const isHover = hovered.current && !locked
    const lift = isSel ? HAND_LIFT : isHover ? HAND_HOVER_LIFT : 0

    g.position.x = damp(g.position.x, target.current.x, 12, delta)
    g.position.y = damp(g.position.y, HAND_Y + lift, 14, delta)
    g.position.z = damp(g.position.z, HAND_Z - (isSel ? 0.12 : 0), 12, delta)
    // 選択中は少し起こして牌面をよりカメラに向ける
    g.rotation.x = damp(g.rotation.x, HAND_TILT + (isSel ? 0.14 : 0), 12, delta)
    const s = damp(g.scale.x, HAND_SCALE * (isSel ? 1.05 : 1), 12, delta)
    g.scale.setScalar(s)

    // 発光：選択中はゆっくり脈打つ
    const pulse = 0.5 + 0.5 * Math.sin(state.clock.elapsedTime * 3.2)
    const glowTarget = isSel ? 0.75 + 0.25 * pulse : isHover ? 0.28 : 0
    const hiTarget = isSel ? 0.07 + 0.05 * pulse : isHover ? 0.04 : 0
    fx.glow.opacity = damp(fx.glow.opacity, glowTarget, 10, delta)
    fx.highlight.opacity = damp(fx.highlight.opacity, hiTarget, 10, delta)

    registry.write(uid, g)
  })

  // 牌が手牌から抜けた（打牌・配り直し）ときにホバー状態とカーソルを戻す
  useEffect(
    () => () => {
      if (hovered.current) {
        onHover(null)
        document.body.style.cursor = 'auto'
      }
    },
    [onHover],
  )

  const handleOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    // タッチ操作ではホバー（持ち上げ・解説）を出さない。タップ＝選択に一本化して操作の競合を防ぐ
    if (e.nativeEvent.pointerType === 'touch') return
    hovered.current = true
    onHover(termId)
    document.body.style.cursor = locked ? 'not-allowed' : 'pointer'
  }
  const handleOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    hovered.current = false
    onHover(null)
    document.body.style.cursor = 'auto'
  }
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    if (e.delta > CLICK_DRAG_TOLERANCE || locked) return
    onSelect(uid)
  }

  return (
    <group
      ref={groupRef}
      visible={false}
      onPointerOver={handleOver}
      onPointerOut={handleOut}
      onClick={handleClick}
    >
      <MahjongTile termId={termId} showCategory={showCategory} fx={fx} />
    </group>
  )
})

interface HandTilesProps {
  hand: TileInstance[]
  selectedUid: string | null
  locked: boolean
  showCategory: boolean
  dealId: number
  registry: TileTransformRegistry
  onSelect: (uid: string) => void
  onHover: (termId: string | null) => void
}

export const HandTiles = memo(function HandTiles({
  hand,
  selectedUid,
  locked,
  showCategory,
  dealId,
  registry,
  onSelect,
  onHover,
}: HandTilesProps) {
  // 配牌直後に存在した uid だけ時間差で登場させる（打牌で並び替わった牌には遅延をつけない）
  const dealt = useRef<{ dealId: number; order: Map<string, number> }>({ dealId: -1, order: new Map() })
  if (dealt.current.dealId !== dealId) {
    dealt.current = { dealId, order: new Map(hand.map((t, i) => [t.uid, i])) }
    // 配り直し時は前の手牌の姿勢情報を捨てる（打牌中は配り直せないので飛行中の牌には影響しない）
    registry.clear()
  }

  return (
    <group>
      {hand.map((t, i) => (
        <HandTile
          key={t.uid}
          uid={t.uid}
          termId={t.termId}
          x={handSlotX(i, hand.length)}
          selected={t.uid === selectedUid}
          locked={locked}
          showCategory={showCategory}
          dealDelay={0.25 + (dealt.current.order.get(t.uid) ?? 0) * 0.055}
          registry={registry}
          onSelect={onSelect}
          onHover={onHover}
        />
      ))}
    </group>
  )
})
