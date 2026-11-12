import { useEffect, useMemo, useRef, type ComponentRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import {
  CAMERA_COMPACT,
  CAMERA_COMPACT_BASE_ASPECT,
  CAMERA_DEFAULT,
  COMPACT_MAX_HEIGHT,
  type CameraPreset,
} from '../../game/layout'

type ControlsImpl = ComponentRef<typeof OrbitControls>

const { damp, clamp } = THREE.MathUtils

/**
 * 画面サイズから構図（プリセット）と、カメラを引く倍率を決める。
 * - スマホ横画面（高さが低い横長画面）: 手牌に寄った CAMERA_COMPACT
 * - それ以外: 卓全体を見渡す CAMERA_DEFAULT。縦長・正方形に近い画面ほど遠ざける
 */
function chooseFraming(width: number, height: number): { preset: CameraPreset; fit: number } {
  const aspect = width / Math.max(1, height)
  if (height <= COMPACT_MAX_HEIGHT && aspect >= 1.3) {
    return { preset: CAMERA_COMPACT, fit: clamp(CAMERA_COMPACT_BASE_ASPECT / aspect, 1, 1.6) }
  }
  return { preset: CAMERA_DEFAULT, fit: clamp(1.5 / aspect, 1, 2.4) }
}

interface CameraRigProps {
  /** 値が変わるたびに初期視点へ戻す */
  resetToken: number
}

/**
 * カメラ操作（OrbitControls）と、カメラ演出（起動時のフライイン・リセット時の滑らかな復帰）。
 * - 左ドラッグ / 1本指: 回転、ホイール / ピンチ: ズーム（パンは誤操作防止のため無効）
 * - 卓の下に潜り込まないよう仰角を制限
 * - ユーザーが触っていない間は、画面サイズや向きが変わると自動で構図を合わせ直す
 */
export function CameraRig({ resetToken }: CameraRigProps) {
  const controls = useRef<ControlsImpl>(null)
  const camera = useThree((s) => s.camera)
  const width = useThree((s) => s.size.width)
  const height = useThree((s) => s.size.height)
  const { preset, fit } = chooseFraming(width, height)

  const goal = useMemo(() => {
    const target = new THREE.Vector3(...preset.target)
    const offset = new THREE.Vector3(...preset.position).sub(target).multiplyScalar(fit)
    return { target, position: target.clone().add(offset), fov: preset.fov }
  }, [preset, fit])
  const goalDistance = goal.position.distanceTo(goal.target)

  // active: 目標視点へ移動中 / userMoved: ユーザーが一度でもカメラを動かしたか
  const anim = useRef({ active: true, userMoved: false })

  useEffect(() => {
    const c = controls.current
    if (!c) return
    c.target.copy(goal.target)
    c.update()
    const onStart = () => {
      // ユーザー操作を最優先し、演出中でも即座に手動操作へ切り替える
      anim.current.userMoved = true
      anim.current.active = false
    }
    c.addEventListener('start', onStart)
    return () => c.removeEventListener('start', onStart)
    // 初回のみ（以降の構図変更は下の effect でアニメーションさせる）
  }, [])

  useEffect(() => {
    if (resetToken === 0) return
    anim.current.userMoved = false
    anim.current.active = true
  }, [resetToken])

  useEffect(() => {
    if (!anim.current.userMoved) anim.current.active = true
  }, [goal])

  useFrame((_, delta) => {
    const c = controls.current
    const a = anim.current
    if (!c) return

    // 画角は構図に合わせて常に追従（手動操作中でも、横画面⇔PC構図の切り替え時に崩れないように）
    const cam = camera as THREE.PerspectiveCamera
    if (cam.isPerspectiveCamera && Math.abs(cam.fov - goal.fov) > 0.01) {
      cam.fov = damp(cam.fov, goal.fov, 3.4, delta)
      cam.updateProjectionMatrix()
    }

    if (!a.active) return
    const p = camera.position
    const tg = c.target
    const k = 3.4
    p.set(damp(p.x, goal.position.x, k, delta), damp(p.y, goal.position.y, k, delta), damp(p.z, goal.position.z, k, delta))
    tg.set(damp(tg.x, goal.target.x, k, delta), damp(tg.y, goal.target.y, k, delta), damp(tg.z, goal.target.z, k, delta))
    if (p.distanceToSquared(goal.position) < 1e-4 && tg.distanceToSquared(goal.target) < 1e-4) {
      p.copy(goal.position)
      tg.copy(goal.target)
      a.active = false
    }
    c.update()
  })

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      enablePan={false}
      rotateSpeed={0.6}
      zoomSpeed={0.8}
      // 構図ごとの初期距離が範囲外にならないようにする（範囲外だとカメラ演出が終わらなくなる）
      minDistance={Math.min(7, goalDistance * 0.75)}
      maxDistance={Math.max(30, goalDistance * 1.3)}
      minPolarAngle={0.12}
      maxPolarAngle={1.22}
    />
  )
}
