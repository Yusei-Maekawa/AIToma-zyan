import { memo, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Grid } from '@react-three/drei'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { TABLE } from '../../game/layout'
import { getConsoleTexture, getFeltTextures } from '../../lib/textures'
import { noRaycast } from './tileResources'

const OUTER = (TABLE.feltHalf + TABLE.railWidth) * 2
const FELT = TABLE.feltHalf * 2
const FLOOR_Y = -2.2

/**
 * 3D麻雀卓。
 *  - 本体（外枠）: 濃紺の樹脂＋クリアコート
 *  - 天板: 深緑のフェルト。うっすら回路パターンが発光する（Canvas生成テクスチャ）
 *  - 外枠の内周にシアンの装飾ライト、四隅にパープルのアクセント
 *  - 中央: 風（東南西北）を表示するコンソールと、浮遊するホログラムリング
 */
export const MahjongTable = memo(function MahjongTable() {
  const res = useMemo(() => {
    const { map, emissiveMap } = getFeltTextures()
    const feltMat = new THREE.MeshStandardMaterial({
      map,
      emissiveMap,
      emissive: new THREE.Color('#ffffff'),
      emissiveIntensity: 0.55,
      roughness: 0.93,
      metalness: 0,
    })
    const frameMat = new THREE.MeshPhysicalMaterial({
      color: '#0a1222',
      roughness: 0.36,
      metalness: 0.55,
      clearcoat: 0.8,
      clearcoatRoughness: 0.18,
    })
    const stripMat = new THREE.MeshBasicMaterial({ color: '#22d3ee', toneMapped: false })
    const accentMat = new THREE.MeshBasicMaterial({ color: '#a855f7', toneMapped: false })
    const consoleTex = getConsoleTexture()
    const consoleTopMat = new THREE.MeshStandardMaterial({
      color: '#05080f',
      emissive: new THREE.Color('#ffffff'),
      emissiveMap: consoleTex,
      emissiveIntensity: 1.1,
      roughness: 0.25,
      metalness: 0.4,
    })
    const holoMat1 = new THREE.MeshBasicMaterial({
      color: '#22d3ee',
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    })
    const holoMat2 = holoMat1.clone()
    holoMat2.color.set('#a855f7')
    holoMat2.opacity = 0.55

    return {
      feltMat,
      frameMat,
      stripMat,
      accentMat,
      consoleTopMat,
      holoMat1,
      holoMat2,
      body: new RoundedBoxGeometry(OUTER, TABLE.bodyHeight, OUTER, 4, 0.16),
      railLong: new RoundedBoxGeometry(OUTER, TABLE.railHeight, TABLE.railWidth, 3, 0.07),
      railShort: new RoundedBoxGeometry(FELT, TABLE.railHeight, TABLE.railWidth, 3, 0.07),
      consoleBody: new RoundedBoxGeometry(TABLE.consoleHalf * 2, 0.12, TABLE.consoleHalf * 2, 3, 0.04),
    }
  }, [])

  const ringA = useRef<THREE.Mesh>(null)
  const ringB = useRef<THREE.Mesh>(null)
  const stripBase = useMemo(() => new THREE.Color('#22d3ee'), [])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    // 装飾ライトとフェルトの回路をゆっくり明滅させる（呼吸するような変化で操作の邪魔をしない）
    const breathe = 0.5 + 0.5 * Math.sin(t * 1.2)
    res.stripMat.color.copy(stripBase).multiplyScalar(0.75 + breathe * 0.55)
    res.feltMat.emissiveIntensity = 0.45 + breathe * 0.2
    if (ringA.current) {
      ringA.current.rotation.z = t * 0.6
      ringA.current.position.y = 0.62 + Math.sin(t * 1.4) * 0.04
    }
    if (ringB.current) {
      ringB.current.rotation.z = -t * 0.4
      ringB.current.position.y = 0.5 + Math.sin(t * 1.4 + 1) * 0.04
    }
  })

  const railOffset = TABLE.feltHalf + TABLE.railWidth / 2
  const stripOffset = TABLE.feltHalf + 0.11
  const stripY = TABLE.railHeight + 0.004

  return (
    <group>
      {/* 本体 */}
      <mesh geometry={res.body} material={res.frameMat} position-y={-TABLE.bodyHeight / 2} receiveShadow castShadow />

      {/* フェルト（天板） */}
      <mesh material={res.feltMat} rotation-x={-Math.PI / 2} position-y={0.001} receiveShadow raycast={noRaycast}>
        <planeGeometry args={[FELT, FELT]} />
      </mesh>

      {/* 外枠（レール）: 手前・奥は長く、左右は短くして角の重なり（Zファイティング）を防ぐ */}
      <mesh geometry={res.railLong} material={res.frameMat} position={[0, TABLE.railHeight / 2, railOffset]} castShadow receiveShadow />
      <mesh geometry={res.railLong} material={res.frameMat} position={[0, TABLE.railHeight / 2, -railOffset]} castShadow receiveShadow />
      <mesh geometry={res.railShort} material={res.frameMat} position={[railOffset, TABLE.railHeight / 2, 0]} rotation-y={Math.PI / 2} castShadow receiveShadow />
      <mesh geometry={res.railShort} material={res.frameMat} position={[-railOffset, TABLE.railHeight / 2, 0]} rotation-y={Math.PI / 2} castShadow receiveShadow />

      {/* 装飾ライト（レール上面の内周） */}
      {[0, 1, 2, 3].map((i) => {
        const angle = (i * Math.PI) / 2
        return (
          <mesh
            key={i}
            material={res.stripMat}
            position={[Math.sin(angle) * stripOffset, stripY, Math.cos(angle) * stripOffset]}
            rotation-y={angle}
            raycast={noRaycast}
          >
            <boxGeometry args={[FELT + 0.14, 0.012, 0.035]} />
          </mesh>
        )
      })}
      {/* 四隅のアクセント */}
      {[
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ].map(([sx, sz]) => (
        <mesh
          key={`${sx}${sz}`}
          material={res.accentMat}
          position={[sx * railOffset, TABLE.railHeight + 0.01, sz * railOffset]}
          rotation-y={Math.PI / 4}
          raycast={noRaycast}
        >
          <boxGeometry args={[0.16, 0.02, 0.16]} />
        </mesh>
      ))}

      {/* 中央コンソール */}
      <mesh geometry={res.consoleBody} material={res.frameMat} position-y={0.06} castShadow receiveShadow />
      <mesh material={res.consoleTopMat} rotation-x={-Math.PI / 2} position-y={0.1215} raycast={noRaycast}>
        <planeGeometry args={[TABLE.consoleHalf * 2 - 0.08, TABLE.consoleHalf * 2 - 0.08]} />
      </mesh>

      {/* ホログラムリング */}
      <mesh ref={ringA} material={res.holoMat1} rotation-x={-Math.PI / 2} position-y={0.62} raycast={noRaycast}>
        <torusGeometry args={[0.46, 0.008, 8, 96]} />
      </mesh>
      <mesh ref={ringB} material={res.holoMat2} rotation-x={-Math.PI / 2} position-y={0.5} raycast={noRaycast}>
        <torusGeometry args={[0.36, 0.006, 8, 6]} />
      </mesh>

      {/* 台座 */}
      <mesh material={res.frameMat} position-y={(FLOOR_Y - TABLE.bodyHeight) / 2} raycast={noRaycast}>
        <cylinderGeometry args={[2.5, 3.3, -FLOOR_Y - TABLE.bodyHeight, 48]} />
      </mesh>
      <mesh material={res.stripMat} position-y={FLOOR_Y + 0.02} rotation-x={-Math.PI / 2} raycast={noRaycast}>
        <ringGeometry args={[3.36, 3.44, 96]} />
      </mesh>

      {/* 床：電脳空間のグリッド */}
      <Grid
        position={[0, FLOOR_Y, 0]}
        args={[60, 60]}
        cellSize={0.6}
        cellThickness={0.6}
        cellColor="#0f2a44"
        sectionSize={3}
        sectionThickness={1.1}
        sectionColor="#1d6fa3"
        fadeDistance={46}
        fadeStrength={1.6}
        infiniteGrid
      />
    </group>
  )
})
