import type { Category, CategoryId } from '../types/mahjong'

/**
 * 9つの技術カテゴリ。配列の順番が理牌（手牌の並び替え）順になる。
 * uiColor: 暗い背景のUI用 / tileColor: 象牙色の牌面用（読みやすい濃さ）
 */
export const CATEGORY_LIST: readonly Category[] = [
  { id: 'language', label: 'プログラミング言語', shortLabel: '言語', colorName: 'ブルー', uiColor: '#60a5fa', tileColor: '#1d4ed8' },
  { id: 'frontend', label: 'Web・フロントエンド', shortLabel: 'Web/FE', colorName: 'シアン', uiColor: '#22d3ee', tileColor: '#0e7490' },
  { id: 'backend', label: 'バックエンド・API', shortLabel: 'BE/API', colorName: 'ティール', uiColor: '#2dd4bf', tileColor: '#0f766e' },
  { id: 'database', label: 'データベース', shortLabel: 'DB', colorName: 'パープル', uiColor: '#c084fc', tileColor: '#7e22ce' },
  { id: 'network', label: 'ネットワーク', shortLabel: 'NET', colorName: 'オレンジ', uiColor: '#fb923c', tileColor: '#c2410c' },
  { id: 'security', label: 'セキュリティ', shortLabel: 'SEC', colorName: 'レッド', uiColor: '#f87171', tileColor: '#b91c1c' },
  { id: 'infra', label: 'OS・インフラ', shortLabel: 'OS/Infra', colorName: 'インディゴ', uiColor: '#818cf8', tileColor: '#4338ca' },
  { id: 'ai', label: 'AI・データ分析', shortLabel: 'AI/Data', colorName: 'ピンク', uiColor: '#f472b6', tileColor: '#be185d' },
  { id: 'devtools', label: '開発手法・ツール', shortLabel: 'DevTool', colorName: 'グレー', uiColor: '#94a3b8', tileColor: '#475569' },
]

export const CATEGORIES: Readonly<Record<CategoryId, Category>> = Object.fromEntries(
  CATEGORY_LIST.map((c) => [c.id, c]),
) as Record<CategoryId, Category>

export const CATEGORY_ORDER: Readonly<Record<CategoryId, number>> = Object.fromEntries(
  CATEGORY_LIST.map((c, i) => [c.id, i]),
) as Record<CategoryId, number>
