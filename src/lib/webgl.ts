/**
 * WebGL 2 が使えるかを事前に判定する。
 * three.js は r163 で WebGL 1 のサポートを終了しているため、WebGL 2 を必須とする。
 */
export function detectWebGL2(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!canvas.getContext('webgl2')
  } catch {
    // getContext 自体が例外を投げる環境もある
    return false
  }
}
