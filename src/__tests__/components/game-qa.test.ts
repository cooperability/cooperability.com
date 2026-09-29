import { SCENARIOS } from '../../components/game/sandbox/qa'

// The same beta-test script /demos/candlelight?qa=1 runs in a browser. The canvas
// is stubbed because the director bakes art only when drawing.
describe('candlelight beta script', () => {
  it.each(SCENARIOS.map((s) => [s.name, s] as const))('%s', (_, scenario) => {
    expect(scenario.run()).toBeNull()
  })
})
