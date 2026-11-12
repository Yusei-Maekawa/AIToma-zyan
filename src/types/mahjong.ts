/**
 * AITo麻雀の型定義。
 *
 * 用語データ（辞書）・牌インスタンス・ゲーム状態を分けて定義する。
 * 用語は将来 200語 → 約1,000語 に増える前提のため、
 * 「用語（Term）」と「卓上の牌（TileInstance）」を別物として扱う。
 */

/** 技術カテゴリID（9分類） */
export type CategoryId =
  | 'language'
  | 'frontend'
  | 'backend'
  | 'database'
  | 'network'
  | 'security'
  | 'infra'
  | 'ai'
  | 'devtools'

export interface Category {
  id: CategoryId
  /** 正式名（解説パネルで使用） */
  label: string
  /** 牌の上部帯に入る短縮名 */
  shortLabel: string
  /** 色名（README・凡例用） */
  colorName: string
  /** 暗い背景のUI上で使う明るめのアクセント色 */
  uiColor: string
  /** 象牙色の牌面に描くための濃いめの色（コントラスト確保） */
  tileColor: string
}

/**
 * 牌面アイコンの種類。
 * 既存ロゴ（商標）を複製せず、技術の役割を表す汎用モチーフをCanvasで描画する。
 */
export type TileIconId =
  | 'code-coil'
  | 'component-tree'
  | 'api-exchange'
  | 'database'
  | 'handshake'
  | 'padlock'
  | 'containers'
  | 'neural-net'
  | 'branch-graph'

export interface TermIcon {
  id: TileIconId
  /** アイコンが何を表しているか（アクセシビリティ・解説用） */
  meaning: string
}

/** IT用語（辞書データ1件） */
export interface ITTerm {
  /** 一意なID（英小文字・ハイフン）。牌・関連付けのキー */
  id: string
  /** 技術名（表示名） */
  name: string
  /** 読み・正式名称など（略語の元の英語を含む） */
  reading: string
  /** 牌面に描く際の改行指定。未指定なら name を1行で自動縮小 */
  tileLines?: string[]
  /** 主分類：牌の色に使用 */
  primaryCategory: CategoryId
  /** 所属カテゴリ（主分類を含む。複数可） */
  categories: CategoryId[]
  /** 初心者向け説明 */
  description: string
  /** 使用例 */
  examples: string[]
  /** 関連技術（表示名。辞書にあれば解説パネルでリンクになる） */
  related: string[]
  /** アイコン情報 */
  icon: TermIcon
}

/** 卓上に存在する牌1枚。同じ用語の牌が複数枚あり得るため uid で区別する */
export interface TileInstance {
  uid: string
  termId: string
}

/** 捨て牌（河）に置かれた牌 */
export interface DiscardedTile extends TileInstance {
  /** 河の何番目のマスか（0始まり） */
  slotIndex: number
}

/** 打牌アニメーション中の牌 */
export interface FlyingTile extends TileInstance {
  slotIndex: number
}

/** ゲーム（PoC）状態 */
export interface GameState {
  hand: TileInstance[]
  selectedUid: string | null
  discards: DiscardedTile[]
  /** null 以外のとき打牌アニメーション中（操作ロック） */
  flying: FlyingTile | null
  /** 配牌のたびに増える。牌の登場アニメーションのキーに使用 */
  dealId: number
}

export type Vec3 = [number, number, number]
