import type { TileIconId } from '../types/mahjong'

/**
 * 牌面アイコンを Canvas 2D で描画する。
 * 既存の製品ロゴは使わず、技術の「役割」を表す汎用的なモチーフをオリジナルで描く。
 * 画像ファイルを使わないので外部アセットのライセンス問題が起きず、語数が増えても容量が増えない。
 *
 * 各関数は (cx, cy) を中心に、一辺 s の正方形に収まるように描く。
 */
type IconPainter = (ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, color: string) => void

function stroke(ctx: CanvasRenderingContext2D, color: string, width: number) {
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

function arrowHead(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, size: number) {
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x - size * Math.cos(angle - 0.45), y - size * Math.sin(angle - 0.45))
  ctx.lineTo(x - size * Math.cos(angle + 0.45), y - size * Math.sin(angle + 0.45))
  ctx.closePath()
  ctx.fill()
}

/** Python：波括弧 { } の中に、とぐろを巻くS字の線 */
const codeCoil: IconPainter = (ctx, cx, cy, s, color) => {
  const w = s * 0.08
  stroke(ctx, color, w)
  const bh = s * 0.42
  // dir=-1 が左の「{」、dir=+1 が右の「}」。端は内側へ、中央の尖りは外側へ向ける
  for (const dir of [-1, 1]) {
    const stem = cx + dir * s * 0.34
    const end = stem - dir * s * 0.09
    const tip = stem + dir * s * 0.1
    ctx.beginPath()
    ctx.moveTo(end, cy - bh)
    ctx.quadraticCurveTo(stem, cy - bh, stem, cy - bh * 0.6)
    ctx.lineTo(stem, cy - s * 0.1)
    ctx.quadraticCurveTo(stem, cy, tip, cy)
    ctx.quadraticCurveTo(stem, cy, stem, cy + s * 0.1)
    ctx.lineTo(stem, cy + bh * 0.6)
    ctx.quadraticCurveTo(stem, cy + bh, end, cy + bh)
    ctx.stroke()
  }
  // S字のコイル
  ctx.lineWidth = w * 1.15
  ctx.beginPath()
  ctx.moveTo(cx + s * 0.12, cy - s * 0.26)
  ctx.bezierCurveTo(cx - s * 0.2, cy - s * 0.3, cx - s * 0.2, cy - s * 0.02, cx, cy)
  ctx.bezierCurveTo(cx + s * 0.2, cy + s * 0.02, cx + s * 0.2, cy + s * 0.3, cx - s * 0.12, cy + s * 0.26)
  ctx.stroke()
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(cx + s * 0.13, cy - s * 0.26, s * 0.055, 0, Math.PI * 2)
  ctx.fill()
}

/** React：親1つ・子2つのコンポーネントツリー */
const componentTree: IconPainter = (ctx, cx, cy, s, color) => {
  const w = s * 0.07
  stroke(ctx, color, w)
  const bw = s * 0.34
  const bh = s * 0.22
  // 接続線
  ctx.beginPath()
  ctx.moveTo(cx, cy - s * 0.17)
  ctx.lineTo(cx, cy - s * 0.02)
  ctx.moveTo(cx - s * 0.25, cy + s * 0.13)
  ctx.lineTo(cx - s * 0.25, cy - s * 0.02)
  ctx.lineTo(cx + s * 0.25, cy - s * 0.02)
  ctx.lineTo(cx + s * 0.25, cy + s * 0.13)
  ctx.stroke()
  // 親
  ctx.fillStyle = color
  roundRect(ctx, cx - bw / 2, cy - s * 0.42, bw, bh, s * 0.05)
  ctx.fill()
  // 子
  for (const dx of [-0.25, 0.25]) {
    roundRect(ctx, cx + dx * s - bw / 2, cy + s * 0.15, bw, bh, s * 0.05)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(cx + dx * s - bw * 0.25, cy + s * 0.26)
    ctx.lineTo(cx + dx * s + bw * 0.25, cy + s * 0.26)
    ctx.stroke()
  }
}

/** FastAPI：リクエスト→／←レスポンスの往復矢印と、速さを表すスピード線 */
const apiExchange: IconPainter = (ctx, cx, cy, s, color) => {
  const w = s * 0.08
  stroke(ctx, color, w)
  ctx.fillStyle = color
  const x0 = cx - s * 0.36
  const x1 = cx + s * 0.36
  const y0 = cy - s * 0.13
  const y1 = cy + s * 0.13
  ctx.beginPath()
  ctx.moveTo(x0, y0)
  ctx.lineTo(x1 - s * 0.08, y0)
  ctx.moveTo(x1, y1)
  ctx.lineTo(x0 + s * 0.08, y1)
  ctx.stroke()
  arrowHead(ctx, x1 + s * 0.02, y0, 0, s * 0.17)
  arrowHead(ctx, x0 - s * 0.02, y1, Math.PI, s * 0.17)
  // スピード線
  ctx.lineWidth = w * 0.6
  for (const [dy, len] of [
    [-0.36, 0.3],
    [-0.28, 0.18],
    [0.32, 0.22],
  ] as const) {
    ctx.beginPath()
    ctx.moveTo(cx - (len * s) / 2, cy + dy * s)
    ctx.lineTo(cx + (len * s) / 2, cy + dy * s)
    ctx.stroke()
  }
}

/** PostgreSQL：データベースの円柱 */
const database: IconPainter = (ctx, cx, cy, s, color) => {
  const w = s * 0.07
  stroke(ctx, color, w)
  const rx = s * 0.32
  const ry = s * 0.1
  const top = cy - s * 0.32
  const bottom = cy + s * 0.32
  ctx.beginPath()
  ctx.ellipse(cx, top, rx, ry, 0, 0, Math.PI * 2)
  ctx.stroke()
  for (const y of [cy - s * 0.04, bottom]) {
    ctx.beginPath()
    ctx.ellipse(cx, y, rx, ry, 0, 0, Math.PI)
    ctx.stroke()
  }
  ctx.beginPath()
  ctx.moveTo(cx - rx, top)
  ctx.lineTo(cx - rx, bottom)
  ctx.moveTo(cx + rx, top)
  ctx.lineTo(cx + rx, bottom)
  ctx.stroke()
  // データの点
  ctx.fillStyle = color
  for (const [dx, dy] of [
    [-0.14, 0.13],
    [0, 0.17],
    [0.14, 0.13],
  ] as const) {
    ctx.beginPath()
    ctx.arc(cx + dx * s, cy + dy * s, s * 0.035, 0, Math.PI * 2)
    ctx.fill()
  }
}

/** TCP：3ウェイハンドシェイクのシーケンス図（SYN → SYN/ACK → ACK） */
const handshake: IconPainter = (ctx, cx, cy, s, color) => {
  const w = s * 0.07
  stroke(ctx, color, w)
  ctx.fillStyle = color
  const lx = cx - s * 0.34
  const rx = cx + s * 0.34
  ctx.beginPath()
  ctx.moveTo(lx, cy - s * 0.42)
  ctx.lineTo(lx, cy + s * 0.42)
  ctx.moveTo(rx, cy - s * 0.42)
  ctx.lineTo(rx, cy + s * 0.42)
  ctx.stroke()
  const rows = [
    { y0: -0.32, y1: -0.14, toRight: true },
    { y0: -0.06, y1: 0.12, toRight: false },
    { y0: 0.2, y1: 0.38, toRight: true },
  ]
  ctx.lineWidth = w * 0.85
  for (const r of rows) {
    const sx = r.toRight ? lx + s * 0.04 : rx - s * 0.04
    const ex = r.toRight ? rx - s * 0.06 : lx + s * 0.06
    const sy = cy + r.y0 * s
    const ey = cy + r.y1 * s
    ctx.beginPath()
    ctx.moveTo(sx, sy)
    ctx.lineTo(ex, ey)
    ctx.stroke()
    arrowHead(ctx, r.toRight ? ex + s * 0.03 : ex - s * 0.03, ey + s * 0.015, Math.atan2(ey - sy, ex - sx), s * 0.12)
  }
}

/** AES：錠前と、暗号化されたビット列 */
const padlock: IconPainter = (ctx, cx, cy, s, color) => {
  const w = s * 0.08
  stroke(ctx, color, w)
  // シャックル（つる）
  ctx.beginPath()
  ctx.arc(cx, cy - s * 0.12, s * 0.2, Math.PI, 0)
  ctx.lineTo(cx + s * 0.2, cy + s * 0.02)
  ctx.moveTo(cx - s * 0.2, cy - s * 0.12)
  ctx.lineTo(cx - s * 0.2, cy + s * 0.02)
  ctx.stroke()
  // 本体
  ctx.fillStyle = color
  roundRect(ctx, cx - s * 0.33, cy - s * 0.02, s * 0.66, s * 0.46, s * 0.07)
  ctx.fill()
  // 鍵穴
  ctx.fillStyle = '#f4f1e8'
  ctx.beginPath()
  ctx.arc(cx, cy + s * 0.15, s * 0.06, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillRect(cx - s * 0.025, cy + s * 0.17, s * 0.05, s * 0.14)
}

/** Docker：トレーの上に積み上がったコンテナの箱 */
const containers: IconPainter = (ctx, cx, cy, s, color) => {
  const w = s * 0.06
  stroke(ctx, color, w)
  ctx.fillStyle = color
  const box = s * 0.2
  const gap = s * 0.04
  const layout: Array<[number, number, boolean]> = [
    [-1.5, 0, true],
    [-0.5, 0, false],
    [0.5, 0, true],
    [1.5, 0, false],
    [-1, -1, false],
    [0, -1, true],
    [1, -1, false],
    [0, -2, false],
  ]
  const baseY = cy + s * 0.12
  for (const [ix, iy, filled] of layout) {
    const x = cx + ix * (box + gap) - box / 2
    const y = baseY + iy * (box + gap) - box / 2
    roundRect(ctx, x, y, box, box, s * 0.025)
    if (filled) ctx.fill()
    else ctx.stroke()
  }
  // トレー
  ctx.lineWidth = w * 1.3
  ctx.beginPath()
  ctx.moveTo(cx - s * 0.46, baseY + box / 2 + gap * 2.2)
  ctx.lineTo(cx + s * 0.46, baseY + box / 2 + gap * 2.2)
  ctx.stroke()
}

/** LLM：3層のニューラルネットワーク */
const neuralNet: IconPainter = (ctx, cx, cy, s, color) => {
  const layers = [
    [-0.28, 0, 0.28],
    [-0.36, -0.12, 0.12, 0.36],
    [-0.16, 0.16],
  ]
  const xs = [-0.34, 0, 0.34]
  const pts = layers.map((ys, li) => ys.map((y) => [cx + xs[li] * s, cy + y * s] as const))
  stroke(ctx, color, s * 0.025)
  ctx.globalAlpha = 0.55
  for (let li = 0; li < pts.length - 1; li++) {
    for (const a of pts[li]) {
      for (const b of pts[li + 1]) {
        ctx.beginPath()
        ctx.moveTo(a[0], a[1])
        ctx.lineTo(b[0], b[1])
        ctx.stroke()
      }
    }
  }
  ctx.globalAlpha = 1
  ctx.fillStyle = color
  for (const layer of pts) {
    for (const [x, y] of layer) {
      ctx.beginPath()
      ctx.arc(x, y, s * 0.065, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

/** Git：分岐して合流するブランチ */
const branchGraph: IconPainter = (ctx, cx, cy, s, color) => {
  const w = s * 0.075
  stroke(ctx, color, w)
  const mainX = cx - s * 0.16
  const featX = cx + s * 0.2
  // main（左の縦線）から feature が分岐し、並走したあと合流する
  ctx.beginPath()
  ctx.moveTo(mainX, cy - s * 0.44)
  ctx.lineTo(mainX, cy + s * 0.44)
  ctx.moveTo(mainX, cy - s * 0.3)
  ctx.bezierCurveTo(mainX, cy - s * 0.16, featX, cy - s * 0.22, featX, cy - s * 0.1)
  ctx.lineTo(featX, cy + s * 0.1)
  ctx.bezierCurveTo(featX, cy + s * 0.22, mainX, cy + s * 0.16, mainX, cy + s * 0.3)
  ctx.stroke()
  const commits: Array<[number, number, boolean]> = [
    [mainX, cy - s * 0.38, true],
    [mainX, cy, true],
    [featX, cy, false],
    [mainX, cy + s * 0.38, true],
  ]
  for (const [x, y, filled] of commits) {
    ctx.beginPath()
    ctx.arc(x, y, s * 0.075, 0, Math.PI * 2)
    if (filled) {
      ctx.fillStyle = color
      ctx.fill()
    } else {
      ctx.fillStyle = '#f4f1e8'
      ctx.fill()
      ctx.stroke()
    }
  }
}

const PAINTERS: Record<TileIconId, IconPainter> = {
  'code-coil': codeCoil,
  'component-tree': componentTree,
  'api-exchange': apiExchange,
  database,
  handshake,
  padlock,
  containers,
  'neural-net': neuralNet,
  'branch-graph': branchGraph,
}

export function drawTileIcon(
  ctx: CanvasRenderingContext2D,
  id: TileIconId,
  cx: number,
  cy: number,
  size: number,
  color: string,
) {
  ctx.save()
  PAINTERS[id](ctx, cx, cy, size, color)
  ctx.restore()
}
