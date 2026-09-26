export const STEP_MS = 1000 / 60
export const MAX_STEPS = 5

// Returns how many fixed updates to run for `elapsed` ms. The backlog is
// dropped past MAX_STEPS so a long stall (tab hidden, debugger) resumes
// instead of fast-forwarding through seconds of game time.
export function consume(
  carry: number,
  elapsed: number
): { steps: number; carry: number } {
  const total = carry + elapsed
  const steps = Math.floor(total / STEP_MS)
  if (steps > MAX_STEPS) return { steps: MAX_STEPS, carry: 0 }
  return { steps, carry: total - steps * STEP_MS }
}

export function startLoop(step: () => void, draw: () => void): () => void {
  let carry = 0
  let last = performance.now()
  let frame = requestAnimationFrame(function tick(now) {
    const result = consume(carry, now - last)
    carry = result.carry
    last = now
    for (let i = 0; i < result.steps; i++) step()
    draw()
    frame = requestAnimationFrame(tick)
  })
  return () => cancelAnimationFrame(frame)
}
