import { memo, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import type { Ref } from 'react'
import { getFaceMaterial, getGlowTexture } from '../../lib/textures'
import { getTerm } from '../../data/terms'
import { CATEGORIES } from '../../data/categories'
import { TILE } from '../../game/layout'
import {
  BACK_Z,
  FACE_Z,
  FRONT_Z,
  backGeometry,
  backMaterial,
  faceGeometry,
  frontGeometry,
  glowGeometry,
  ivoryMaterial,
  noRaycast,
} from './tileResources'

/**
 * 牌1枚の「見た目」だけを担当するコンポーネント（共通3Dモデル）。
 * 位置・アニメーション・クリック処理は親（HandTile / FlyingTile / DiscardedTile）が持つ。
 *
 * - 本体・背・牌面のジオメトリとマテリアルは全牌で共有
 * - グロー（後光）とハイライト（牌面の発光）は牌ごとに不透明度を変えるため個別マテリアル
 */
export interface TileFx {
  /** 牌の背後に出る後光（加算合成） */
  glow: THREE.MeshBasicMaterial
  /** 牌面に重ねる発光（加算合成） */
  highlight: THREE.MeshBasicMaterial
}

/** 牌ごとの発光用マテリアルを作る。アンマウント時に破棄する */
export function useTileFx(termId: string): TileFx {
  const color = CATEGORIES[getTerm(termId).primaryCategory].uiColor
  const fx = useMemo<TileFx>(() => {
    const common = {
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
      opacity: 0,
    } as const
    return {
      glow: new THREE.MeshBasicMaterial({ ...common, color, map: getGlowTexture() }),
      highlight: new THREE.MeshBasicMaterial({ ...common, color }),
    }
  }, [color])
  useEffect(
    () => () => {
      fx.glow.dispose()
      fx.highlight.dispose()
    },
    [fx],
  )
  return fx
}

interface MahjongTileProps {
  termId: string
  showCategory: boolean
  fx?: TileFx
  castShadow?: boolean
  ref?: Ref<THREE.Group>
}

export const MahjongTile = memo(function MahjongTile({
  termId,
  showCategory,
  fx,
  castShadow = true,
  ref,
}: MahjongTileProps) {
  const faceMaterial = useMemo(() => getFaceMaterial(termId, showCategory), [termId, showCategory])

  return (
    <group ref={ref}>
      <mesh
        geometry={frontGeometry}
        material={ivoryMaterial}
        position-z={FRONT_Z}
        castShadow={castShadow}
        receiveShadow
        dispose={null}
      />
      <mesh
        geometry={backGeometry}
        material={backMaterial}
        position-z={BACK_Z}
        castShadow={castShadow}
        receiveShadow
        dispose={null}
      />
      <mesh geometry={faceGeometry} material={faceMaterial} position-z={FACE_Z} dispose={null} />
      {fx && (
        <>
          <mesh
            geometry={faceGeometry}
            material={fx.highlight}
            position-z={FACE_Z + 0.001}
            raycast={noRaycast}
            dispose={null}
          />
          <mesh
            geometry={glowGeometry}
            material={fx.glow}
            position-z={-TILE.depth / 2 - 0.03}
            raycast={noRaycast}
            renderOrder={-1}
            dispose={null}
          />
        </>
      )}
    </group>
  )
})
