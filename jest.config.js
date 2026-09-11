const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

const customJestConfig = {
  // next/jest does NOT translate tsconfig "paths" into a Jest mapper. Runtime
  // resolution survives via the SWC transform, but Jest's STATIC dependency
  // graph does not -- so `jest --findRelatedTests <file>` returned zero matches
  // for every @/-aliased module, including the opioid dosing calculator.
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
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
