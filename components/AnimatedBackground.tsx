'use client'

import { useEffect, useRef } from 'react'

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface Folder {
  x: number
  y: number
  vx: number
  vy: number
  rotation: number
  rotSpeed: number
  size: number
  opacity: number
  timer: number
  interval: number
}

interface SigPt { x: number; y: number }

interface Paper {
  x: number
  y: number
  vx: number
  vy: number
  rotation: number
  rotSpeed: number
  width: number
  height: number
  baseOpacity: number
  age: number
  maxAge: number
  sig: SigPt[]
  sigProgress: number
  sigSpeed: number
  sigDone: boolean
  noteColor: string
  doodleType: number
  doodleParams: number[]
  tapeAngle: number
}

interface FreePencil {
  x: number
  y: number
  vx: number
  vy: number
  rotation: number
  rotSpeed: number
  scale: number
  opacity: number
  age: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const NOTE_COLORS = [
  '#f5e6a3',
  '#f0d878',
  '#e8d88e',
  '#f2e4a0',
  '#ebd898',
]

// ─── Factory helpers ──────────────────────────────────────────────────────────

function makeFolder(canvasW: number, canvasH: number): Folder {
  return {
    x: Math.random() * canvasW,
    y: Math.random() * canvasH,
    vx: (Math.random() - 0.5) * 0.45,
    vy: (Math.random() - 0.5) * 0.3,
    rotation: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.004,
    size: 38 + Math.random() * 38,
    opacity: 0.18 + Math.random() * 0.14,
    timer: Math.floor(Math.random() * 180),
    interval: 130 + Math.floor(Math.random() * 200),
  }
}

function makeSig(w: number, h: number): SigPt[] {
  const midY   = (Math.random() * 0.10 - 0.02) * h
  const amp    = (0.05 + Math.random() * 0.06) * h
  const freq1  = 3.5 + Math.random() * 3.0
  const freq2  = 1.2 + Math.random() * 1.2
  const phase1 = Math.random() * Math.PI * 2
  const phase2 = Math.random() * Math.PI * 2

  const pts: SigPt[] = []
  const left  = -w * 0.36
  const right =  w * 0.36
  const N = 60

  for (let i = 0; i <= N; i++) {
    const t = i / N
    pts.push({
      x: left + (right - left) * t,
      y: midY
        + Math.sin(t * Math.PI * freq1 + phase1) * amp * 0.7
        + Math.sin(t * Math.PI * freq2 + phase2) * amp * 0.3,
    })
  }
  return pts
}

function makePaper(folder: Folder): Paper {
  const w = folder.size * 0.55
  const h = w * 1.15
  return {
    x: folder.x + (Math.random() - 0.5) * folder.size * 0.18,
    y: folder.y - folder.size * 0.12,
    vx: (Math.random() - 0.5) * 0.55,
    vy: -0.9 - Math.random() * 0.55,
    rotation: (Math.random() - 0.5) * 0.3,
    rotSpeed: (Math.random() - 0.5) * 0.006,
    width: w,
    height: h,
    baseOpacity: 0.75 + Math.random() * 0.20,
    age: 0,
    maxAge: 900,
    sig: makeSig(w, h),
    sigProgress: 0,
    sigSpeed: 0.010 + Math.random() * 0.010,
    sigDone: false,
    noteColor: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)],
    doodleType: Math.floor(Math.random() * 5),
    doodleParams: Array.from({ length: 12 }, () => Math.random()),
    tapeAngle: (Math.random() - 0.5) * 0.5,
  }
}

function spawnFreePencil(p: Paper): FreePencil {
  const last = p.sig[p.sig.length - 1]
  const prev = p.sig[p.sig.length - 2]
  const cos = Math.cos(p.rotation)
  const sin = Math.sin(p.rotation)
  const wx = p.x + cos * last.x - sin * last.y
  const wy = p.y + sin * last.x + cos * last.y

  const localDir = Math.atan2(last.y - prev.y, last.x - prev.x)
  const worldDir = localDir + p.rotation - Math.PI * 0.18

  return {
    x: wx,
    y: wy,
    vx: Math.cos(localDir + p.rotation) * (2.5 + Math.random() * 2) + p.vx,
    vy: -1.8 - Math.random() * 1.8 + p.vy * 0.4,
    rotation: worldDir,
    rotSpeed: (Math.random() > 0.5 ? 1 : -1) * (0.07 + Math.random() * 0.09),
    scale: p.width / 55,
    opacity: 0.92,
    age: 0,
  }
}

// ─── Drawing functions ────────────────────────────────────────────────────────

function drawFolder(ctx: CanvasRenderingContext2D, f: Folder) {
  ctx.save()
  ctx.translate(f.x, f.y)
  ctx.rotate(f.rotation)
  ctx.globalAlpha = f.opacity

  const w    = f.size
  const h    = f.size * 0.78
  const tabW = w * 0.38
  const tabH = h * 0.17

  ctx.fillStyle = '#c8920f'
  ctx.beginPath()
  ctx.moveTo(-w / 2, -h / 2)
  ctx.lineTo(-w / 2 + tabW, -h / 2)
  ctx.lineTo(-w / 2 + tabW + tabH * 0.4, -h / 2 - tabH)
  ctx.lineTo(-w / 2, -h / 2 - tabH)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = '#d4a017'
  ctx.strokeStyle = '#b8860b'
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.roundRect(-w / 2, -h / 2, w, h, 3)
  ctx.fill()
  ctx.stroke()

  ctx.strokeStyle = '#b8860b'
  ctx.lineWidth = 0.8
  ctx.globalAlpha = f.opacity * 0.45
  ctx.beginPath()
  ctx.moveTo(-w / 2 + 6, -h / 2 + h * 0.38)
  ctx.lineTo( w / 2 - 6, -h / 2 + h * 0.38)
  ctx.stroke()

  ctx.restore()
}

function drawDoodle(ctx: CanvasRenderingContext2D, type: number, w: number, h: number, params: number[]) {
  ctx.strokeStyle = '#555'
  ctx.fillStyle = '#555'
  ctx.lineWidth = 0.8
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  const p = params

  switch (type) {
    case 0: {
      // Wavy text lines
      for (let i = 0; i < 3; i++) {
        const ly = -h * 0.18 + i * h * 0.17
        const lw = w * (0.35 + p[i] * 0.3)
        ctx.beginPath()
        ctx.moveTo(-lw / 2, ly)
        ctx.quadraticCurveTo(0, ly + (p[i + 3] - 0.5) * 2, lw / 2, ly)
        ctx.stroke()
      }
      break
    }
    case 1: {
      // Bar chart
      const barCount = 3 + Math.floor(p[0] * 2)
      const barW = w * 0.08
      const maxBarH = h * 0.32
      const baseY = h * 0.12
      const startX = -(barCount * (barW + 3)) / 2
      for (let i = 0; i < barCount; i++) {
        const bh = maxBarH * (0.25 + p[i + 1] * 0.75)
        ctx.fillRect(startX + i * (barW + 3), baseY - bh, barW, bh)
      }
      ctx.beginPath()
      ctx.moveTo(startX - 2, baseY)
      ctx.lineTo(startX + barCount * (barW + 3), baseY)
      ctx.stroke()
      break
    }
    case 2: {
      // Checklist
      for (let i = 0; i < 3; i++) {
        const ly = -h * 0.18 + i * h * 0.16
        const boxSize = Math.min(4, w * 0.08)
        ctx.strokeRect(-w * 0.3, ly - boxSize / 2, boxSize, boxSize)
        if (p[i] > 0.25) {
          ctx.beginPath()
          ctx.moveTo(-w * 0.3 + 1, ly)
          ctx.lineTo(-w * 0.3 + boxSize * 0.4, ly + boxSize * 0.4)
          ctx.lineTo(-w * 0.3 + boxSize, ly - boxSize * 0.3)
          ctx.stroke()
        }
        ctx.beginPath()
        ctx.moveTo(-w * 0.15, ly)
        ctx.lineTo(-w * 0.15 + w * (0.2 + p[i + 3] * 0.2), ly)
        ctx.stroke()
      }
      break
    }
    case 3: {
      // Line graph trending up
      ctx.beginPath()
      const pts = 5
      for (let i = 0; i < pts; i++) {
        const px = -w * 0.25 + (w * 0.5 / (pts - 1)) * i
        const trend = -i * h * 0.04
        const py = h * 0.05 + trend + (p[i] - 0.5) * h * 0.18
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.stroke()
      // Axes
      const prevAlpha = ctx.globalAlpha
      ctx.globalAlpha = prevAlpha * 0.5
      ctx.beginPath()
      ctx.moveTo(-w * 0.28, h * 0.15)
      ctx.lineTo(-w * 0.28, -h * 0.15)
      ctx.moveTo(-w * 0.28, h * 0.15)
      ctx.lineTo(w * 0.28, h * 0.15)
      ctx.stroke()
      ctx.globalAlpha = prevAlpha
      break
    }
    case 4: {
      // Crown / zigzag doodle
      ctx.beginPath()
      ctx.moveTo(-w * 0.15, h * 0.05)
      ctx.lineTo(-w * 0.12, -h * 0.1)
      ctx.lineTo(-w * 0.03, 0)
      ctx.lineTo(w * 0.05, -h * 0.12)
      ctx.lineTo(w * 0.15, h * 0.05)
      ctx.stroke()
      break
    }
  }
}

function drawPaper(ctx: CanvasRenderingContext2D, p: Paper, alpha: number) {
  ctx.save()
  ctx.translate(p.x, p.y)
  ctx.rotate(p.rotation)

  const { width: w, height: h } = p

  // Subtle shadow
  ctx.globalAlpha = alpha * 0.12
  ctx.fillStyle = '#000'
  ctx.beginPath()
  ctx.roundRect(-w / 2 + 2, -h / 2 + 2, w, h, 2)
  ctx.fill()

  // Sticky note body
  ctx.globalAlpha = alpha
  ctx.fillStyle = p.noteColor
  ctx.strokeStyle = '#d4b84a'
  ctx.lineWidth = 0.6
  ctx.beginPath()
  ctx.roundRect(-w / 2, -h / 2, w, h, 1.5)
  ctx.fill()
  ctx.stroke()

  // Dog ear fold at bottom-right
  ctx.globalAlpha = alpha * 0.4
  ctx.fillStyle = '#cbb450'
  ctx.beginPath()
  const fold = Math.min(6, w * 0.12)
  ctx.moveTo(w / 2, h / 2 - fold)
  ctx.lineTo(w / 2 - fold, h / 2)
  ctx.lineTo(w / 2, h / 2)
  ctx.closePath()
  ctx.fill()

  // Tape strip at top
  ctx.save()
  ctx.translate(0, -h / 2)
  ctx.rotate(p.tapeAngle)
  ctx.globalAlpha = alpha * 0.5
  ctx.fillStyle = '#e8dbb0'
  ctx.strokeStyle = 'rgba(200, 185, 140, 0.4)'
  ctx.lineWidth = 0.3
  const tw = w * 0.55
  const th = Math.max(4, w * 0.08)
  ctx.beginPath()
  ctx.rect(-tw / 2, -th / 2, tw, th)
  ctx.fill()
  ctx.stroke()
  ctx.restore()

  // Pre-drawn doodles
  ctx.globalAlpha = alpha * 0.55
  drawDoodle(ctx, p.doodleType, w, h, p.doodleParams)

  // Animated pencil mark
  const endIdx = Math.floor(p.sigProgress * (p.sig.length - 1))
  if (endIdx > 0) {
    ctx.globalAlpha = alpha * 0.80
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 0.9
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(p.sig[0].x, p.sig[0].y)
    for (let i = 1; i <= endIdx; i++) {
      ctx.lineTo(p.sig[i].x, p.sig[i].y)
    }
    ctx.stroke()
  }

  // Pencil while drawing
  if (p.sigProgress > 0 && !p.sigDone) {
    const idx  = Math.floor(p.sigProgress * (p.sig.length - 1))
    const cur  = p.sig[idx]
    const prev = p.sig[Math.max(0, idx - 1)]
    const dir  = Math.atan2(cur.y - prev.y, cur.x - prev.x)
    const sc   = w / 55

    ctx.save()
    ctx.translate(cur.x, cur.y)
    ctx.rotate(dir - Math.PI * 0.18)
    ctx.globalAlpha = alpha
    drawPencilShape(ctx, sc)
    ctx.restore()
  }

  ctx.restore()
}

function drawPencilShape(ctx: CanvasRenderingContext2D, sc: number) {
  const len   = 13 * sc
  const thick = 3.2 * sc
  const tipL  = 3.8 * sc

  ctx.fillStyle = '#f5d442'
  ctx.strokeStyle = '#c8a800'
  ctx.lineWidth = 0.5 * sc
  ctx.beginPath()
  ctx.rect(-len, -thick / 2, len, thick)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#d4956a'
  ctx.strokeStyle = '#b8784a'
  ctx.lineWidth = 0.4 * sc
  ctx.beginPath()
  ctx.moveTo(0,    -thick / 2)
  ctx.lineTo(tipL,  0)
  ctx.lineTo(0,     thick / 2)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#2a2a2a'
  ctx.beginPath()
  ctx.arc(tipL + 0.8 * sc, 0, 0.9 * sc, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#aaaaaa'
  ctx.beginPath()
  ctx.rect(-len - 0.5 * sc, -thick / 2, 1.5 * sc, thick)
  ctx.fill()

  ctx.fillStyle = '#f4a0a0'
  ctx.strokeStyle = '#c07070'
  ctx.lineWidth = 0.4 * sc
  ctx.beginPath()
  ctx.rect(-len - 4 * sc, -thick / 2, 3.5 * sc, thick)
  ctx.fill()
  ctx.stroke()
}

function drawFreePencil(ctx: CanvasRenderingContext2D, fp: FreePencil) {
  ctx.save()
  ctx.translate(fp.x, fp.y)
  ctx.rotate(fp.rotation)
  ctx.globalAlpha = fp.opacity
  drawPencilShape(ctx, fp.scale)
  ctx.restore()
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    const folders:     Folder[]     = []
    const papers:      Paper[]      = []
    const freePencils: FreePencil[] = []

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    for (let i = 0; i < 9; i++) {
      folders.push(makeFolder(canvas.width, canvas.height))
    }

    function tick() {
      if (!canvas || !ctx) return
      const W = canvas.width
      const H = canvas.height
      ctx.clearRect(0, 0, W, H)

      // ── Sticky notes ──────────────────────────────────────────────────────
      for (let i = papers.length - 1; i >= 0; i--) {
        const p = papers[i]

        p.vy += 0.015
        p.vx *= 0.998
        p.vx += Math.sin(p.age * 0.045) * 0.018
        p.x  += p.vx
        p.y  += p.vy
        p.rotation += p.rotSpeed
        p.age++

        if (!p.sigDone) {
          p.sigProgress = Math.min(1, p.sigProgress + p.sigSpeed)
          if (p.sigProgress >= 1) {
            p.sigDone = true
            freePencils.push(spawnFreePencil(p))
          }
        }

        if (p.y > H + 60 || p.age > p.maxAge) {
          papers.splice(i, 1)
          continue
        }

        let alpha = p.baseOpacity
        if (p.age < 25) alpha *= p.age / 25
        const distFromBottom = H - p.y
        if (distFromBottom < 100) alpha *= Math.max(0, distFromBottom / 100)

        drawPaper(ctx, p, alpha)
      }

      // ── Folders ──────────────────────────────────────────────────────────
      for (const f of folders) {
        f.x += f.vx
        f.y += f.vy
        f.rotation += f.rotSpeed

        const pad = f.size
        if (f.x < -pad)    f.x = W + pad
        if (f.x > W + pad) f.x = -pad
        if (f.y < -pad)    f.y = H + pad
        if (f.y > H + pad) f.y = -pad

        f.timer--
        if (f.timer <= 0) {
          const burst = 1 + Math.floor(Math.random() * 2)
          for (let i = 0; i < burst; i++) {
            if (papers.length < 80) papers.push(makePaper(f))
          }
          f.timer = f.interval
        }

        drawFolder(ctx, f)
      }

      // ── Free pencils ───────────────────────────────────────────────────────
      for (let i = freePencils.length - 1; i >= 0; i--) {
        const fp = freePencils[i]

        fp.vy += 0.10
        fp.vx *= 0.997
        fp.x  += fp.vx
        fp.y  += fp.vy
        fp.rotation += fp.rotSpeed
        fp.age++

        if (fp.age > 160) fp.opacity = Math.max(0, fp.opacity - 0.018)

        if (fp.y > H + 80 || fp.opacity <= 0) {
          freePencils.splice(i, 1)
          continue
        }

        drawFreePencil(ctx, fp)
      }

      animId = requestAnimationFrame(tick)
    }

    tick()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: -9 }}
    />
  )
}
