import type { Haptic } from './sandbox/world'

// What a hit feels like on each device. Phones take a vibration pattern in
// ms; only Android browsers have one, as iOS Safari has no Vibration API.
// Controllers take a dual-rumble effect: Chrome, Edge and desktop Safari
// drive one, iOS Safari does not.
const PHONE: Record<Haptic, number[]> = { hurt: [40, 30, 40], hit: [18] }
const PAD: Record<Haptic, GamepadEffectParameters> = {
  hurt: { duration: 220, strongMagnitude: 0.9, weakMagnitude: 0.4 },
  hit: { duration: 70, strongMagnitude: 0.2, weakMagnitude: 0.8 },
}

// Whichever input the player last used, which is what is in their hands.
export type Source = 'touch' | 'key' | 'pad'

export function buzz(kind: Haptic, source: Source) {
  if (source === 'touch') navigator.vibrate?.(PHONE[kind])
  if (source !== 'pad') return
  for (const pad of navigator.getGamepads?.() ?? []) {
    try {
      pad?.vibrationActuator
        ?.playEffect('dual-rumble', PAD[kind])
        .catch(() => {})
    } catch {
      // Some browsers expose the actuator but throw for an effect it lacks.
    }
  }
}

// The tick on a press of the on-screen pad, where a vibration exists.
export function tick() {
  navigator.vibrate?.(8)
}
