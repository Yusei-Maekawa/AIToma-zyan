import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Vec3 } from '../../../types/mahjong'
import { getDotTexture, getRingTexture, getVerticalFadeTexture } from '../../../lib/textures'
import { noRaycast } from '../tileResources'

/**
 * 打牌の着地エフェクト。
 *   1. 卓面に広がる衝撃波リング（2重）
 *   2. 下から立ち上る光の柱
 *   3. 飛び散るデータ粒子（重力つき）
 *
 * 演出の差し替えをしやすいよう、エフェクトは「位置・色・終了コールバック」だけを受け取る独立コンポーネントにしている。
 * 役満演出などを追加する際は同じインターフェースで別コンポーネントを作り、MahjongScene の登録先を切り替えればよい。
 */
export interface ImpactEffectProps {
  position: Vec3
  color: string
  onDone: () => void
}

const DURATION = 1.0
const PARTICLE_COUNT = 40
const GRAVITY = 5.5

const ringGeometry = new THREE.PlaneGeometry(1, 1)
const pillarGeometry = new THREE.CylinderGeometry(0.34, 0.34, 1, 32, 1, true)
pillarGeometry.translate(0, 0.5, 0) // 原点を底面に

function additive(color: string, map: THREE.Texture, side: THREE.Side = THREE.FrontSide) {
  return new THREE.MeshBasicMaterial({
    color,
    map,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
    side,
    opacity: 0,
  })
}

export function DiscardImpact({ position, color, onDone }: ImpactEffectProps) {
  const elapsed = useRef(0)
  const done = useRef(false)
  const ring1 = useRef<THREE.Mesh>(null)
  const ring2 = useRef<THREE.Mesh>(null)
  const pillar = useRef<THREE.Mesh>(null)

  const res = useMemo(() => {
    const ringMat1 = additive(color, getRingTexture())
    const ringMat2 = additive('#ffffff', getRingTexture())
    const pillarMat = additive(color, getVerticalFadeTexture(), THREE.DoubleSide)

    // 粒子：初速をランダムに与え、毎フレーム位置を積分する
    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const velocities = new Float32Array(PARTICLE_COUNT * 3)
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 0.8 + Math.random() * 1.6
      velocities[i * 3] = Math.cos(angle) * speed
      velocities[i * 3 + 1] = 1.5 + Math.random() * 2.2
      velocities[i * 3 + 2] = Math.sin(angle) * speed
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const pointsMat = new THREE.PointsMaterial({
      color,
      map: getDotTexture(),
      size: 0.09,
      sizeAttenuation: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
      opacity: 1,
    })
    return { ringMat1, ringMat2, pillarMat, geo, positions, velocities, pointsMat }
  }, [color])

  useEffect(
    () => () => {
      res.ringMat1.dispose()
      res.ringMat2.dispose()
      res.pillarMat.dispose()
      res.geo.dispose()
      res.pointsMat.dispose()
    },
    [res],
  )

  useFrame((_, delta) => {
    if (done.current) return
    const dt = Math.min(delta, 0.05)
    elapsed.current += dt
    const t = elapsed.current / DURATION
    if (t >= 1) {
      done.current = true
      onDone()
      return
    }
    const out = 1 - Math.pow(1 - t, 3)

    // 衝撃波
    if (ring1.current) ring1.current.scale.setScalar(0.5 + out * 2.4)
    res.ringMat1.opacity = (1 - t) * 0.95
    const t2 = Math.max(0, (elapsed.current - 0.08) / (DURATION * 0.7))
    if (ring2.current) ring2.current.scale.setScalar(0.3 + Math.min(1, t2) * 1.5)
    res.ringMat2.opacity = t2 < 1 ? (1 - t2) * 0.6 : 0

    // 光の柱：素早く伸びてから細く消える
    if (pillar.current) {
      pillar.current.scale.set(1 - t * 0.6, 0.3 + out * 1.5, 1 - t * 0.6)
    }
    res.pillarMat.opacity = Math.sin(Math.min(1, t * 1.6) * Math.PI) * 0.75

    // 粒子
    const p = res.positions
    const v = res.velocities
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      v[i * 3 + 1] -= GRAVITY * dt
      p[i * 3] += v[i * 3] * dt
      p[i * 3 + 1] = Math.max(0.01, p[i * 3 + 1] + v[i * 3 + 1] * dt)
      p[i * 3 + 2] += v[i * 3 + 2] * dt
    }
    res.geo.attributes.position.needsUpdate = true
    res.pointsMat.opacity = 1 - t
  })

  return (
    <group position={position}>
      <mesh
        ref={ring1}
        geometry={ringGeometry}
        material={res.ringMat1}
        rotation-x={-Math.PI / 2}
        position-y={0.012}
        raycast={noRaycast}
        dispose={null}
      />
      <mesh
        ref={ring2}
        geometry={ringGeometry}
        material={res.ringMat2}
        rotation-x={-Math.PI / 2}
        position-y={0.014}
        raycast={noRaycast}
        dispose={null}
      />
      <mesh ref={pillar} geometry={pillarGeometry} material={res.pillarMat} raycast={noRaycast} dispose={null} />
      <points
        geometry={res.geo}
        material={res.pointsMat}
        position-y={0.2}
        raycast={noRaycast}
        frustumCulled={false}
        dispose={null}
      />
    </group>
  )
}
