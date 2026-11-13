import { describe, expect, it } from 'vitest'
import type { RelationDef } from './win'
import { findWin, isWinningHand } from './win'
import { RELATIONS } from '../data/relations'

const rel = (id: string, tiles: [string, string, string]): RelationDef => ({
  id,
  tiles,
  reason: id,
})

const R1 = rel('py-api-db', ['python', 'fastapi', 'postgresql'])
const R2 = rel('web-api-db', ['react', 'fastapi', 'postgresql'])
const R3 = rel('py-llm-docker', ['python', 'llm', 'docker'])
const RELS = [R1, R2, R3]

function many(id: string, n: number): string[] {
  return Array.from({ length: n }, () => id)
}

function tilesOf(win: NonNullable<ReturnType<typeof findWin>>): string[] {
  const ids = [win.pair.tile, win.pair.tile]
  for (const meld of win.melds) {
    if (meld.kind === 'same') ids.push(meld.tile, meld.tile, meld.tile)
    else ids.push(...meld.tiles)
  }
  return ids.sort()
}

describe('isWinningHand / findWin', () => {
  it('同じ牌3枚を4組とペアでアガる', () => {
    const hand = [
      ...many('tcp', 3),
      ...many('aes', 3),
      ...many('docker', 3),
      ...many('git', 3),
      ...many('python', 2),
    ]
    expect(isWinningHand(hand, RELS)).toBe(true)
    const win = findWin(hand, RELS)
    expect(win).not.toBeNull()
    expect(tilesOf(win!).sort()).toEqual([...hand].sort())
  })

  it('関係のある3枚を含む手でアガる', () => {
    const hand = [
      ...many('python', 2),
      ...many('fastapi', 2),
      ...many('postgresql', 2),
      ...many('react', 1),
      ...many('docker', 1),
      ...many('llm', 1),
      ...many('aes', 3),
      ...many('tcp', 2),
    ]
    expect(hand).toHaveLength(14)
    const win = findWin(hand, RELS)
    expect(win).not.toBeNull()
    expect(win!.melds.some((m) => m.kind === 'relation')).toBe(true)
    expect(tilesOf(win!).sort()).toEqual([...hand].sort())
  })

  it('各牌ちょうど4枚でもアガる', () => {
    const hand = [...many('python', 4), ...many('fastapi', 4), ...many('postgresql', 4), ...many('git', 2)]
    const win = findWin(hand, RELS)
    expect(win).not.toBeNull()
    expect(tilesOf(win!).sort()).toEqual([...hand].sort())
  })

  it('刻子として先に取ると解けない手も、関係面子に戻ればアガる', () => {
    // fastapi をペアに使うと関係面子が作れない。探索が戻る必要がある。
    const hand = [
      ...many('fastapi', 2),
      ...many('postgresql', 2),
      ...many('python', 1),
      ...many('react', 1),
      ...many('aes', 3),
      ...many('tcp', 3),
      ...many('git', 2),
    ]
    expect(isWinningHand(hand, [])).toBe(false)
    expect(isWinningHand(hand, RELS)).toBe(true)
  })

  it('刻子にも関係面子にもできる手は、どちらの分解でもアガリになる', () => {
    const hand = [
      ...many('python', 3),
      ...many('react', 3),
      ...many('fastapi', 3),
      ...many('postgresql', 3),
      ...many('git', 2),
    ]
    expect(isWinningHand(hand, [])).toBe(true)
    expect(isWinningHand(hand, RELS)).toBe(true)
    const asTriplets = findWin(hand, [])
    const withRelations = findWin(hand, RELS)
    expect(asTriplets).not.toBeNull()
    expect(withRelations).not.toBeNull()
    expect(tilesOf(asTriplets!).sort()).toEqual([...hand].sort())
    expect(tilesOf(withRelations!).sort()).toEqual([...hand].sort())
  })

  it('ペアだけではアガらない', () => {
    const hand = [
      ...many('python', 2),
      ...many('react', 2),
      ...many('fastapi', 2),
      ...many('postgresql', 2),
      ...many('tcp', 2),
      ...many('aes', 2),
      ...many('docker', 2),
    ]
    expect(isWinningHand(hand, RELS)).toBe(false)
  })

  it('面子が足りなければアガらない', () => {
    const hand = [...many('tcp', 3), ...many('python', 2), ...many('react', 1), ...many('aes', 1), ...many('git', 1), ...many('docker', 1), ...many('llm', 1), ...many('fastapi', 1), ...many('postgresql', 1), ...many('tcp', 1), 'react']
    expect(hand).toHaveLength(14)
    expect(hand.filter((id) => id === 'tcp')).toHaveLength(4)
    expect(isWinningHand(hand, RELS)).toBe(false)
  })

  it('同じ牌が5枚以上なら不成立', () => {
    const hand = [...many('python', 5), ...many('fastapi', 3), ...many('postgresql', 3), ...many('git', 3)]
    expect(hand).toHaveLength(14)
    expect(isWinningHand(hand, RELS)).toBe(false)
  })

  it('14枚でないときは不成立', () => {
    expect(isWinningHand(many('python', 13), RELS)).toBe(false)
    expect(isWinningHand(many('python', 15), RELS)).toBe(false)
  })

  it('同じ入力なら分解は毎回同じ', () => {
    const hand = [
      ...many('python', 3),
      ...many('react', 3),
      ...many('fastapi', 3),
      ...many('postgresql', 3),
      ...many('git', 2),
    ]
    expect(findWin(hand, RELS)).toEqual(findWin([...hand].reverse(), RELS))
  })

  it('配布データでも関係面子のアガリが成立する', () => {
    const hand = [
      ...many('python', 2),
      ...many('fastapi', 2),
      ...many('postgresql', 2),
      ...many('react', 1),
      ...many('docker', 1),
      ...many('llm', 1),
      ...many('aes', 3),
      ...many('tcp', 2),
    ]
    const win = findWin(hand, RELATIONS)
    expect(win).not.toBeNull()
    expect(win!.melds.filter((m) => m.kind === 'relation').every((m) => m.kind === 'relation' && m.reason.length > 0)).toBe(true)
  })
})
