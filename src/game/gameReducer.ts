import type { GameState, TileInstance } from '../types/mahjong'
import { TERMS, getTerm } from '../data/terms'
import { CATEGORY_ORDER } from '../data/categories'
import { RELATIONS } from '../data/relations'
import { findWin } from '../engine/win'

/**
 * PoC用のゲーム状態管理（useReducer）。
 *
 * 状態遷移（手牌の枚数）:
 *   13枚 ──DRAW──▶ 14枚 ──DISCARD──▶ flying ──LAND──▶ 13枚
 *   14枚がアガリ形なら DRAW の時点で win をセットし、REDEAL 以外を拒否する。
 *
 * 選択（SELECT / SELECT_NEIGHBOR / DESELECT）は13枚・14枚どちらでも可能（解説を見るため）。
 * DISCARD はツモ牌があるとき（14枚）だけ、DRAW はツモ牌がなく牌山が残っているときだけ受け付ける。
 * flying 中は LAND 以外をすべて無視することで、
 * アニメーション中の重複操作をロジック側で確実に防ぐ（UIのボタン無効化は補助）。
 *
 * StrictMode では reducer が2回呼ばれるため、乱数・時刻・外部カウンタは使わない（seed と dealId から決める）。
 */

export const HAND_SIZE = 13
/** 同じ用語の牌は最大4枚（通常の麻雀と同じ） */
const COPIES_PER_TERM = 4
/** 初期状態の牌山を毎回同じ並びにするための seed */
const INITIAL_WALL_SEED = 20260101

export type GameAction =
  | { type: 'SELECT'; uid: string }
  | { type: 'SELECT_NEIGHBOR'; direction: -1 | 1 }
  | { type: 'DESELECT' }
  | { type: 'DRAW' }
  | { type: 'DISCARD' }
  | { type: 'LAND' }
  | { type: 'REDEAL'; seed: number }

/** 手牌とツモ牌を表示順（ツモ牌が右端）に並べたもの */
export function handWithDrawn(state: Pick<GameState, 'hand' | 'drawn'>): TileInstance[] {
  return state.drawn ? [...state.hand, state.drawn] : state.hand
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

/** 各用語4枚ずつの全牌（用語ID） */
function fullSet(): string[] {
  const ids: string[] = []
  for (const t of TERMS) for (let i = 0; i < COPIES_PER_TERM; i++) ids.push(t.id)
  return ids
}

function shuffle<T>(items: T[], seed: number): T[] {
  const rand = mulberry32(seed)
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** uid は dealId と山の中の位置から決める（同じ配牌内で一意・配牌が変われば別の uid） */
function toTiles(termIds: string[], dealId: number): TileInstance[] {
  return termIds.map((termId, i) => ({ uid: `${termId}#${dealId}-${i}`, termId }))
}

interface Deal {
  hand: TileInstance[]
  wall: TileInstance[]
}

/** 初期配牌：9種すべて＋よく使う4種を重複させた13枚（毎回同じ並びで確認しやすい）。残りが牌山 */
export function createInitialDeal(dealId: number): Deal {
  const handIds = [...TERMS.map((t) => t.id), 'python', 'react', 'docker', 'git'].slice(0, HAND_SIZE)
  const rest = fullSet()
  for (const id of handIds) rest.splice(rest.indexOf(id), 1)
  const tiles = toTiles([...handIds, ...shuffle(rest, INITIAL_WALL_SEED)], dealId)
  return { hand: sortHand(tiles.slice(0, HAND_SIZE)), wall: tiles.slice(HAND_SIZE) }
}

/** 配り直し：全牌をシャッフルして先頭13枚を手牌、残りを牌山にする */
export function dealRandom(seed: number, dealId: number): Deal {
  const tiles = toTiles(shuffle(fullSet(), seed), dealId)
  return { hand: sortHand(tiles.slice(0, HAND_SIZE)), wall: tiles.slice(HAND_SIZE) }
}

export function createInitialState(): GameState {
  const dealId = 1
  return { ...createInitialDeal(dealId), drawn: null, selectedUid: null, discards: [], flying: null, dealId, win: null }
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  // アガリ後は配り直しだけ。打牌中は着地だけ。
  if (state.win && action.type !== 'REDEAL') return state
  if (state.flying && action.type !== 'LAND') return state

  switch (action.type) {
    case 'SELECT': {
      if (!handWithDrawn(state).some((t) => t.uid === action.uid)) return state
      // 同じ牌をもう一度押したら解除、別の牌なら切り替え（常に最大1枚）
      return { ...state, selectedUid: state.selectedUid === action.uid ? null : action.uid }
    }
    case 'SELECT_NEIGHBOR': {
      const tiles = handWithDrawn(state)
      if (tiles.length === 0) return state
      const idx = tiles.findIndex((t) => t.uid === state.selectedUid)
      const next =
        idx === -1
          ? action.direction === 1
            ? 0
            : tiles.length - 1
          : (idx + action.direction + tiles.length) % tiles.length
      return { ...state, selectedUid: tiles[next].uid }
    }
    case 'DESELECT':
      return state.selectedUid === null ? state : { ...state, selectedUid: null }
    case 'DRAW': {
      if (state.drawn || state.wall.length === 0) return state
      const [drawn, ...wall] = state.wall
      const win = findWin([...state.hand, drawn].map((t) => t.termId), RELATIONS)
      return { ...state, drawn, wall, win }
    }
    case 'DISCARD': {
      // ツモ前（13枚）は打牌できない
      if (!state.drawn) return state
      const tile = handWithDrawn(state).find((t) => t.uid === state.selectedUid)
      if (!tile) return state
      // ツモ切りなら手牌はそのまま。手出しならツモ牌を手牌に加えて理牌する
      const hand =
        tile.uid === state.drawn.uid
          ? state.hand
          : sortHand([...state.hand.filter((t) => t.uid !== tile.uid), state.drawn])
      return {
        ...state,
        hand,
        drawn: null,
        selectedUid: null,
        flying: { ...tile, slotIndex: state.discards.length },
      }
    }
    case 'LAND': {
      if (!state.flying) return state
      return { ...state, discards: [...state.discards, state.flying], flying: null }
    }
    case 'REDEAL': {
      const dealId = state.dealId + 1
      return {
        ...dealRandom(action.seed, dealId),
        drawn: null,
        selectedUid: null,
        discards: [],
        flying: null,
        dealId,
        win: null,
      }
    }
  }
}
