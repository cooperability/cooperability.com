import '@testing-library/jest-dom'

// pnpm's isolated tree exposes these packages as native ESM `.mjs`. Yarn PnP
// hid that from Jest. Mock them so route-module imports in tests do not have
// to transform node_modules.
jest.mock('@vercel/analytics/react', () => ({ Analytics: () => null }))
jest.mock('@vercel/speed-insights/next', () => ({ SpeedInsights: () => null }))
