/**
 * 効果音（Web Audio API による合成音）。
 * 音声ファイルを使わないため、外部アセットの利用条件を気にせず差し替え・調整ができる。
 *
 * ブラウザの自動再生制限により、AudioContext はユーザー操作（クリック等）の中で
 * 作成・再開する必要がある。unlock() をクリック時に呼んでおく。
 */
let ctx: AudioContext | null = null
let enabled = true

export function setSoundEnabled(value: boolean) {
  enabled = value
}

export function unlockAudio() {
  if (!enabled) return
  try {
    if (!ctx) ctx = new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
  } catch {
    ctx = null // 非対応環境では無音で続行
  }
}

function ready(): AudioContext | null {
  if (!enabled || !ctx || ctx.state !== 'running') return null
  return ctx
}

let noiseBuffer: AudioBuffer | null = null
function getNoise(ac: AudioContext): AudioBuffer {
  if (!noiseBuffer || noiseBuffer.sampleRate !== ac.sampleRate) {
    const len = Math.floor(ac.sampleRate * 0.1)
    noiseBuffer = ac.createBuffer(1, len, ac.sampleRate)
    const data = noiseBuffer.getChannelData(0)
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len)
  }
  return noiseBuffer
}

/** 牌を選んだときの軽い電子音 */
export function playSelect() {
  const ac = ready()
  if (!ac) return
  const t = ac.currentTime
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(1320, t)
  osc.frequency.exponentialRampToValueAtTime(1760, t + 0.05)
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(0.06, t + 0.008)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09)
  osc.connect(gain).connect(ac.destination)
  osc.start(t)
  osc.stop(t + 0.1)
}

/** 打牌の着地音：牌が卓に当たる「カチッ」＋デジタルな余韻 */
export function playDiscard() {
  const ac = ready()
  if (!ac) return
  const t = ac.currentTime

  // 硬い物が当たる音（バンドパスしたノイズ）
  const noise = ac.createBufferSource()
  noise.buffer = getNoise(ac)
  const bp = ac.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = 2600
  bp.Q.value = 1.4
  const ng = ac.createGain()
  ng.gain.setValueAtTime(0.32, t)
  ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.07)
  noise.connect(bp).connect(ng).connect(ac.destination)
  noise.start(t)

  // 胴鳴り
  const body = ac.createOscillator()
  const bg = ac.createGain()
  body.type = 'sine'
  body.frequency.setValueAtTime(900, t)
  body.frequency.exponentialRampToValueAtTime(420, t + 0.12)
  bg.gain.setValueAtTime(0.12, t)
  bg.gain.exponentialRampToValueAtTime(0.0001, t + 0.14)
  body.connect(bg).connect(ac.destination)
  body.start(t)
  body.stop(t + 0.15)

  // サイバーな余韻
  const blip = ac.createOscillator()
  const blg = ac.createGain()
  blip.type = 'sine'
  blip.frequency.setValueAtTime(1760, t + 0.03)
  blip.frequency.exponentialRampToValueAtTime(2640, t + 0.2)
  blg.gain.setValueAtTime(0.0001, t + 0.03)
  blg.gain.exponentialRampToValueAtTime(0.035, t + 0.05)
  blg.gain.exponentialRampToValueAtTime(0.0001, t + 0.3)
  blip.connect(blg).connect(ac.destination)
  blip.start(t + 0.03)
  blip.stop(t + 0.32)
}
