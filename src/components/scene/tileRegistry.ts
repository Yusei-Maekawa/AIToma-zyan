import * as THREE from 'three'

/**
 * 手牌の「今まさに表示されている」位置・回転・拡大率を uid ごとに保持するレジストリ。
 *
 * 打牌時、牌は手牌（HandTile）から外れて飛行用コンポーネント（FlyingTile）に引き継がれる。
 * 計算上の配置ではなく実際の表示位置から飛び立たせることで、
 * 持ち上げアニメーションの途中で打牌しても牌がワープしない。
 *
 * React の state ではなくただの Map なので、毎フレーム更新しても再レンダリングは起きない。
 */
export interface TileTransform {
  position: THREE.Vector3
  rotation: THREE.Euler
  scale: number
}

export class TileTransformRegistry {
  private map = new Map<string, TileTransform>()

  /** 毎フレーム呼ばれるのでオブジェクトを使い回してGCを発生させない */
  write(uid: string, obj: THREE.Object3D) {
    let entry = this.map.get(uid)
    if (!entry) {
      entry = { position: new THREE.Vector3(), rotation: new THREE.Euler(), scale: 1 }
      this.map.set(uid, entry)
    }
    entry.position.copy(obj.position)
    entry.rotation.copy(obj.rotation)
    entry.scale = obj.scale.x
  }

  read(uid: string): TileTransform | undefined {
    return this.map.get(uid)
  }

  delete(uid: string) {
    this.map.delete(uid)
  }

  clear() {
    this.map.clear()
  }
}
