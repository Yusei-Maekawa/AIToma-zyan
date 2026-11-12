import type { ITTerm } from '../types/mahjong'
import { CATEGORIES } from '../data/categories'
import { drawTileIcon } from './tileIcons'
import { TABLE, DISCARD_COLS, DISCARD_ROWS, DISCARD_START_Z, TILE, DISCARD_GAP_X, DISCARD_GAP_Z } from '../game/layout'

/**
 * Canvas 2D による手続き的テクスチャ生成（three.js に依存しない純粋な描画関数）。
 * 画像ファイルを使わないので、外部アセットの利用条件の問題が起きず、ロード待ちもない。
 */

export const FONT_FAMILY =
  '"Segoe UI", "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", "Yu Gothic UI", Meiryo, system-ui, sans-serif'

export const TILE_IVORY = '#f4f1e8'
const TILE_INK = '#111c2b'

/* ------------------------------------------------------------------ */
/* 牌面                                                                */
/* ------------------------------------------------------------------ */

/** 牌面テクスチャの解像度（牌面の縦横比 ≒ 0.42 : 0.60 に合わせる） */
export const FACE_CANVAS = { width: 448, height: 640 } as const

/** 指定幅に収まる最大のフォントサイズを求める */
function fitFontSize(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  maxWidth: number,
  maxSize: number,
  minSize: number,
  weight: number,
): number {
  for (let size = maxSize; size > minSize; size -= 2) {
    ctx.font = `${weight} ${size}px ${FONT_FAMILY}`
    if (lines.every((l) => ctx.measureText(l).width <= maxWidth)) return size
  }
  return minSize
}

/**
 * 牌面を描画する。
 * レイアウト（上から）: カテゴリ帯 / アイコン / 技術名
 * - カテゴリ表示OFFでも帯の色とアイコンは残す（仕様 4.3）
 * - 技術名は実際の対局サイズでも読めるよう、太字・高コントラストで最大限大きく描く
 */
export function drawTileFace(canvas: HTMLCanvasElement, term: ITTerm, showCategory: boolean) {
  const { width: W, height: H } = FACE_CANVAS
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const cat = CATEGORIES[term.primaryCategory]

  // 地（わずかなグラデーションで象牙の質感）
  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, '#fbf9f3')
  bg.addColorStop(1, '#ece7da')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // 外周の細い枠（カテゴリ色）
  const pad = 16
  ctx.strokeStyle = cat.tileColor
  ctx.globalAlpha = 0.55
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.roundRect(pad, pad, W - pad * 2, H - pad * 2, 26)
  ctx.stroke()
  ctx.globalAlpha = 1

  // カテゴリ帯
  const bandH = 96
  const bandY = pad + 12
  ctx.fillStyle = cat.tileColor
  ctx.beginPath()
  ctx.roundRect(pad + 12, bandY, W - (pad + 12) * 2, bandH, 18)
  ctx.fill()
  // 回路風の装飾ライン（帯の中）
  ctx.strokeStyle = 'rgba(255,255,255,0.28)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(pad + 30, bandY + bandH - 18)
  ctx.lineTo(pad + 70, bandY + bandH - 18)
  ctx.lineTo(pad + 86, bandY + bandH - 34)
  ctx.moveTo(W - pad - 30, bandY + 18)
  ctx.lineTo(W - pad - 70, bandY + 18)
  ctx.lineTo(W - pad - 86, bandY + 34)
  ctx.stroke()
  if (showCategory) {
    const label = cat.shortLabel
    const size = fitFontSize(ctx, [label], W - (pad + 40) * 2, 66, 30, 800)
    ctx.font = `800 ${size}px ${FONT_FAMILY}`
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(label, W / 2, bandY + bandH / 2 + 2)
  } else {
    // ラベル非表示時はドットだけ置いて帯が寂しくならないようにする
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath()
      ctx.arc(W / 2 + i * 26, bandY + bandH / 2, 6, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // アイコン
  const lines = term.tileLines ?? [term.name]
  const iconCenterY = lines.length > 1 ? 262 : 280
  drawTileIcon(ctx, term.icon.id, W / 2, iconCenterY, lines.length > 1 ? 210 : 236, cat.tileColor)

  // 技術名
  const nameMaxW = W - (pad + 28) * 2
  const maxSize = lines.length > 1 ? 104 : 128
  const size = fitFontSize(ctx, lines, nameMaxW, maxSize, 48, 900)
  ctx.font = `900 ${size}px ${FONT_FAMILY}`
  ctx.fillStyle = TILE_INK
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  const lineH = size * 0.98
  const bottom = H - pad - 34
  lines.forEach((line, i) => {
    const y = bottom - (lines.length - 1 - i) * lineH
    ctx.fillText(line, W / 2, y)
  })
}

/* ------------------------------------------------------------------ */
/* 発光（グロー）・パーティクル用の汎用テクスチャ                         */
/* ------------------------------------------------------------------ */

/** 角丸長方形のぼかし光（選択中の牌の後光に使用） */
export function drawRoundedGlow(canvas: HTMLCanvasElement) {
  const W = 256
  const H = 320
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, W, H)
  ctx.filter = 'blur(22px)'
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.roundRect(58, 62, W - 116, H - 124, 22)
  ctx.fill()
  ctx.filter = 'none'
}

/** 中心が明るい丸いドット（パーティクル用） */
export function drawSoftDot(canvas: HTMLCanvasElement) {
  const S = 64
  canvas.width = S
  canvas.height = S
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.35, 'rgba(255,255,255,0.6)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, S, S)
}

/** 放射状のリング（着地の衝撃波） */
export function drawRing(canvas: HTMLCanvasElement) {
  const S = 256
  canvas.width = S
  canvas.height = S
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const g = ctx.createRadialGradient(S / 2, S / 2, S * 0.28, S / 2, S / 2, S / 2)
  g.addColorStop(0, 'rgba(255,255,255,0)')
  g.addColorStop(0.55, 'rgba(255,255,255,0.95)')
  g.addColorStop(0.7, 'rgba(255,255,255,0.35)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, S, S)
}

/** 下が明るく上に向かって消える縦グラデーション（光の柱） */
export function drawVerticalFade(canvas: HTMLCanvasElement) {
  canvas.width = 8
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  // CanvasTexture は flipY=true なので、キャンバス下端が UV の v=0（円柱の下端）になる
  const g = ctx.createLinearGradient(0, 128, 0, 0)
  g.addColorStop(0, 'rgba(255,255,255,0.9)')
  g.addColorStop(0.35, 'rgba(255,255,255,0.35)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 8, 128)
}

/* ------------------------------------------------------------------ */
/* 卓（フェルト）                                                       */
/* ------------------------------------------------------------------ */

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const FELT_CANVAS_SIZE = 1024

/** ワールド座標（フェルト中心原点, X右/Z手前）→ キャンバス座標 */
function feltToCanvas(x: number, z: number): [number, number] {
  const k = FELT_CANVAS_SIZE / (TABLE.feltHalf * 2)
  return [(x + TABLE.feltHalf) * k, (z + TABLE.feltHalf) * k]
}

/** 回路パターンのトレース（配線）を生成する。毎回同じ形になるよう seed 固定 */
function generateCircuitTraces(seed: number) {
  const rand = mulberry32(seed)
  const S = FELT_CANVAS_SIZE
  const step = S / 48
  const traces: Array<Array<[number, number]>> = []
  for (let i = 0; i < 70; i++) {
    let x = Math.round((rand() * S) / step) * step
    let y = Math.round((rand() * S) / step) * step
    const pts: Array<[number, number]> = [[x, y]]
    let dir = Math.floor(rand() * 4) * (Math.PI / 2)
    const segs = 2 + Math.floor(rand() * 4)
    for (let s = 0; s < segs; s++) {
      const len = step * (2 + Math.floor(rand() * 6))
      x += Math.round(Math.cos(dir)) * len
      y += Math.round(Math.sin(dir)) * len
      pts.push([x, y])
      // 45°折れ（基板配線らしさ）
      dir += (rand() < 0.5 ? -1 : 1) * (Math.PI / 4)
      const d = step * (1 + Math.floor(rand() * 2))
      x += Math.round(Math.cos(dir) * d)
      y += Math.round(Math.sin(dir) * d)
      pts.push([x, y])
      dir += (rand() < 0.5 ? -1 : 1) * (Math.PI / 4)
    }
    traces.push(pts)
  }
  return traces
}

/** 4家それぞれの河（捨て牌エリア）の枠を描く */
function strokeDiscardZones(ctx: CanvasRenderingContext2D) {
  const w = DISCARD_COLS * (TILE.width + DISCARD_GAP_X) + 0.08
  const h = DISCARD_ROWS * (TILE.height + DISCARD_GAP_Z) + 0.08
  const z0 = DISCARD_START_Z - 0.04
  const S = FELT_CANVAS_SIZE
  for (let seat = 0; seat < 4; seat++) {
    ctx.save()
    ctx.translate(S / 2, S / 2)
    ctx.rotate((-seat * Math.PI) / 2)
    ctx.translate(-S / 2, -S / 2)
    const [x1, y1] = feltToCanvas(-w / 2, z0)
    const [x2, y2] = feltToCanvas(w / 2, z0 + h)
    ctx.beginPath()
    ctx.roundRect(x1, y1, x2 - x1, y2 - y1, 10)
    ctx.stroke()
    // 角のブラケット
    const b = 18
    ctx.lineWidth *= 1.8
    ctx.beginPath()
    ctx.moveTo(x1, y1 + b)
    ctx.lineTo(x1, y1)
    ctx.lineTo(x1 + b, y1)
    ctx.moveTo(x2 - b, y2)
    ctx.lineTo(x2, y2)
    ctx.lineTo(x2, y2 - b)
    ctx.stroke()
    ctx.restore()
  }
}

/**
 * フェルトの色テクスチャと発光テクスチャを描く。
 * base: 深緑の布地＋うっすらした回路 / emissive: 回路と河の枠だけ（黒地）
 */
export function drawFelt(base: HTMLCanvasElement, emissive: HTMLCanvasElement) {
  const S = FELT_CANVAS_SIZE
  base.width = base.height = S
  emissive.width = emissive.height = S
  const b = base.getContext('2d')
  const e = emissive.getContext('2d')
  if (!b || !e) return

  // --- base ---
  const g = b.createRadialGradient(S / 2, S * 0.55, S * 0.05, S / 2, S / 2, S * 0.72)
  g.addColorStop(0, '#15574a')
  g.addColorStop(0.6, '#0f4136')
  g.addColorStop(1, '#0a2c26')
  b.fillStyle = g
  b.fillRect(0, 0, S, S)
  // 布の細かいノイズ
  const rand = mulberry32(7)
  for (let i = 0; i < 26000; i++) {
    const v = rand()
    b.fillStyle = v < 0.5 ? 'rgba(0,0,0,0.07)' : 'rgba(180,255,220,0.035)'
    b.fillRect(rand() * S, rand() * S, 1.4, 1.4)
  }

  const traces = generateCircuitTraces(2026)
  const drawTraces = (ctx: CanvasRenderingContext2D, color: string, width: number, viaColor: string) => {
    ctx.strokeStyle = color
    ctx.lineWidth = width
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    for (const pts of traces) {
      ctx.beginPath()
      pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)))
      ctx.stroke()
      const [ex, ey] = pts[pts.length - 1]
      ctx.fillStyle = viaColor
      ctx.beginPath()
      ctx.arc(ex, ey, width * 2.2, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  drawTraces(b, 'rgba(120,255,220,0.07)', 2, 'rgba(120,255,220,0.10)')

  // --- emissive ---
  e.fillStyle = '#000000'
  e.fillRect(0, 0, S, S)
  drawTraces(e, 'rgba(34,211,238,0.22)', 1.6, 'rgba(34,211,238,0.45)')
  e.strokeStyle = 'rgba(103,232,249,0.55)'
  e.lineWidth = 2.2
  strokeDiscardZones(e)
  // フェルト外周の内側ライン
  e.strokeStyle = 'rgba(56,189,248,0.35)'
  e.lineWidth = 3
  e.strokeRect(14, 14, S - 28, S - 28)
}

/* ------------------------------------------------------------------ */
/* 中央コンソール                                                        */
/* ------------------------------------------------------------------ */

export function drawConsoleTop(canvas: HTMLCanvasElement) {
  const S = 512
  canvas.width = canvas.height = S
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, S, S)

  // 同心円
  ctx.strokeStyle = 'rgba(34,211,238,0.85)'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.arc(S / 2, S / 2, S * 0.3, 0, Math.PI * 2)
  ctx.stroke()
  ctx.strokeStyle = 'rgba(168,85,247,0.75)'
  ctx.setLineDash([18, 12])
  ctx.beginPath()
  ctx.arc(S / 2, S / 2, S * 0.36, 0, Math.PI * 2)
  ctx.stroke()
  ctx.setLineDash([])

  // ロゴ
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#67e8f9'
  ctx.font = `800 96px ${FONT_FAMILY}`
  ctx.fillText('AITo', S / 2, S / 2 - 10)
  ctx.fillStyle = 'rgba(196,181,253,0.9)'
  ctx.font = `600 30px ${FONT_FAMILY}`
  ctx.fillText('MAHJONG', S / 2, S / 2 + 58)

  // 風（東=自分=手前、南=右、西=対面、北=左）
  ctx.font = `800 54px ${FONT_FAMILY}`
  const winds: Array<[string, number, number, number, string]> = [
    ['東', S / 2, S - 40, 0, '#22d3ee'],
    ['南', S - 40, S / 2, -Math.PI / 2, 'rgba(148,163,184,0.8)'],
    ['西', S / 2, 40, Math.PI, 'rgba(148,163,184,0.8)'],
    ['北', 40, S / 2, Math.PI / 2, 'rgba(148,163,184,0.8)'],
  ]
  for (const [ch, x, y, rot, color] of winds) {
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rot)
    ctx.fillStyle = color
    ctx.fillText(ch, 0, 0)
    ctx.restore()
  }

  // 角のブラケット
  ctx.strokeStyle = 'rgba(34,211,238,0.9)'
  ctx.lineWidth = 6
  const m = 14
  const l = 60
  for (const [x, y, dx, dy] of [
    [m, m, 1, 1],
    [S - m, m, -1, 1],
    [m, S - m, 1, -1],
    [S - m, S - m, -1, -1],
  ] as const) {
    ctx.beginPath()
    ctx.moveTo(x, y + dy * l)
    ctx.lineTo(x, y)
    ctx.lineTo(x + dx * l, y)
    ctx.stroke()
  }
}
