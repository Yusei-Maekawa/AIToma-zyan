import type { GameState, TileInstance } from '../types/mahjong'
import { TERMS, getTerm } from '../data/terms'
import { CATEGORY_ORDER } from '../data/categories'

/**
 * PoC用のゲーム状態管理（useReducer）。
 *
 * 状態遷移:
 *   idle ──SELECT──▶ selected ──DISCARD──▶ flying ──LAND──▶ idle
 *                       ▲   │
 *                       └───┘ SELECT（同じ牌で解除 / 別の牌で切替）
 *
 * flying 中は SELECT / DISCARD / REDEAL をすべて無視することで、
 * アニメーション中の重複操作をロジック側で確実に防ぐ（UIのボタン無効化は補助）。
 */

export const HAND_SIZE = 13
/** 同じ用語の牌は最大4枚（通常の麻雀と同じ） */
const COPIES_PER_TERM = 4

export type GameAction =
  | { type: 'SELECT'; uid: string }
  | { type: 'SELECT_NEIGHBOR'; direction: -1 | 1 }
  | { type: 'DESELECT' }
  | { type: 'DISCARD' }
  | { type: 'LAND' }
  | { type: 'REDEAL'; seed?: number }

let uidCounter = 0
function nextUid(termId: string): string {
  uidCounter += 1
  return `${termId}#${uidCounter}`
}

/** 理牌：主分類の順 → 用語ID の順に並べる */
export function sortHand(hand: TileInstance[]): TileInstance[] {
  return [...hand].sort((a, b) => {
    const ta = getTerm(a.termId)
    const tb = getTerm(b.termId)
    const c = CATEGORY_ORDER[ta.primaryCategory] - CATEGORY_ORDER[tb.primaryCategory]
    return c !== 0 ? c : ta.id.localeCompare(tb.id)
  })
}

/** 再現可能な乱数（テスト・デバッグ用に seed を指定できる） */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 初期手牌：9種すべて＋よく使う4種を重複させた13枚（毎回同じ並びで確認しやすい） */
export function createInitialHand(): TileInstance[] {
  const ids = [...TERMS.map((t) => t.id), 'python', 'react', 'docker', 'git']
  return sortHand(ids.slice(0, HAND_SIZE).map((termId) => ({ uid: nextUid(termId), termId })))
}

/** 配り直し：各用語4枚ずつの山をシャッフルして13枚を引く */
export function dealRandomHand(seed: number = Date.now()): TileInstance[] {
  const rand = mulberry32(seed)
  const wall: string[] = []
  for (const t of TERMS) for (let i = 0; i < COPIES_PER_TERM; i++) wall.push(t.id)
  for (let i = wall.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[wall[i], wall[j]] = [wall[j], wall[i]]
  }
  return sortHand(wall.slice(0, HAND_SIZE).map((termId) => ({ uid: nextUid(termId), termId })))
}

export function createInitialState(): GameState {
  return { hand: createInitialHand(), selectedUid: null, discards: [], flying: null, dealId: 1 }
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  // 打牌アニメーション中は LAND 以外の操作を受け付けない
  if (state.flying && action.type !== 'LAND') return state

  switch (action.type) {
    case 'SELECT': {
      if (!state.hand.some((t) => t.uid === action.uid)) return state
      // 同じ牌をもう一度押したら解除、別の牌なら切り替え（常に最大1枚）
      return { ...state, selectedUid: state.selectedUid === action.uid ? null : action.uid }
    }
    case 'SELECT_NEIGHBOR': {
      if (state.hand.length === 0) return state
      const idx = state.hand.findIndex((t) => t.uid === state.selectedUid)
      const next =
        idx === -1
          ? action.direction === 1
            ? 0
            : state.hand.length - 1
          : (idx + action.direction + state.hand.length) % state.hand.length
      return { ...state, selectedUid: state.hand[next].uid }
    }
    case 'DESELECT':
      return state.selectedUid === null ? state : { ...state, selectedUid: null }
    case 'DISCARD': {
      const tile = state.hand.find((t) => t.uid === state.selectedUid)
      if (!tile) return state
      return {
        ...state,
        hand: state.hand.filter((t) => t.uid !== tile.uid),
        selectedUid: null,
        flying: { ...tile, slotIndex: state.discards.length },
      }
    }
    case 'LAND': {
      if (!state.flying) return state
      return { ...state, discards: [...state.discards, state.flying], flying: null }
    }
    case 'REDEAL':
      return {
        hand: dealRandomHand(action.seed),
        selectedUid: null,
        discards: [],
        flying: null,
        dealId: state.dealId + 1,
      }
  }
}
