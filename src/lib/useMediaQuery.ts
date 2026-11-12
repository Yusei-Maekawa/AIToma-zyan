import { useCallback, useSyncExternalStore } from 'react'

/** スマホを縦向きで持っているとき（横画面へ回転してもらう案内を出す条件） */
export const PORTRAIT_PHONE_QUERY = '(orientation: portrait) and (max-width: 600px) and (pointer: coarse)'

/** CSS メディアクエリの一致状態を購読する（画面の回転・リサイズに追従） */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    [query],
  )
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches)
}
