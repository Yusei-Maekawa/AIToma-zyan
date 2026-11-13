/**
 * ツモ和了の判定。
 * 引数は牌IDの配列と、関係面子の定義だけ。React や three.js には依存しない。
 *
 * アガリ形: 14枚 = 面子4つ + 同じ牌のペア。
 * 面子は「同じ牌3枚」か「定義された異なる3種」。
 * 同じ牌が5枚以上、または14枚でないときは不成立。
 * 分解が複数あるときは、牌IDの昇順で先に見つかった1通りを返す（毎回同じ結果）。
 */

export interface RelationDef {
  id: string
  tiles: readonly [string, string, string]
  reason: string
}

export interface SameMeld {
  kind: 'same'
  tile: string
}

export interface RelationGroup {
  kind: 'relation'
  id: string
  tiles: readonly [string, string, string]
  reason: string
}

export type MeldGroup = SameMeld | RelationGroup

export interface WinDecomposition {
  pair: { kind: 'pair'; tile: string }
  melds: MeldGroup[]
}

const WIN_SIZE = 14
const MELD_COUNT = 4
const MAX_COPIES = 4

interface PartialWin {
  pair: WinDecomposition['pair'] | null
  melds: MeldGroup[]
}

export function isWinningHand(tileIds: readonly string[], relations: readonly RelationDef[]): boolean {
  return findWin(tileIds, relations) !== null
}

export function findWin(tileIds: readonly string[], relations: readonly RelationDef[]): WinDecomposition | null {
  if (tileIds.length !== WIN_SIZE) return null
  const counts = new Map<string, number>()
  for (const id of tileIds) counts.set(id, (counts.get(id) ?? 0) + 1)
  for (const n of counts.values()) if (n > MAX_COPIES) return null

  const order = [...counts.keys()].sort()

  function countOf(id: string): number {
    return counts.get(id) ?? 0
  }
  function add(id: string, delta: number) {
    counts.set(id, countOf(id) + delta)
  }
  function first(): string | null {
    for (const id of order) if (countOf(id) > 0) return id
    return null
  }

  function walk(meldsLeft: number, needPair: boolean): PartialWin | null {
    const head = first()
    if (!head) {
      return meldsLeft === 0 && !needPair ? { pair: null, melds: [] } : null
    }
    if (needPair && countOf(head) >= 2) {
      add(head, -2)
      const rest = walk(meldsLeft, false)
      add(head, 2)
      if (rest) return { pair: { kind: 'pair', tile: head }, melds: rest.melds }
    }
    if (meldsLeft > 0 && countOf(head) >= 3) {
      add(head, -3)
      const rest = walk(meldsLeft - 1, needPair)
      add(head, 3)
      if (rest) return { pair: rest.pair, melds: [{ kind: 'same', tile: head }, ...rest.melds] }
    }
    if (meldsLeft > 0) {
      for (const rel of relations) {
        if (!rel.tiles.includes(head)) continue
        if (rel.tiles.some((id) => countOf(id) < 1)) continue
        for (const id of rel.tiles) add(id, -1)
        const rest = walk(meldsLeft - 1, needPair)
        for (const id of rel.tiles) add(id, 1)
        if (rest) {
          const group: RelationGroup = { kind: 'relation', id: rel.id, tiles: rel.tiles, reason: rel.reason }
          return { pair: rest.pair, melds: [group, ...rest.melds] }
        }
      }
    }
    return null
  }

  const found = walk(MELD_COUNT, true)
  if (!found?.pair || found.melds.length !== MELD_COUNT) return null
  return { pair: found.pair, melds: found.melds }
}
