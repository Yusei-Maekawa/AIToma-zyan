import { describe, expect, it } from 'vitest'
import { gameReducer, type GameAction } from './gameReducer'
import type { GameState, TileInstance } from '../types/mahjong'

function tiles(ids: string[], prefix: string): TileInstance[] {
  return ids.map((termId, i) => ({ uid: `${prefix}-${termId}-${i}`, termId }))
}

function state(partial: Pick<GameState, 'hand' | 'wall'> & Partial<GameState>): GameState {
  return {
    drawn: null,
    selectedUid: null,
    discards: [],
    flying: null,
    dealId: 1,
    win: null,
    ...partial,
  }
}

/** 関係面子2組 + 刻子 + ペア、から FastAPI を1枚抜いた13枚 */
const ALMOST = [
  ...Array.from({ length: 2 }, () => 'python'),
  'fastapi',
  ...Array.from({ length: 2 }, () => 'postgresql'),
  'react',
  'docker',
  'llm',
  ...Array.from({ length: 3 }, () => 'aes'),
  ...Array.from({ length: 2 }, () => 'tcp'),
]

describe('ツモ和了の状態遷移', () => {
  it('14枚がアガリ形なら win をセットし、ツモ・選択・打牌を拒否する', () => {
    const before = state({
      hand: tiles(ALMOST, 'h'),
      wall: tiles(['fastapi', 'git'], 'w'),
    })
    const won = gameReducer(before, { type: 'DRAW' })
    expect(won.win).not.toBeNull()
    expect(won.drawn?.termId).toBe('fastapi')
    expect(won.wall).toHaveLength(1)

    const select: GameAction = { type: 'SELECT', uid: won.hand[0].uid }
    expect(gameReducer(won, select)).toBe(won)
    expect(gameReducer(won, { type: 'DISCARD' })).toBe(won)
    expect(gameReducer(won, { type: 'DRAW' })).toBe(won)

    const again = gameReducer(won, { type: 'REDEAL', seed: 1 })
    expect(again.win).toBeNull()
    expect(again.hand).toHaveLength(13)
    expect(again.drawn).toBeNull()
  })

  it('アガリ形でなければ win は null のまま打牌できる', () => {
    const before = state({
      hand: tiles(ALMOST, 'h'),
      wall: tiles(['git', 'git'], 'w'),
      selectedUid: null,
    })
    const drawn = gameReducer(before, { type: 'DRAW' })
    expect(drawn.win).toBeNull()
    expect(drawn.drawn?.termId).toBe('git')
  })
})
