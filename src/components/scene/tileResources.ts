import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { TILE } from '../../game/layout'

/**
 * 牌の3Dモデル（共通）を構成するジオメトリ・マテリアル。
 * 全ての牌で1つずつを共有し、牌の枚数が増えても GPU メモリとドローコール準備のコストを抑える。
 *
 * 牌の構造（実物の麻雀牌と同じ2層構造）:
 *   ┌──────────┐ +Z（牌面）
 *   │ 象牙色の本体 │ ← 厚みの約64%
 *   ├──────────┤
 *   │ 背（濃紺）   │ ← 約40%（少し重ねて継ぎ目を隠す）
 *   └──────────┘ -Z
 */

export const FRONT_DEPTH = TILE.depth * 0.64
export const BACK_DEPTH = TILE.depth * 0.4
export const FRONT_Z = TILE.depth / 2 - FRONT_DEPTH / 2
export const BACK_Z = -TILE.depth / 2 + BACK_DEPTH / 2
export const FACE_Z = TILE.depth / 2 + 0.0015

/** 牌面プレーンの大きさ（角の丸みを避けて平らな部分にだけ貼る） */
export const FACE_WIDTH = TILE.width - TILE.radius * 1.6
export const FACE_HEIGHT = TILE.height - TILE.radius * 1.6

export const frontGeometry = new RoundedBoxGeometry(TILE.width, TILE.height, FRONT_DEPTH, 4, TILE.radius)
export const backGeometry = new RoundedBoxGeometry(TILE.width, TILE.height, BACK_DEPTH, 4, TILE.radius)
export const faceGeometry = new THREE.PlaneGeometry(FACE_WIDTH, FACE_HEIGHT)
export const glowGeometry = new THREE.PlaneGeometry(TILE.width * 2.1, TILE.height * 1.85)

/** 本体：象牙色。クリアコートで樹脂のツヤを出し、側面のハイライトで牌面との質感差をつける */
export const ivoryMaterial = new THREE.MeshPhysicalMaterial({
  color: '#f1ede2',
  roughness: 0.38,
  metalness: 0,
  clearcoat: 0.7,
  clearcoatRoughness: 0.22,
  sheen: 0.25,
  sheenColor: new THREE.Color('#fff8e6'),
})

/** 背：近未来感のある濃いブルー。少し金属感を足して照明を拾わせる */
export const backMaterial = new THREE.MeshPhysicalMaterial({
  color: '#0c3a63',
  roughness: 0.28,
  metalness: 0.25,
  clearcoat: 1,
  clearcoatRoughness: 0.12,
})

/** レイキャストを無効にする（グロー板が隣の牌のクリックを奪わないように） */
export const noRaycast: THREE.Object3D['raycast'] = () => {}
