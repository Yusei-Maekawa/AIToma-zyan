import { useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'
import { OPPONENT_HAND_DISTANCE, OPPONENT_SPACING, TILE } from '../../game/layout'
import { BACK_Z, FRONT_Z, backGeometry, backMaterial, frontGeometry, ivoryMaterial } from './tileResources'

const TILES_PER_HAND = 13
/** 右家(+X)・対面(-Z)・左家(-X) の牌の向き（牌面 +Z をY軸回転させた角度） */
const SEAT_ANGLES = [Math.PI / 2, Math.PI, -Math.PI / 2]
const COUNT = TILES_PER_HAND * SEAT_ANGLES.length

/**
 * 他家の手牌（装飾）。本物の卓らしさを出すため、背をこちらに向けて立てた牌を3方向に置く。
 * 39枚 × 2パーツを InstancedMesh で描き、ドローコールを2回に抑える。
 */
export function OpponentHands() {
  const frontRef = useRef<THREE.InstancedMesh>(null)
  const backRef = useRef<THREE.InstancedMesh>(null)

  useLayoutEffect(() => {
    const front = frontRef.current
    const back = backRef.current
    if (!front || !back) return
    const tileM = new THREE.Matrix4()
    const offset = new THREE.Matrix4()
    const out = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const pos = new THREE.Vector3()
    const one = new THREE.Vector3(1, 1, 1)
    const up = new THREE.Vector3(0, 1, 0)

    let i = 0
    for (const angle of SEAT_ANGLES) {
      const center = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle)).multiplyScalar(OPPONENT_HAND_DISTANCE)
      const axis = new THREE.Vector3(Math.cos(angle), 0, -Math.sin(angle))
      q.setFromAxisAngle(up, angle)
      for (let k = 0; k < TILES_PER_HAND; k++) {
        pos.copy(center).addScaledVector(axis, (k - (TILES_PER_HAND - 1) / 2) * OPPONENT_SPACING)
        pos.y = TILE.height / 2
        tileM.compose(pos, q, one)
        front.setMatrixAt(i, out.multiplyMatrices(tileM, offset.makeTranslation(0, 0, FRONT_Z)))
        back.setMatrixAt(i, out.multiplyMatrices(tileM, offset.makeTranslation(0, 0, BACK_Z)))
        i++
      }
    }
    front.instanceMatrix.needsUpdate = true
    back.instanceMatrix.needsUpdate = true
    front.computeBoundingSphere()
    back.computeBoundingSphere()
  }, [])

  return (
    <group>
      <instancedMesh ref={frontRef} args={[frontGeometry, ivoryMaterial, COUNT]} castShadow receiveShadow dispose={null} />
      <instancedMesh ref={backRef} args={[backGeometry, backMaterial, COUNT]} castShadow receiveShadow dispose={null} />
    </group>
  )
}
