import type { Vec3 } from '../types/mahjong'

/**
 * 卓上レイアウト定数と座標計算。
 * 単位はおおよそ「1 = 5cm」程度のスケール感（牌 26×35×19mm を約2倍して見やすくしている）。
 * 3D表示側（scene）と状態管理（game）の両方から参照する純粋関数のみを置く。
 */

/** 牌の寸法（ローカル: 幅=X, 高さ=Y, 厚み=Z。牌面は +Z を向く） */
export const TILE = {
  width: 0.52,
  height: 0.7,
  depth: 0.38,
  radius: 0.05,
} as const

/** 卓 */
export const TABLE = {
  /** フェルト（天板）の半径（正方形の半辺） */
  feltHalf: 5.1,
  /** 外枠の幅 */
  railWidth: 0.6,
  /** 外枠の高さ（天板からの立ち上がり） */
  railHeight: 0.2,
  /** 天板の厚み（外枠本体の高さ） */
  bodyHeight: 0.55,
  /** 中央コンソールの半辺 */
  consoleHalf: 0.62,
} as const

/* ---------------- 手牌 ---------------- */

/** 手牌は読みやすさ優先で卓上の牌より少し大きく表示する（実際の対局ゲームでも一般的な手法） */
export const HAND_SCALE = 1.2
/** 牌同士の隙間（スケール前） */
export const HAND_GAP = 0.035
/** 手牌の奥行き位置（プレイヤー側の卓端寄り） */
export const HAND_Z = 4.35
/** 手牌の傾き。上端を奥へ倒して牌面をカメラへ向ける（rad） */
export const HAND_TILT = -0.62
/** 選択時に持ち上げる高さ */
export const HAND_LIFT = 0.3
/** マウスホバー時のわずかな持ち上げ */
export const HAND_HOVER_LIFT = 0.07
/** ツモ牌（14枚目）を離して置く距離（将来用） */
export const HAND_DRAW_GAP = 0.28

/** 傾けた牌の中心が卓面からどれだけ上にあれば接地するか */
function tiltedRestHeight(scale: number, tilt: number): number {
  const a = Math.abs(tilt)
  return ((TILE.height / 2) * Math.cos(a) + (TILE.depth / 2) * Math.sin(a)) * scale
}

export const HAND_Y = tiltedRestHeight(HAND_SCALE, HAND_TILT)
export const HAND_SPACING = (TILE.width + HAND_GAP) * HAND_SCALE

/**
 * 手牌 i 枚目の X 座標。
 * @param withDrawnTile true のとき最後の1枚をツモ牌として少し離す（14枚表示を想定した拡張点）
 */
export function handSlotX(index: number, count: number, withDrawnTile = false): number {
  const gap = withDrawnTile ? HAND_DRAW_GAP : 0
  const totalWidth = (count - 1) * HAND_SPACING + gap
  const start = -totalWidth / 2
  const extra = withDrawnTile && index === count - 1 ? gap : 0
  return start + index * HAND_SPACING + extra
}

export const HAND_ROTATION: Vec3 = [HAND_TILT, 0, 0]

/* ---------------- 捨て牌（河） ---------------- */

export const DISCARD_COLS = 6
export const DISCARD_GAP_X = 0.02
export const DISCARD_GAP_Z = 0.03
/** 1段目の Z 位置（中央コンソールのすぐ手前） */
export const DISCARD_START_Z = 1.15

/** 河の slotIndex 番目のマスの位置（牌は面を上にして寝かせる） */
export function discardSlotPosition(slotIndex: number): Vec3 {
  const col = slotIndex % DISCARD_COLS
  const row = Math.floor(slotIndex / DISCARD_COLS)
  const pitchX = TILE.width + DISCARD_GAP_X
  const pitchZ = TILE.height + DISCARD_GAP_Z
  const x = (col - (DISCARD_COLS - 1) / 2) * pitchX
  const z = DISCARD_START_Z + TILE.height / 2 + row * pitchZ
  return [x, TILE.depth / 2, z]
}

/** 寝かせた牌の回転（上端が奥＝自分から読める向き） */
export const DISCARD_ROTATION: Vec3 = [-Math.PI / 2, 0, 0]

/* ---------------- 他家（装飾） ---------------- */

export const OPPONENT_HAND_DISTANCE = 4.25
export const OPPONENT_SPACING = TILE.width + 0.03

/* ---------------- カメラ ---------------- */

export interface CameraPreset {
  target: Vec3
  position: Vec3
  fov: number
}

/** PC・タブレット向け：卓全体を見渡す構図 */
export const CAMERA_DEFAULT: CameraPreset = { target: [0, 0, 1.0], position: [0, 10.4, 10.6], fov: 40 }

/**
 * スマホ横画面向け：手牌に寄った構図。
 * 画角を広げてカメラを手牌に近づけることで、遠近感により「手前の手牌は大きく、奥の卓は小さく」映す。
 * 844×390 で手牌が画面幅の約88%（1枚≈57px）、奥のレールまで画面内に収まるよう計算で決めた値。
 */
export const CAMERA_COMPACT: CameraPreset = { target: [0, 0, 1.75], position: [0, 4.6, 6.2], fov: 56 }
/** スマホ横画面構図の基準アスペクト比（これより縦長ならカメラを引く） */
export const CAMERA_COMPACT_BASE_ASPECT = 2.16
/** この高さ（CSS px）以下の横長画面をスマホ横画面とみなす */
export const COMPACT_MAX_HEIGHT = 500

export const CAMERA_INTRO_POSITION: Vec3 = [0, 19, 15]
export const CAMERA_FOV = CAMERA_DEFAULT.fov
