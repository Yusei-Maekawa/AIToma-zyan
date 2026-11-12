/**
 * 描画品質プリセット。
 * 値はここだけに置き、シーン側は受け取った設定を表示に反映する。
 *
 * 自動では下げのみ（上げると負荷が戻ってまた下がり、表示がちらつくため）。
 * 上げるのは手動の切替だけ。
 */

export type QualityLevel = 'high' | 'medium' | 'low'

export interface QualitySettings {
  /** devicePixelRatio の上限。Canvas の dpr={[1, dprMax]} に渡す */
  dprMax: number
  shadows: boolean
  /** 影を使うときのシャドウマップの一辺（px）。影オフのときは使わない */
  shadowMapSize: number
  /** 0 なら卓上の粒子を出さない */
  sparkles: number
  /**
   * アンチエイリアス。WebGL コンテキスト生成時にしか効かない。
   * 起動後の切替では変えず、Canvas を作り直さない。
   */
  antialias: boolean
  environment: boolean
  environmentResolution: number
  /** 色付きポイントライトの本数（0〜2） */
  pointLights: 0 | 1 | 2
}

export const QUALITY_PRESETS: Record<QualityLevel, QualitySettings> = {
  high: {
    dprMax: 2,
    shadows: true,
    shadowMapSize: 2048,
    sparkles: 60,
    antialias: true,
    environment: true,
    environmentResolution: 256,
    pointLights: 2,
  },
  medium: {
    dprMax: 1.5,
    shadows: true,
    shadowMapSize: 1024,
    sparkles: 30,
    antialias: true,
    environment: true,
    environmentResolution: 128,
    pointLights: 2,
  },
  low: {
    dprMax: 1,
    shadows: false,
    shadowMapSize: 512,
    sparkles: 0,
    antialias: false,
    environment: false,
    environmentResolution: 128,
    pointLights: 1,
  },
}

const ORDER: QualityLevel[] = ['high', 'medium', 'low']

/** 1段下げる。すでに low なら null */
export function lowerQuality(level: QualityLevel): QualityLevel | null {
  const i = ORDER.indexOf(level)
  return i >= 0 && i < ORDER.length - 1 ? ORDER[i + 1] : null
}

/**
 * 起動時の初期値。
 * - deviceMemory が 4GB 以下 → low（Chromium のみ。無ければ無視）
 * - 粗いポインタ、またはタッチ点がある → medium
 * - それ以外 → high
 */
export function initialQuality(): QualityLevel {
  if (typeof navigator !== 'undefined') {
    const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
    if (typeof mem === 'number' && mem <= 4) return 'low'
  }
  const coarse = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
  const touch = typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0
  if (coarse || touch) return 'medium'
  return 'high'
}

/** 移動平均に使う直近フレーム数 */
export const QUALITY_FPS_WINDOW = 120
/** この FPS を下回り続けたら 1 段下げる */
export const QUALITY_FPS_FLOOR = 40
/** 下回りが続いてから下げるまでの秒数 */
export const QUALITY_FPS_LOW_SECONDS = 2
