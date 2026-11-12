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
  WALL_ROTATION,
  handSlotX,
  wallSlotPosition,
} from '../../game/layout'
import { easeInOutCubic, easeOutCubic } from '../../lib/easing'
import { MahjongTile, useTileFx } from './MahjongTile'
import type { TileTransformRegistry } from './tileRegistry'

const { damp, lerp } = THREE.MathUtils

/** ドラッグ（カメラ回転）とクリックを区別する閾値（px） */
const CLICK_DRAG_TOLERANCE = 6
/** ツモ牌が牌山から手牌へ飛ぶ時間（秒） */
const DRAW_FLIGHT_DURATION = 0.7
/** ツモ牌の放物線の頂点の高さ */
const DRAW_ARC_HEIGHT = 1.6

interface HandTileProps {
  uid: string
  termId: string
  x: number
  selected: boolean
  locked: boolean
  showCategory: boolean
  /** 配牌アニメーションの開始遅延（秒） */
  dealDelay: number
  /** ツモで登場した牌なら、飛び立つ牌山のマス番号（登場時の1回だけ参照）。配牌の牌は null */
  drawFromSlot: number | null
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
  drawFromSlot,
  registry,
  onSelect,
  onHover,
}: HandTileProps) {
  const groupRef = useRef<THREE.Group>(null)
  const hovered = useRef(false)
  const age = useRef(0)
  /** ツモ牌の飛行の進行度（0〜1）と出発位置。飛行中以外は null */
  const flight = useRef<{ t: number; from: THREE.Vector3 } | null>(null)
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
      if (drawFromSlot !== null) {
        // ツモ：牌山の裏向きの牌と同じ姿勢から飛び立つ
        const from = new THREE.Vector3(...wallSlotPosition(drawFromSlot))
        flight.current = { t: 0, from }
        g.position.copy(from)
        g.rotation.set(...WALL_ROTATION)
        g.scale.setScalar(1)
      } else {
        g.position.set(target.current.x, HAND_Y + 1.6, HAND_Z - 0.9)
        g.rotation.set(HAND_TILT - 0.9, 0, 0)
      }
    }

    const f = flight.current
    if (f) {
      // 進行度 = 経過時間 / 飛行時間（タブ復帰直後の極端な delta は上限で抑える）
      f.t = Math.min(1, f.t + Math.min(delta, 0.1) / DRAW_FLIGHT_DURATION)
      const e = easeInOutCubic(f.t)
      const arc = Math.sin(Math.PI * f.t)
      g.position.set(
        lerp(f.from.x, target.current.x, e),
        lerp(f.from.y, HAND_Y, e) + DRAW_ARC_HEIGHT * arc,
        lerp(f.from.z, HAND_Z, e),
      )
      // 裏向きから起き上がりながら、途中で少しひねって牌面を見せる
      g.rotation.set(lerp(WALL_ROTATION[0], HAND_TILT, easeOutCubic(f.t)), arc * 0.5, -arc * 0.25)
      g.scale.setScalar(lerp(1, HAND_SCALE, e))
      fx.glow.opacity = arc * 0.8
      if (f.t >= 1) {
        flight.current = null
        // 着地の瞬間に光らせ、以降は通常の damp で消えていく
        fx.glow.opacity = 0.9
      }
      registry.write(uid, g)
      return
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
  /** ツモ牌。右端に HAND_DRAW_GAP だけ離して置く */
  drawn: TileInstance | null
  /** 牌山の残り枚数。ツモ直後はこの番号のマスがちょうど今引いた牌の場所になる */
  wallCount: number
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
  drawn,
  wallCount,
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

  // ツモ牌も同じ配列・同じ key で描く。手出しで手牌に合流しても再マウントされず、理牌位置へ滑って移動する
  const tiles = drawn ? [...hand, drawn] : hand

  return (
    <group>
      {tiles.map((t, i) => {
        // 配牌時に無かった牌＝ツモで来た牌。遅延なしで牌山から飛ばす
        const dealtIndex = dealt.current.order.get(t.uid)
        return (
          <HandTile
            key={t.uid}
            uid={t.uid}
            termId={t.termId}
            x={handSlotX(i, tiles.length, drawn !== null)}
            selected={t.uid === selectedUid}
            locked={locked}
            showCategory={showCategory}
            dealDelay={dealtIndex === undefined ? 0 : 0.25 + dealtIndex * 0.055}
            drawFromSlot={t.uid === drawn?.uid ? wallCount : null}
            registry={registry}
            onSelect={onSelect}
            onHover={onHover}
          />
        )
      })}
    </group>
  )
})
