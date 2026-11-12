import * as THREE from 'three'
import { getTerm } from '../data/terms'
import {
  drawConsoleTop,
  drawFelt,
  drawRing,
  drawRoundedGlow,
  drawSoftDot,
  drawTileFace,
  drawVerticalFade,
} from './canvasArt'

/**
 * Canvas 描画結果を three.js のテクスチャに変換し、キャッシュする。
 *
 * GPU負荷対策:
 * - 牌面テクスチャは「用語 × カテゴリ表示ON/OFF」ごとに1枚だけ作り、同じ用語の牌で共有する。
 *   9語なら最大18枚。1,000語になっても卓上に出ている用語分しか作られない。
 * - マテリアルも同じキーで共有し、牌ごとに new しない。
 */

function makeCanvas(): HTMLCanvasElement {
  return document.createElement('canvas')
}

function toTexture(canvas: HTMLCanvasElement, srgb = true): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas)
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace
  tex.generateMipmaps = true
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.magFilter = THREE.LinearFilter
  tex.needsUpdate = true
  return tex
}

/* ---------------- 牌面 ---------------- */

const faceMaterialCache = new Map<string, THREE.MeshStandardMaterial>()
let maxAnisotropy = 8

/** レンダラーの対応値に合わせて異方性フィルタリングを設定（斜めから見た文字のにじみを抑える） */
export function setMaxAnisotropy(value: number) {
  maxAnisotropy = Math.max(1, Math.min(16, value))
}

export function getFaceMaterial(termId: string, showCategory: boolean): THREE.MeshStandardMaterial {
  const key = `${termId}|${showCategory ? 1 : 0}`
  let mat = faceMaterialCache.get(key)
  if (!mat) {
    const canvas = makeCanvas()
    drawTileFace(canvas, getTerm(termId), showCategory)
    const map = toTexture(canvas)
    map.anisotropy = maxAnisotropy
    mat = new THREE.MeshStandardMaterial({
      map,
      roughness: 0.42,
      metalness: 0,
      // 牌面のプレーンは本体のすぐ手前に置くので、Zファイティング対策に少し手前へ寄せる
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    })
    faceMaterialCache.set(key, mat)
  }
  return mat
}

/* ---------------- 汎用の発光テクスチャ ---------------- */

let glowTexture: THREE.CanvasTexture | null = null
export function getGlowTexture(): THREE.CanvasTexture {
  if (!glowTexture) {
    const c = makeCanvas()
    drawRoundedGlow(c)
    glowTexture = toTexture(c)
  }
  return glowTexture
}

let dotTexture: THREE.CanvasTexture | null = null
export function getDotTexture(): THREE.CanvasTexture {
  if (!dotTexture) {
    const c = makeCanvas()
    drawSoftDot(c)
    dotTexture = toTexture(c)
  }
  return dotTexture
}

let ringTexture: THREE.CanvasTexture | null = null
export function getRingTexture(): THREE.CanvasTexture {
  if (!ringTexture) {
    const c = makeCanvas()
    drawRing(c)
    ringTexture = toTexture(c)
  }
  return ringTexture
}

let fadeTexture: THREE.CanvasTexture | null = null
export function getVerticalFadeTexture(): THREE.CanvasTexture {
  if (!fadeTexture) {
    const c = makeCanvas()
    drawVerticalFade(c)
    fadeTexture = toTexture(c)
  }
  return fadeTexture
}

/* ---------------- 卓 ---------------- */

let feltTextures: { map: THREE.CanvasTexture; emissiveMap: THREE.CanvasTexture } | null = null
export function getFeltTextures() {
  if (!feltTextures) {
    const base = makeCanvas()
    const emissive = makeCanvas()
    drawFelt(base, emissive)
    const map = toTexture(base)
    const emissiveMap = toTexture(emissive)
    map.anisotropy = maxAnisotropy
    emissiveMap.anisotropy = maxAnisotropy
    feltTextures = { map, emissiveMap }
  }
  return feltTextures
}

let consoleTexture: THREE.CanvasTexture | null = null
export function getConsoleTexture(): THREE.CanvasTexture {
  if (!consoleTexture) {
    const c = makeCanvas()
    drawConsoleTop(c)
    consoleTexture = toTexture(c)
    consoleTexture.anisotropy = maxAnisotropy
  }
  return consoleTexture
}
