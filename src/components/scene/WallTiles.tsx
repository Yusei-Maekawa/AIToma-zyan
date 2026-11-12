import { useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'
import { WALL_CAPACITY, WALL_ROTATION, wallSlotPosition } from '../../game/layout'
import { BACK_Z, FRONT_Z, backGeometry, backMaterial, frontGeometry, ivoryMaterial, noRaycast } from './tileResources'

interface WallTilesProps {
  /** 牌山の残り枚数。0〜count-1 番のマスだけを描く */
  count: number
}

/**
 * 牌山（裏向きの牌の山）。
 * 全マスの行列は最初に1回だけ書き込み、ツモで減ったら InstancedMesh の描画数（count）を下げるだけにする。
 * ジオメトリ・マテリアルは他の牌と共有し、ドローコールは2回のまま。
 */
export function WallTiles({ count }: WallTilesProps) {
  const frontRef = useRef<THREE.InstancedMesh>(null)
  const backRef = useRef<THREE.InstancedMesh>(null)

  useLayoutEffect(() => {
    const front = frontRef.current
    const back = backRef.current
    if (!front || !back) return
    const tileM = new THREE.Matrix4()
    const offset = new THREE.Matrix4()
    const out = new THREE.Matrix4()
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(...WALL_ROTATION))
    const pos = new THREE.Vector3()
    const one = new THREE.Vector3(1, 1, 1)

    for (let i = 0; i < WALL_CAPACITY; i++) {
      tileM.compose(pos.set(...wallSlotPosition(i)), q, one)
      front.setMatrixAt(i, out.multiplyMatrices(tileM, offset.makeTranslation(0, 0, FRONT_Z)))
      back.setMatrixAt(i, out.multiplyMatrices(tileM, offset.makeTranslation(0, 0, BACK_Z)))
    }
    front.instanceMatrix.needsUpdate = true
    back.instanceMatrix.needsUpdate = true
    front.computeBoundingSphere()
    back.computeBoundingSphere()
  }, [])

  useLayoutEffect(() => {
    const n = Math.min(count, WALL_CAPACITY)
    if (frontRef.current) frontRef.current.count = n
    if (backRef.current) backRef.current.count = n
  }, [count])

  return (
    <group>
      <instancedMesh
        ref={frontRef}
        args={[frontGeometry, ivoryMaterial, WALL_CAPACITY]}
        raycast={noRaycast}
        castShadow
        receiveShadow
        dispose={null}
      />
      <instancedMesh
        ref={backRef}
        args={[backGeometry, backMaterial, WALL_CAPACITY]}
        raycast={noRaycast}
        castShadow
        receiveShadow
        dispose={null}
      />
    </group>
  )
}
