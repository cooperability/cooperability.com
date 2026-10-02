const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

const customJestConfig = {
  // next/jest does NOT translate tsconfig "paths" into a Jest mapper. Runtime
  // resolution survives via the SWC transform, but Jest's STATIC dependency
  // graph does not -- so `jest --findRelatedTests <file>` returned zero matches
  // for modules imported via `@/` (for example `src/hooks/useResponsive.ts`).
  //
  // That matters because .husky/pre-commit runs, through lint-staged:
  //   jest --bail --findRelatedTests --passWithNoTests <staged files>
  // and --passWithNoTests turns "found no tests" into a green tick. The hook
  // reported success for precisely the changes it had never tested.
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',

  // Without this, coverage is reported over only the files some test happened
  // to import -- 14 of 41 source modules -- which flatters the headline number
  // and hides untested files entirely instead of showing them at 0%.
  collectCoverageFrom: [
    'src/**/*.{ts,tsx,js,jsx}',
    'components/**/*.{ts,tsx,js,jsx}',
    'lib/**/*.{ts,tsx,js,jsx}',
    '!**/*.d.ts',
    '!**/__tests__/**',
    '!**/node_modules/**',
  ],

  // Measured on 2026-10-02 with the mandelbrot util suite added: global
  // stmts/branch/funcs/lines were 79.50/71.28/78.10/81.14.
  // Thresholds sit at floor(measured) - 2 so real regressions fail CI without
  // flaking on incidental line-count drift.
  coverageThreshold: {
    global: {
      statements: 77,
      branches: 69,
      functions: 76,
      lines: 79,
    },
    './src/components/mandelbrot-explorer/utils/calculations.ts': {
      statements: 98,
      branches: 98,
      functions: 98,
      lines: 98,
    },
  },
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
