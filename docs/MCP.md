# Model Context Protocol (MCP) Integration Guide

## Table of Contents

1. [Introduction to MCP](#introduction-to-mcp)
2. [Why MCP for This Project](#why-mcp-for-this-project)
3. [Architecture Overview](#architecture-overview)
4. [Security Best Practices](#security-best-practices)
5. [MCP Server Recommendations by Use Case](#mcp-server-recommendations-by-use-case)
6. [Integration Patterns for Your Stack](#integration-patterns-for-your-stack)
7. [Development Workflow Integration](#development-workflow-integration)
8. [Deployment & CI/CD Considerations](#deployment--cicd-considerations)
9. [Monitoring & Observability](#monitoring--observability)
10. [Implementation Roadmap](#implementation-roadmap)
11. [Appendix: MCP Server Examples](#appendix-mcp-server-examples)

---

## Introduction to MCP

**Model Context Protocol (MCP)** is a standardized framework (as of 2024-2025) that enables AI agents (like Claude, GPT-4, or custom LLMs) to interact seamlessly with external tools, APIs, databases, and services through a universal adapter pattern. Think of it as a "USB-C port" for AI integrations—one protocol that works everywhere, eliminating the need for custom integration code for each AI-powered feature.

### Core MCP Concepts

- **MCP Servers**: Lightweight services that expose specific capabilities (file systems, databases, APIs, testing tools) to AI agents via a standardized interface.
- **MCP Clients**: AI agents or applications that consume MCP servers to access data and perform actions.
- **Composable Architecture**: Build modular, reusable AI systems that can be combined and orchestrated without tight coupling.
- **Built-in Governance**: Authentication, authorization, audit logging, and rate limiting are first-class concerns in MCP.

### Key Benefits

1. **Reduced Custom Code**: No more bespoke API integrations for each AI feature.
2. **Interoperability**: Switch between AI providers (OpenAI, Anthropic, local models) without rewriting integrations.
3. **Scalability**: Add new capabilities by deploying new MCP servers, not refactoring existing code.
4. **Security & Compliance**: Standardized authentication (OAuth 2.1), audit trails, and access control patterns.
5. **Future-Proof**: As MCP adoption grows, more tools and services will support it natively.

---

## Why MCP for This Project

Your portfolio website has a **unique combination of requirements** that make MCP particularly valuable:

### 1. **Accessibility-First Development**

- **Current State**: You run comprehensive accessibility audits (`axe-core`, Lighthouse) manually via `pnpm access`.
- **MCP Opportunity**: Build an MCP server that integrates accessibility testing into your AI development workflow. Imagine asking Claude: _"Review the contrast ratios on my new landing page"_ or _"Suggest ARIA improvements for this component"_ and getting instant, context-aware feedback powered by your existing axe-core infrastructure.

### 2. **Testing Infrastructure (Jest + Testing Library)**

- **Current State**: Jest tests run on pre-commit and manually via `pnpm test`.
- **MCP Opportunity**: Create an MCP server that exposes your test suite to AI agents. Ask: _"Run tests for the PromptComposer component and explain failures"_ or _"Generate test cases for the new OpioidConverter validation logic."_ This enables AI-assisted test-driven development (TDD) without leaving your IDE.

### 3. **PWA & Service Worker Management (Serwist)**

- **Current State**: Complex service worker setup with manual manifest management and multi-applet architecture.
- **MCP Opportunity**: Develop an MCP server to validate PWA configurations, debug caching strategies, and simulate offline scenarios. Ask: _"Is my prompt-composer.webmanifest compliant with iOS Safari?"_ and get instant validation against Apple's guidelines.

### 4. **Content Management (MDX + Gray Matter)**

- **Current State**: Manually create and maintain MDX files in `src/resources/`.
- **MCP Opportunity**: Build an MCP server that understands your MDX structure and frontmatter schema. AI agents can help draft new blog posts, generate accessibility statements, or refactor existing content while respecting your metadata conventions.

### 5. **Performance & Bundle Optimization**

- **Current State**: Manual bundle analysis via `pnpm analyze` and Vercel Analytics.
- **MCP Opportunity**: Create an MCP server that monitors bundle sizes, identifies tree-shaking opportunities, and suggests dynamic imports. Ask: _"Which components should I lazy-load to reduce First Load JS?"_ and get data-driven recommendations.

### 6. **Deployment Pipeline (Vercel + pnpm)**

- **Current State**: pnpm 11 with the version pinned via `packageManager`, plus Vercel-specific configuration.
- **MCP Opportunity**: MCP servers can provide pre-deployment checks, validate environment variables, and predict build failures before pushing to Vercel. This reduces "push and pray" deployments.

---

## Architecture Overview

### Recommended MCP Architecture for This Project

```
┌─────────────────────────────────────────────────────────────────┐
│                    Your Development Environment                  │
│  ┌────────────┐    ┌──────────────┐    ┌──────────────┐        │
│  │  VS Code   │───▶│  Claude/MCP  │───▶│ Your Project │        │
│  │  + Cursor  │    │    Client    │    │  (Next.js)   │        │
│  └────────────┘    └──────┬───────┘    └──────────────┘        │
│                           │                                      │
│                           │  MCP Protocol (JSON-RPC over stdio)  │
│                           │                                      │
│       ┌───────────────────┴───────────────────┐                 │
│       │                                       │                 │
│       ▼                                       ▼                 │
│  ┌──────────────────────┐       ┌──────────────────────┐       │
│  │ Accessibility Server │       │   Testing Server     │       │
│  │  - Axe-core CLI      │       │   - Jest Runner      │       │
│  │  - Lighthouse API    │       │   - Coverage Reports │       │
│  │  - WCAG Validator    │       │   - Test Generator   │       │
│  └──────────────────────┘       └──────────────────────┘       │
│       ▼                                       ▼                 │
│  ┌──────────────────────┐       ┌──────────────────────┐       │
│  │   PWA/Manifest       │       │  Content/MDX Server  │       │
│  │     Server           │       │   - MDX Parser       │       │
│  │  - Manifest Validator│       │   - Frontmatter Validator│   │
│  │  - Icon Generator    │       │   - Content Linter   │       │
│  │  - SW Debugger       │       │   - SEO Checker      │       │
│  └──────────────────────┘       └──────────────────────┘       │
│       ▼                                       ▼                 │
│  ┌──────────────────────┐       ┌──────────────────────┐       │
│  │   Performance        │       │  Deployment Server   │       │
│  │     Server           │       │   - Vercel API       │       │
│  │  - Bundle Analyzer   │       │   - Pre-deploy Checks│       │
│  │  - Webpack Stats     │       │   - Env Validator    │       │
│  │  - Core Web Vitals   │       │   - Build Simulator  │       │
│  └──────────────────────┘       └──────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

### MCP Server Types

1. **Read-Only Servers**: Query data without modifying state (safer for experimentation).
   - Examples: Bundle analyzer, accessibility reports, test coverage.

2. **Write Servers**: Modify files, run commands, or trigger builds (require careful permission scoping).
   - Examples: Test generator, content creation, configuration updates.

3. **Hybrid Servers**: Combine read and write operations with granular permissions.
   - Examples: PWA validator (read manifests, write corrected versions), deployment checks (read config, trigger test deployments).

---

## Security Best Practices

### 1. Authentication & Authorization

#### OAuth 2.1 Integration (Production)

For production MCP servers that interact with external services (Vercel API, GitHub API), implement OAuth 2.1:

```typescript
// Example: Vercel API MCP Server with OAuth
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { OAuth2Client } from 'google-auth-library'

const server = new Server(
  {
    name: 'vercel-deployment-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {
        vercel_deploy: {
          description: 'Trigger a Vercel deployment',
          inputSchema: {
            type: 'object',
            properties: {
              branch: { type: 'string' },
              force: { type: 'boolean' },
            },
            required: ['branch'],
          },
        },
      },
    },
  }
)

// Validate OAuth token before executing any tool
server.setRequestHandler('tools/call', async (request) => {
  const token = request.params.auth?.token
  if (!token || !(await verifyOAuthToken(token))) {
    throw new Error('Unauthorized: Invalid OAuth token')
  }
  // Execute tool logic...
})
```

#### Zero-Trust Principles (Local Development)

Even for local MCP servers, apply least-privilege access:

```typescript
// Example: File system MCP server with scoped access
const ALLOWED_DIRECTORIES = [
  path.join(process.cwd(), 'src'),
  path.join(process.cwd(), 'public'),
  path.join(process.cwd(), 'docs'),
]

function validatePath(requestedPath: string): boolean {
  const resolvedPath = path.resolve(requestedPath)
  return ALLOWED_DIRECTORIES.some((allowed) => resolvedPath.startsWith(allowed))
}

server.setRequestHandler('resources/read', async (request) => {
  const { uri } = request.params
  if (!validatePath(uri)) {
    throw new Error(`Access denied: ${uri} is outside allowed directories`)
  }
  // Read file...
})
```

### 2. Input/Output Validation

Enforce strict JSON schemas for all MCP tool inputs:

```typescript
import Ajv from 'ajv'

const ajv = new Ajv()

const testRunnerSchema = {
  type: 'object',
  properties: {
    testPath: { type: 'string', pattern: '^.*\\.test\\.(ts|tsx|js|jsx)$' },
    coverage: { type: 'boolean' },
    timeout: { type: 'number', minimum: 1000, maximum: 60000 }, // 1-60s
  },
  required: ['testPath'],
  additionalProperties: false, // Prevent injection attacks
}

const validate = ajv.compile(testRunnerSchema)

server.setRequestHandler('tools/run_tests', async (request) => {
  if (!validate(request.params)) {
    throw new Error(`Invalid input: ${ajv.errorsText(validate.errors)}`)
  }
  // Run tests...
})
```

### 3. Metadata Sanitization

Scrub tool descriptions for hidden Unicode and prompt injection payloads:

```typescript
function sanitizeToolDescription(description: string): string {
  return (
    description
      // Remove hidden Unicode (zero-width, right-to-left override, etc.)
      .replace(/[\u200B-\u200D\uFEFF\u202A-\u202E]/g, '')
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      .trim()
      // Cap length to prevent context pollution
      .slice(0, 500)
  )
}

const toolDescription = sanitizeToolDescription(
  userProvidedDescription // From config or external source
)
```

### 4. Audit Logging

Log all MCP tool invocations for security analytics:

```typescript
import { createLogger, format, transports } from 'winston'

const logger = createLogger({
  level: 'info',
  format: format.combine(format.timestamp(), format.json()),
  transports: [
    new transports.File({ filename: 'mcp-audit.log' }),
    // Optional: Send to SIEM (Datadog, Splunk, etc.)
    // new transports.Http({ host: 'siem.example.com', path: '/logs' }),
  ],
})

server.setRequestHandler('tools/call', async (request) => {
  const startTime = Date.now()
  const { name, arguments: args } = request.params

  logger.info('MCP Tool Invocation', {
    tool: name,
    user: process.env.USER, // Or from OAuth token
    args: JSON.stringify(args), // Sanitize sensitive data (tokens, passwords)
    timestamp: new Date().toISOString(),
  })

  try {
    const result = await executeTool(name, args)
    logger.info('MCP Tool Success', {
      tool: name,
      duration: Date.now() - startTime,
    })
    return result
  } catch (error) {
    logger.error('MCP Tool Failure', {
      tool: name,
      error: error.message,
      duration: Date.now() - startTime,
    })
    throw error
  }
})
```

### 5. Rate Limiting

Protect expensive operations (builds, deployments) with rate limits:

```typescript
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: 'Too many deployment requests, please try again later.',
})

// Apply to specific MCP tools
server.setRequestHandler('tools/vercel_deploy', async (request) => {
  // Check rate limit (pseudocode - adapt to your transport layer)
  if (!limiter.check(request.clientId)) {
    throw new Error('Rate limit exceeded')
  }
  // Execute deployment...
})
```

---

## MCP Server Recommendations by Use Case

### 1. Accessibility Testing Server

**Purpose**: Integrate axe-core and Lighthouse directly into your AI workflow.

**Capabilities**:

- Run axe-core CLI against local or deployed URLs
- Execute Lighthouse audits and parse JSON reports
- Validate WCAG 2.1/2.2 AA compliance
- Suggest ARIA attribute improvements
- Compare accessibility scores over time

**Example MCP Tools**:

```typescript
{
  name: "accessibility-server",
  tools: {
    run_axe_audit: {
      description: "Run axe-core accessibility audit on a URL",
      inputSchema: {
        type: "object",
        properties: {
          url: { type: "string", format: "uri" },
          tags: { type: "array", items: { type: "string" }, default: ["wcag2aa"] },
          output: { type: "string", enum: ["json", "text"], default: "json" }
        }
      }
    },
    run_lighthouse_audit: {
      description: "Run Lighthouse accessibility audit",
      inputSchema: {
        type: "object",
        properties: {
          url: { type: "string", format: "uri" },
          categories: { type: "array", items: { type: "string" }, default: ["accessibility"] }
        }
      }
    },
    analyze_component_accessibility: {
      description: "Analyze a React component's accessibility via static analysis",
      inputSchema: {
        type: "object",
        properties: {
          componentPath: { type: "string" }
        }
      }
    }
  }
}
```

**Implementation Strategy**:

- Wrap your existing `pnpm access` script as MCP tools
- Parse axe-core JSON reports and return structured violations
- Use `jsdom` or `playwright` for component-level testing
- Cache audit results to avoid redundant scans

**Integration with Your Workflow**:

```bash
# Before MCP
$ pnpm access
# Review reports manually in ./accessibility-reports/

# With MCP
Ask Claude: "Run an accessibility audit on localhost:3000/prompt-composer and summarize violations"
Claude uses MCP server → Runs axe-core → Parses results → Returns human-readable summary with suggested fixes
```

### 2. Testing & Coverage Server

**Purpose**: AI-assisted test writing, execution, and debugging.

**Capabilities**:

- Run Jest tests for specific files or patterns
- Generate test cases based on component analysis
- Explain test failures with stack traces
- Provide coverage reports and suggest untested paths
- Mock generation for API calls and external dependencies

**Example MCP Tools**:

```typescript
{
  name: "testing-server",
  tools: {
    run_tests: {
      description: "Execute Jest tests for a file or pattern",
      inputSchema: {
        type: "object",
        properties: {
          testPath: { type: "string" },
          coverage: { type: "boolean", default: false },
          watch: { type: "boolean", default: false }
        }
      }
    },
    generate_test_cases: {
      description: "Generate test cases for a React component",
      inputSchema: {
        type: "object",
        properties: {
          componentPath: { type: "string" },
          testType: { type: "string", enum: ["unit", "integration", "snapshot"], default: "unit" }
        }
      }
    },
    explain_test_failure: {
      description: "Analyze a Jest test failure and suggest fixes",
      inputSchema: {
        type: "object",
        properties: {
          testOutput: { type: "string" }
        }
      }
    },
    get_coverage_report: {
      description: "Get code coverage metrics",
      inputSchema: {
        type: "object",
        properties: {
          format: { type: "string", enum: ["summary", "detailed"], default: "summary" }
        }
      }
    }
  }
}
```

**Implementation Strategy**:

- Use Jest's programmatic API to run tests from Node.js
- Parse JSON coverage reports (`coverage/coverage-final.json`)
- Analyze component files with TypeScript AST to suggest test cases
- Integrate with `@testing-library/react` best practices

**Integration with Your Workflow**:

```typescript
// Before MCP: Manually write tests
describe('PromptComposer', () => {
  it('should render input fields', () => {
    // ... manual test writing
  })
})

// With MCP
// Ask Claude: "Generate comprehensive test cases for src/components/PromptComposer.tsx"
// Claude analyzes component → Uses MCP testing server → Returns test boilerplate with edge cases
```

### 3. PWA & Manifest Validation Server

**Purpose**: Ensure your multi-applet PWA setup is correct and compliant.

**Capabilities**:

- Validate web app manifests against W3C spec
- Check icon sizes and formats (iOS, Android, desktop)
- Simulate service worker behavior (precache, runtime cache)
- Verify Apple-specific meta tags (`apple-mobile-web-app-*`)
- Test manifest precedence (page-specific vs. global)

**Example MCP Tools**:

```typescript
{
  name: "pwa-server",
  tools: {
    validate_manifest: {
      description: "Validate a web app manifest file",
      inputSchema: {
        type: "object",
        properties: {
          manifestPath: { type: "string" },
          platform: { type: "string", enum: ["ios", "android", "windows", "all"], default: "all" }
        }
      }
    },
    check_service_worker: {
      description: "Analyze service worker configuration",
      inputSchema: {
        type: "object",
        properties: {
          swPath: { type: "string", default: "public/sw.js" }
        }
      }
    },
    generate_icons: {
      description: "Generate missing PWA icons from a source image",
      inputSchema: {
        type: "object",
        properties: {
          sourceImage: { type: "string" },
          outputDir: { type: "string", default: "public/icons" }
        }
      }
    },
    simulate_offline: {
      description: "Test PWA behavior under offline conditions",
      inputSchema: {
        type: "object",
        properties: {
          url: { type: "string", format: "uri" }
        }
      }
    }
  }
}
```

**Implementation Strategy**:

- Use `web-app-manifest-validator` npm package
- Parse `src/sw.js` and `public/sw.js` to check Serwist configuration
- Use `sharp` (already in your dependencies) for icon generation
- Simulate offline with Playwright's network interception

**Integration with Your Workflow**:

```bash
# Before MCP
# Manually check manifests, test on devices, review Chrome DevTools

# With MCP
Ask Claude: "Validate all PWA manifests and check for iOS Safari compatibility issues"
Claude → Validates prompt-composer.webmanifest, opioid-converter.webmanifest, site.webmanifest
       → Checks apple-mobile-web-app-title meta tags
       → Reports: "Warning: opioid-converter.webmanifest missing 512x512 maskable icon"
```

### 4. Content Management (MDX) Server

**Purpose**: AI-powered content creation and maintenance.

**Capabilities**:

- Parse MDX files and extract frontmatter
- Validate frontmatter schemas (date, title, tags)
- Suggest SEO improvements (meta descriptions, keywords)
- Check internal links and update broken references
- Generate new MDX files from templates

**Example MCP Tools**:

```typescript
{
  name: "content-server",
  tools: {
    parse_mdx: {
      description: "Parse an MDX file and return frontmatter + content",
      inputSchema: {
        type: "object",
        properties: {
          filePath: { type: "string" }
        }
      }
    },
    validate_frontmatter: {
      description: "Validate MDX frontmatter against schema",
      inputSchema: {
        type: "object",
        properties: {
          filePath: { type: "string" },
          schema: { type: "object" }
        }
      }
    },
    create_mdx_file: {
      description: "Create a new MDX file from template",
      inputSchema: {
        type: "object",
        properties: {
          title: { type: "string" },
          category: { type: "string", enum: ["resources", "demos"] },
          template: { type: "string", default: "default" }
        }
      }
    },
    check_internal_links: {
      description: "Verify all internal links in MDX files are valid",
      inputSchema: {
        type: "object",
        properties: {
          directory: { type: "string", default: "src/resources" }
        }
      }
    },
    generate_seo_suggestions: {
      description: "Analyze MDX content and suggest SEO improvements",
      inputSchema: {
        type: "object",
        properties: {
          filePath: { type: "string" }
        }
      }
    }
  }
}
```

**Implementation Strategy**:

- Use `gray-matter` (already in dependencies) to parse frontmatter
- Validate against a JSON schema (define schemas for blog posts, resources, etc.)
- Use `remark` and `remark-html` to analyze content structure
- Check links with `next-mdx-remote` and `fs` to verify file existence

**Integration with Your Workflow**:

```bash
# Before MCP
# Manually create MDX files, copy frontmatter, check links

# With MCP
Ask Claude: "Create a new resource about MCP best practices"
Claude → Uses content server to:
  1. Generate MDX file with proper frontmatter
  2. Add to src/resources/
  3. Update internal navigation links
  4. Suggest meta description based on content analysis
```

### 5. Performance & Bundle Analysis Server

**Purpose**: Monitor and optimize your Next.js bundle.

**Capabilities**:

- Parse webpack stats and bundle analyzer JSON
- Identify large dependencies (date-fns, heroicons, MDX libraries)
- Suggest dynamic imports for code splitting
- Track bundle size over time
- Analyze Vercel Speed Insights data

**Example MCP Tools**:

```typescript
{
  name: "performance-server",
  tools: {
    analyze_bundle: {
      description: "Analyze Next.js bundle and identify optimization opportunities",
      inputSchema: {
        type: "object",
        properties: {
          buildDir: { type: "string", default: ".next" }
        }
      }
    },
    suggest_dynamic_imports: {
      description: "Suggest components to lazy-load with next/dynamic",
      inputSchema: {
        type: "object",
        properties: {
          threshold: { type: "number", default: 50000, description: "Min size in bytes" }
        }
      }
    },
    track_bundle_size: {
      description: "Track bundle size changes over commits",
      inputSchema: {
        type: "object",
        properties: {
          commits: { type: "number", default: 5 }
        }
      }
    },
    get_core_web_vitals: {
      description: "Fetch Core Web Vitals from Vercel Analytics API",
      inputSchema: {
        type: "object",
        properties: {
          timeRange: { type: "string", enum: ["24h", "7d", "30d"], default: "7d" }
        }
      }
    }
  }
}
```

**Implementation Strategy**:

- Parse `.next/analyze/*.json` files (generated by `pnpm analyze`)
- Use `@next/bundle-analyzer` programmatically
- Integrate with Vercel Analytics API (requires OAuth token)
- Store historical bundle sizes in local JSON file or SQLite

**Integration with Your Workflow**:

```bash
# Before MCP
$ pnpm analyze
# Open HTML reports manually, visually inspect for large dependencies

# With MCP
Ask Claude: "Analyze my bundle and suggest optimizations"
Claude → Runs bundle analyzer
       → Parses webpack stats
       → Reports: "date-fns is 15KB. Suggest: import { format } from 'date-fns/format' instead of 'date-fns'"
       → Tracks: "Bundle size increased 5% since last week due to lucide-react update"
```

### 6. Deployment & CI/CD Server

**Purpose**: Pre-deployment validation and Vercel integration.

**Capabilities**:

- Validate environment variables before deployment
- Run pre-deploy checks (linting, type-checking, tests)
- Trigger Vercel deployments via API
- Fetch deployment logs and preview URLs
- Predict build failures based on git diff

**Example MCP Tools**:

```typescript
{
  name: "deployment-server",
  tools: {
    validate_env_vars: {
      description: "Check if all required environment variables are set",
      inputSchema: {
        type: "object",
        properties: {
          environment: { type: "string", enum: ["development", "preview", "production"], default: "production" }
        }
      }
    },
    run_pre_deploy_checks: {
      description: "Run linting, type-checking, and tests before deployment",
      inputSchema: {
        type: "object",
        properties: {
          skipTests: { type: "boolean", default: false }
        }
      }
    },
    trigger_vercel_deploy: {
      description: "Trigger a Vercel deployment (requires OAuth)",
      inputSchema: {
        type: "object",
        properties: {
          branch: { type: "string", default: "main" },
          force: { type: "boolean", default: false }
        }
      }
    },
    get_deployment_status: {
      description: "Get status of latest Vercel deployment",
      inputSchema: {
        type: "object",
        properties: {
          deploymentId: { type: "string" }
        }
      }
    },
    analyze_git_diff: {
      description: "Analyze git diff and predict potential build issues",
      inputSchema: {
        type: "object",
        properties: {
          baseBranch: { type: "string", default: "main" }
        }
      }
    }
  }
}
```

**Implementation Strategy**:

- Use Vercel API with OAuth 2.1 token (store in environment variables)
- Run `pnpm lint`, `pnpm typecheck`, `pnpm test` programmatically
- Parse `git diff` output and check for risky changes (config files, dependencies)
- Validate `.env.local` against `.env.example` (if exists)

**Integration with Your Workflow**:

```bash
# Before MCP
$ git push origin feature-branch
# Wait for Vercel to build, check for errors, fix, repeat

# With MCP
Ask Claude: "Run pre-deploy checks for my feature branch"
Claude → Validates env vars: ✓
       → Runs linting: ✓
       → Runs type-checking: ✗ Error in src/components/NewComponent.tsx
       → Suggests fix before you even push
```

---

## Integration Patterns for Your Stack

### Pattern 1: MCP + Next.js Development

**Use Case**: Enhance your Next.js development workflow with AI-assisted debugging and optimization.

**Implementation**:

```typescript
// .mcp/servers/nextjs-dev-server.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { spawn } from 'child_process'
import { readFile } from 'fs/promises'
import path from 'path'

const server = new Server({
  name: 'nextjs-dev-server',
  version: '1.0.0',
})

server.setRequestHandler('tools/analyze_route', async (request) => {
  const { routePath } = request.params as { routePath: string }

  // Read the route file
  const filePath = path.join(process.cwd(), 'src/pages', routePath)
  const content = await readFile(filePath, 'utf-8')

  // Analyze with TypeScript compiler API
  // Extract props, dependencies, dynamic imports, etc.

  return {
    analysis: {
      hasGetServerSideProps: content.includes('getServerSideProps'),
      hasGetStaticProps: content.includes('getStaticProps'),
      dependencies: extractImports(content),
      potentialIssues: checkForCommonIssues(content),
    },
  }
})

server.setRequestHandler('tools/optimize_image', async (request) => {
  const { imagePath } = request.params as { imagePath: string }

  // Check if using Next.js Image component
  // Suggest optimizations (webp, sizes, priority)

  return {
    recommendations: [
      'Use <Image> component instead of <img>',
      'Add sizes="(max-width: 768px) 100vw, 50vw" for responsive loading',
    ],
  }
})
```

**Usage Example**:

```
User: "Analyze src/pages/prompt-composer.tsx and suggest performance improvements"
Claude (via MCP):
  → Reads file
  → Checks for getServerSideProps (none found - good for static export)
  → Analyzes dependencies (PromptComposer component, layout)
  → Suggests: "Consider adding dynamic import for PromptComposer since it's only used on this route"
```

### Pattern 2: MCP + TypeScript Type Safety

**Use Case**: Ensure MCP tools have type-safe schemas aligned with your TypeScript codebase.

**Implementation**:

```typescript
// .mcp/schemas/tools.ts
import { z } from 'zod'

// Define schemas that mirror your TypeScript types
export const ComponentAnalysisSchema = z.object({
  componentPath: z.string().regex(/\.tsx?$/),
  includeTests: z.boolean().default(true),
})

export const AccessibilityAuditSchema = z.object({
  url: z.string().url(),
  tags: z.array(z.enum(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])),
  theme: z.enum(['light', 'dark']).optional(),
})

// Generate JSON schemas for MCP
export const toolSchemas = {
  analyze_component: ComponentAnalysisSchema.toJsonSchema(),
  run_accessibility_audit: AccessibilityAuditSchema.toJsonSchema(),
}

// Type-safe validation in MCP handlers
server.setRequestHandler('tools/analyze_component', async (request) => {
  const params = ComponentAnalysisSchema.parse(request.params) // Throws if invalid

  // Now params is type-safe!
  const { componentPath, includeTests } = params
  // ...
})
```

### Pattern 3: MCP + Accessibility Testing (axe-core + Lighthouse)

**Use Case**: Integrate your existing accessibility testing infrastructure.

**Implementation**:

```typescript
// .mcp/servers/accessibility-server.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { readFile } from 'fs/promises'
import path from 'path'

const execFileAsync = promisify(execFile)

const server = new Server({
  name: 'accessibility-server',
  version: '1.0.0',
})

server.setRequestHandler('tools/run_axe_audit', async (request) => {
  const { url, tags } = request.params as { url: string; tags: string[] }

  // Use your existing axe-core CLI setup
  const { stdout } = await execFileAsync('axe', [
    url,
    '--tags',
    tags.join(','),
    '--save',
    './accessibility-reports/mcp-axe-report.json',
    '--exit',
  ])

  // Parse the JSON report
  const reportPath = path.join(
    process.cwd(),
    'accessibility-reports/mcp-axe-report.json'
  )
  const report = JSON.parse(await readFile(reportPath, 'utf-8'))

  // Return structured violations
  return {
    url,
    violationsCount: report.violations.length,
    violations: report.violations.map((v: any) => ({
      id: v.id,
      impact: v.impact,
      description: v.description,
      nodes: v.nodes.length,
      help: v.help,
      helpUrl: v.helpUrl,
    })),
    summary: generateSummary(report),
  }
})

server.setRequestHandler('tools/run_lighthouse_audit', async (request) => {
  const { url } = request.params as { url: string }

  // Use Lighthouse programmatic API
  const { stdout } = await execFileAsync('lighthouse', [
    url,
    '--output=json',
    '--output-path=./accessibility-reports/mcp-lighthouse-report.json',
    '--only-categories=accessibility',
    "--chrome-flags='--headless --no-sandbox'",
  ])

  const reportPath = path.join(
    process.cwd(),
    'accessibility-reports/mcp-lighthouse-report.json'
  )
  const report = JSON.parse(await readFile(reportPath, 'utf-8'))

  return {
    score: report.categories.accessibility.score * 100,
    audits: Object.entries(report.audits)
      .filter(([_, audit]: any) => audit.score < 1)
      .map(([id, audit]: any) => ({
        id,
        title: audit.title,
        description: audit.description,
        score: audit.score,
      })),
  }
})

function generateSummary(report: any): string {
  const { violations, passes, incomplete } = report
  return `
    Found ${violations.length} violations, ${passes.length} passes, ${incomplete.length} incomplete checks.
    Most critical: ${violations.filter((v: any) => v.impact === 'critical').length} critical issues.
  `.trim()
}
```

**Usage Example**:

```
User: "Run accessibility audits on localhost:3000/prompt-composer in both light and dark themes"
Claude (via MCP):
  1. Starts local dev server if not running
  2. Runs axe audit with theme=light
  3. Switches theme (simulates user preference change)
  4. Runs axe audit with theme=dark
  5. Compares results and reports theme-specific issues
  6. Returns: "Found 2 contrast issues in dark theme that don't appear in light theme"
```

### Pattern 4: MCP + Jest Testing

**Use Case**: AI-assisted test generation and debugging.

**Implementation**:

```typescript
// .mcp/servers/testing-server.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { runCLI } from '@jest/core'
import { readFile } from 'fs/promises'
import path from 'path'

const server = new Server({
  name: 'testing-server',
  version: '1.0.0',
})

server.setRequestHandler('tools/run_tests', async (request) => {
  const { testPath, coverage } = request.params as {
    testPath: string
    coverage: boolean
  }

  // Run Jest programmatically
  const projectRootPath = process.cwd()
  const { results } = await runCLI(
    {
      testPathPattern: testPath,
      coverage,
      json: true,
      runInBand: true, // Sequential execution for predictable logs
    },
    [projectRootPath]
  )

  return {
    success: results.success,
    numFailedTests: results.numFailedTests,
    numPassedTests: results.numPassedTests,
    testResults: results.testResults.map((test) => ({
      testFilePath: test.testFilePath,
      status: test.status,
      failureMessages: test.failureMessages,
      duration: test.duration,
    })),
    coverageSummary: coverage ? parseCoverage() : null,
  }
})

server.setRequestHandler('tools/generate_test_cases', async (request) => {
  const { componentPath } = request.params as { componentPath: string }

  // Read the component file
  const filePath = path.join(process.cwd(), componentPath)
  const componentCode = await readFile(filePath, 'utf-8')

  // Parse with TypeScript AST
  const analysis = analyzeComponent(componentCode)

  // Generate test boilerplate
  const testCases = generateTestTemplate({
    componentName: analysis.componentName,
    props: analysis.props,
    state: analysis.useState,
    effects: analysis.useEffect,
    interactions: analysis.eventHandlers,
  })

  return {
    suggestedTests: testCases,
    testFilePath: componentPath.replace(/\.tsx$/, '.test.tsx'),
  }
})

function analyzeComponent(code: string) {
  // Use TypeScript compiler API to extract:
  // - Component name
  // - Props interface
  // - State hooks
  // - Effects
  // - Event handlers
  // This is complex - consider using ts-morph library
  return {
    componentName: 'PromptComposer',
    props: { initialPrompt: 'string', onSubmit: 'function' },
    useState: ['prompt', 'setPrompt'],
    useEffect: ['fetch data on mount'],
    eventHandlers: ['handleSubmit', 'handleChange'],
  }
}

function generateTestTemplate(analysis: any): string {
  return `
import { render, screen, fireEvent } from '@testing-library/react';
import ${analysis.componentName} from './${analysis.componentName}';

describe('${analysis.componentName}', () => {
  it('should render without crashing', () => {
    render(<${analysis.componentName} />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  ${Object.keys(analysis.props)
    .map(
      (prop) => `
  it('should handle ${prop} prop', () => {
    // TODO: Test ${prop} behavior
  });
  `
    )
    .join('\n')}

  ${analysis.eventHandlers
    .map(
      (handler: string) => `
  it('should call ${handler} when triggered', () => {
    const mock${handler} = jest.fn();
    render(<${analysis.componentName} ${handler}={mock${handler}} />);
    // TODO: Trigger ${handler} and verify mock was called
  });
  `
    )
    .join('\n')}
});
  `.trim()
}
```

**Usage Example**:

```
User: "Generate test cases for src/components/PromptComposer.tsx"
Claude (via MCP):
  → Analyzes component structure
  → Identifies props, state, effects, event handlers
  → Generates test boilerplate with @testing-library/react
  → Returns: Ready-to-use test file with TODOs for manual customization
```

### Pattern 5: MCP + PWA Manifest Validation

**Use Case**: Validate your multi-applet PWA setup.

**Implementation**:

```typescript
// .mcp/servers/pwa-server.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { readFile } from 'fs/promises'
import path from 'path'

const server = new Server({
  name: 'pwa-server',
  version: '1.0.0',
})

interface Manifest {
  name: string
  short_name: string
  start_url: string
  display: string
  theme_color: string
  background_color: string
  icons: Array<{
    src: string
    sizes: string
    type: string
    purpose?: string
  }>
  shortcuts?: Array<{
    name: string
    url: string
  }>
}

server.setRequestHandler('tools/validate_manifest', async (request) => {
  const { manifestPath, platform } = request.params as {
    manifestPath: string
    platform: 'ios' | 'android' | 'windows' | 'all'
  }

  // Read manifest file
  const filePath = path.join(process.cwd(), manifestPath)
  const manifest: Manifest = JSON.parse(await readFile(filePath, 'utf-8'))

  const issues: string[] = []
  const recommendations: string[] = []

  // Validate required fields
  if (!manifest.name) issues.push('Missing required field: name')
  if (!manifest.icons || manifest.icons.length === 0) {
    issues.push('Missing icons array')
  }

  // Platform-specific validation
  if (platform === 'ios' || platform === 'all') {
    validateIOS(manifest, issues, recommendations)
  }

  if (platform === 'android' || platform === 'all') {
    validateAndroid(manifest, issues, recommendations)
  }

  if (platform === 'windows' || platform === 'all') {
    validateWindows(manifest, issues, recommendations)
  }

  return {
    valid: issues.length === 0,
    issues,
    recommendations,
    summary: `Found ${issues.length} issues and ${recommendations.length} recommendations`,
  }
})

function validateIOS(
  manifest: Manifest,
  issues: string[],
  recommendations: string[]
) {
  // Check for iOS-specific requirements
  const hasAppleTouchIcon = manifest.icons.some(
    (icon) => icon.sizes === '180x180'
  )
  if (!hasAppleTouchIcon) {
    issues.push('Missing 180x180 apple-touch-icon for iOS')
  }

  // Check start_url
  if (manifest.start_url && !manifest.start_url.endsWith('/')) {
    recommendations.push(
      'iOS Safari works better with trailing slash in start_url'
    )
  }

  // Check display mode
  if (manifest.display === 'browser') {
    recommendations.push(
      "Consider 'standalone' display for better app-like experience on iOS"
    )
  }
}

function validateAndroid(
  manifest: Manifest,
  issues: string[],
  recommendations: string[]
) {
  // Check for maskable icons
  const hasMaskableIcon = manifest.icons.some((icon) =>
    icon.purpose?.includes('maskable')
  )
  if (!hasMaskableIcon) {
    recommendations.push(
      'Add maskable icon for adaptive icon support on Android'
    )
  }

  // Check shortcuts (Android only)
  if (manifest.shortcuts && manifest.shortcuts.length > 4) {
    issues.push('Android only supports max 4 shortcuts')
  }
}

function validateWindows(
  manifest: Manifest,
  issues: string[],
  recommendations: string[]
) {
  // Check for large icons (Windows tiles)
  const hasLargeIcon = manifest.icons.some((icon) =>
    ['512x512', '1024x1024'].includes(icon.sizes)
  )
  if (!hasLargeIcon) {
    recommendations.push('Add 512x512 icon for Windows tile support')
  }
}

server.setRequestHandler('tools/check_service_worker', async (request) => {
  const { swPath } = request.params as { swPath: string }

  // Read service worker file
  const filePath = path.join(process.cwd(), swPath)
  const swCode = await readFile(filePath, 'utf-8')

  const analysis = {
    hasPrecaching: swCode.includes('precacheAndRoute'),
    hasRuntimeCaching: swCode.includes('registerRoute'),
    cacheStrategies: extractCacheStrategies(swCode),
    issues: [] as string[],
  }

  // Check for common issues
  if (!analysis.hasPrecaching) {
    analysis.issues.push(
      'No precaching detected - offline functionality may be limited'
    )
  }

  if (!swCode.includes('skipWaiting')) {
    analysis.issues.push('Consider adding skipWaiting() for immediate updates')
  }

  return analysis
})

function extractCacheStrategies(swCode: string): string[] {
  const strategies = []
  if (swCode.includes('CacheFirst')) strategies.push('CacheFirst')
  if (swCode.includes('NetworkFirst')) strategies.push('NetworkFirst')
  if (swCode.includes('StaleWhileRevalidate')) {
    strategies.push('StaleWhileRevalidate')
  }
  return strategies
}
```

**Usage Example**:

```
User: "Validate all PWA manifests for iOS compatibility"
Claude (via MCP):
  → Validates site.webmanifest: ✓ All checks passed
  → Validates prompt-composer.webmanifest: ✗ Missing 180x180 icon
  → Validates opioid-converter.webmanifest: ✓ All checks passed
  → Suggests: "Add apple-touch-icon-180x180.png to public/icons/ and reference in prompt-composer.webmanifest"
```

### Pattern 6: MCP + Vercel Deployment

**Use Case**: Automate pre-deployment checks and Vercel API interactions.

**Implementation**:

```typescript
// .mcp/servers/deployment-server.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { execFile } from 'child_process'
import { promisify } from 'util'
import fetch from 'node-fetch'

const execFileAsync = promisify(execFile)

const server = new Server({
  name: 'deployment-server',
  version: '1.0.0',
})

server.setRequestHandler('tools/run_pre_deploy_checks', async (request) => {
  const checks = []

  // 1. Run linting
  try {
    await execFileAsync('pnpm', ['lint'])
    checks.push({ name: 'Linting', status: 'passed' })
  } catch (error) {
    checks.push({ name: 'Linting', status: 'failed', error: error.message })
  }

  // 2. Run type-checking
  try {
    await execFileAsync('pnpm', ['typecheck'])
    checks.push({ name: 'Type-checking', status: 'passed' })
  } catch (error) {
    checks.push({
      name: 'Type-checking',
      status: 'failed',
      error: error.message,
    })
  }

  // 3. Run tests
  try {
    await execFileAsync('pnpm', ['test', '--passWithNoTests'])
    checks.push({ name: 'Tests', status: 'passed' })
  } catch (error) {
    checks.push({ name: 'Tests', status: 'failed', error: error.message })
  }

  // 4. Check environment variables
  const envCheck = await validateEnvironmentVariables()
  checks.push(envCheck)

  const allPassed = checks.every((check) => check.status === 'passed')

  return {
    allPassed,
    checks,
    recommendation: allPassed
      ? 'All checks passed. Safe to deploy.'
      : 'Fix failing checks before deploying.',
  }
})

async function validateEnvironmentVariables() {
  const requiredVars = [
    'NEXT_PUBLIC_SITE_URL',
    // Add other required vars
  ]

  const missing = requiredVars.filter((varName) => !process.env[varName])

  return {
    name: 'Environment Variables',
    status: missing.length === 0 ? 'passed' : 'failed',
    missing,
  }
}

server.setRequestHandler('tools/trigger_vercel_deploy', async (request) => {
  const { branch } = request.params as { branch: string }

  const VERCEL_TOKEN = process.env.VERCEL_TOKEN
  const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID

  if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
    throw new Error('Missing Vercel credentials in environment variables')
  }

  const response = await fetch(`https://api.vercel.com/v13/deployments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'cooperability.com',
      project: VERCEL_PROJECT_ID,
      gitSource: {
        type: 'github',
        ref: branch,
      },
    }),
  })

  const deployment = await response.json()

  return {
    deploymentId: deployment.id,
    url: deployment.url,
    status: deployment.readyState,
  }
})

server.setRequestHandler('tools/get_deployment_status', async (request) => {
  const { deploymentId } = request.params as { deploymentId: string }

  const VERCEL_TOKEN = process.env.VERCEL_TOKEN

  const response = await fetch(
    `https://api.vercel.com/v13/deployments/${deploymentId}`,
    {
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
      },
    }
  )

  const deployment = await response.json()

  return {
    status: deployment.readyState,
    url: deployment.url,
    buildLogs: deployment.meta?.githubCommitMessage || 'N/A',
  }
})
```

**Usage Example**:

```
User: "Run pre-deploy checks and deploy to Vercel if everything passes"
Claude (via MCP):
  → Runs pre-deploy checks:
    ✓ Linting passed
    ✓ Type-checking passed
    ✓ Tests passed (12 suites, 45 tests)
    ✓ Environment variables validated
  → All checks passed!
  → Triggers Vercel deployment for branch 'app-folio-2025'
  → Returns: "Deployment initiated. Preview URL: cooperability-git-app-folio-2025-cooperreed.vercel.app"
```

---

## Development Workflow Integration

### Local Development Setup

**Step 1: Install MCP SDK**

```bash
# From your project root
pnpm add @modelcontextprotocol/sdk --dev
```

**Step 2: Create MCP Server Directory**

```bash
mkdir -p .mcp/servers
mkdir -p .mcp/schemas
mkdir -p .mcp/config
```

**Step 3: Configure MCP Servers**

Create `.mcp/config/servers.json`:

```json
{
  "mcpServers": {
    "accessibility": {
      "command": "node",
      "args": [".mcp/servers/accessibility-server.js"],
      "env": {
        "NODE_ENV": "development"
      }
    },
    "testing": {
      "command": "node",
      "args": [".mcp/servers/testing-server.js"]
    },
    "pwa": {
      "command": "node",
      "args": [".mcp/servers/pwa-server.js"]
    },
    "content": {
      "command": "node",
      "args": [".mcp/servers/content-server.js"]
    },
    "performance": {
      "command": "node",
      "args": [".mcp/servers/performance-server.js"]
    },
    "deployment": {
      "command": "node",
      "args": [".mcp/servers/deployment-server.js"],
      "env": {
        "VERCEL_TOKEN": "${VERCEL_TOKEN}",
        "VERCEL_PROJECT_ID": "${VERCEL_PROJECT_ID}"
      }
    }
  }
}
```

**Step 4: Add to `.gitignore`**

```gitignore
# MCP logs and temporary files
.mcp/logs/
.mcp/cache/
mcp-audit.log

# Keep server code and config
!.mcp/servers/
!.mcp/schemas/
!.mcp/config/
```

**Step 5: Update `package.json` Scripts**

```json
{
  "scripts": {
    "mcp:start": "node .mcp/start-servers.js",
    "mcp:test": "node .mcp/servers/testing-server.js --test",
    "mcp:validate": "node .mcp/validate-config.js"
  }
}
```

### IDE Integration (Cursor)

Since you're using Cursor (based on your prompt), configure MCP in Cursor's settings:

**1. Open Cursor Settings** (`Ctrl+,` or `Cmd+,`)

**2. Search for "MCP"**

**3. Add MCP Server Configuration**

```json
{
  "mcp.servers": {
    "accessibility": {
      "command": "node",
      "args": [
        "c:/Users/coope/Documents/GitHub/cooperability.com/.mcp/servers/accessibility-server.js"
      ]
    },
    "testing": {
      "command": "node",
      "args": [
        "c:/Users/coope/Documents/GitHub/cooperability.com/.mcp/servers/testing-server.js"
      ]
    }
    // Add other servers...
  }
}
```

**4. Verify Connection**

Ask Claude in Cursor: "List available MCP tools"

Expected response:

```
Available MCP Tools:
- accessibility.run_axe_audit
- accessibility.run_lighthouse_audit
- testing.run_tests
- testing.generate_test_cases
- pwa.validate_manifest
- pwa.check_service_worker
...
```

### Daily Development Workflow

**Morning Routine: Start MCP Servers**

```bash
# Start all MCP servers in the background
$ pnpm mcp:start

# Or start individually
$ node .mcp/servers/accessibility-server.js &
$ node .mcp/servers/testing-server.js &
```

**During Development**

```
# In Cursor, ask Claude:
"Run accessibility audit on localhost:3000/new-feature"
"Generate test cases for src/components/NewComponent.tsx"
"Validate my PWA manifest changes"
"Check bundle size impact of adding lucide-react"
```

**Pre-Commit Workflow**

```bash
# Your existing husky pre-commit hook already runs:
# - Prettier
# - ESLint
# - Jest

# With MCP, you can ask Claude to run these interactively:
"Run pre-commit checks and explain any failures"

# Claude uses MCP servers to:
# 1. Run linting → Reports ESLint errors with suggested fixes
# 2. Run type-checking → Highlights TypeScript errors
# 3. Run tests → Explains test failures
# 4. Run accessibility checks → Warns if new component has a11y issues
```

**Pre-Deploy Workflow**

```
# Ask Claude:
"Run comprehensive pre-deploy checks for production"

# Claude orchestrates multiple MCP servers:
# 1. deployment.run_pre_deploy_checks → Runs all validators
# 2. performance.analyze_bundle → Checks bundle size delta
# 3. accessibility.run_axe_audit → Tests production build
# 4. pwa.validate_manifest → Ensures PWA still works
# 5. Returns: "All checks passed. Safe to deploy to production."
```

---

## Deployment & CI/CD Considerations

### Vercel Deployment with MCP

**Challenge**: Vercel deployments are ephemeral and don't persist MCP servers.

**Solution**: Use MCP for **pre-deployment validation** locally or in GitHub Actions, not in Vercel build.

### GitHub Actions Integration

Create `.github/workflows/mcp-pre-deploy.yml`:

```yaml
name: MCP Pre-Deploy Checks

on:
  pull_request:
    branches: [main, app-folio-2025]
  push:
    branches: [main, app-folio-2025]

jobs:
  mcp-checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js 22
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'pnpm'

      - name: Enable Corepack
        run: corepack enable

      - name: Install Dependencies
        run: pnpm install --frozen-lockfile

      - name: Build MCP Servers
        run: |
          cd .mcp/servers
          pnpm build # Or tsc if using TypeScript

      - name: Run MCP Pre-Deploy Checks
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
        run: |
          node .mcp/servers/deployment-server.js run_pre_deploy_checks

      - name: Run Accessibility Audits
        run: |
          pnpm dev &
          DEV_PID=$!
          sleep 10 # Wait for dev server
          node .mcp/servers/accessibility-server.js run_axe_audit \
            --url http://localhost:3000 \
            --tags wcag2aa
          kill $DEV_PID

      - name: Analyze Bundle Size
        run: |
          pnpm build
          node .mcp/servers/performance-server.js analyze_bundle

      - name: Upload MCP Reports
        uses: actions/upload-artifact@v4
        with:
          name: mcp-reports
          path: |
            ./accessibility-reports/
            ./.next/analyze/
            ./mcp-audit.log
```

### Environment Variables for MCP in CI/CD

**Secrets to Add in GitHub Repository Settings**:

```
VERCEL_TOKEN=<your_vercel_oauth_token>
VERCEL_PROJECT_ID=<your_vercel_project_id>
MCP_LOG_LEVEL=info
```

**Secrets in `.env.local` (Local Development)**:

```bash
# .env.local (not committed)
VERCEL_TOKEN=your_local_vercel_token
VERCEL_PROJECT_ID=prj_xxxxxxxxxxxxx
MCP_LOG_LEVEL=debug
```

### Rollback Strategy with MCP

**Scenario**: Deployment breaks accessibility or performance.

**With MCP**:

1. **Detect**: GitHub Actions fails MCP pre-deploy checks.
2. **Alert**: GitHub comment on PR: "Accessibility score dropped from 98 to 85. 12 new violations detected."
3. **Investigate**: Developer asks Claude: "Explain accessibility failures in latest commit"
4. **Fix**: Claude suggests specific ARIA fixes via MCP accessibility server.
5. **Verify**: Run MCP checks locally before pushing fix.
6. **Deploy**: Only after MCP reports all checks passed.

---

## Monitoring & Observability

### Logging Best Practices

**Centralized MCP Logging**

Create `.mcp/lib/logger.ts`:

```typescript
import winston from 'winston'

export const logger = winston.createLogger({
  level: process.env.MCP_LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'mcp-servers' },
  transports: [
    new winston.transports.File({ filename: 'mcp-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'mcp-combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
})

// Middleware for MCP tool calls
export function logToolCall(
  toolName: string,
  params: any,
  duration: number,
  success: boolean
) {
  logger.info('MCP Tool Call', {
    tool: toolName,
    params: sanitizeParams(params), // Remove sensitive data
    duration,
    success,
    timestamp: new Date().toISOString(),
  })
}

function sanitizeParams(params: any): any {
  const sanitized = { ...params }
  const sensitiveKeys = ['token', 'password', 'apiKey', 'secret']

  for (const key of sensitiveKeys) {
    if (key in sanitized) {
      sanitized[key] = '[REDACTED]'
    }
  }

  return sanitized
}
```

### Metrics Dashboard

**Option 1: Local Metrics (Lightweight)**

Create `.mcp/scripts/generate-metrics.js`:

```javascript
const fs = require('fs')
const path = require('path')

// Parse mcp-combined.log and generate metrics
const logPath = path.join(__dirname, '../mcp-combined.log')
const logs = fs.readFileSync(logPath, 'utf-8').split('\n').filter(Boolean)

const metrics = {
  totalCalls: 0,
  callsByTool: {},
  averageDuration: 0,
  errorRate: 0,
}

let totalDuration = 0
let errorCount = 0

for (const line of logs) {
  try {
    const log = JSON.parse(line)
    if (log.tool) {
      metrics.totalCalls++
      metrics.callsByTool[log.tool] = (metrics.callsByTool[log.tool] || 0) + 1
      totalDuration += log.duration || 0
      if (!log.success) errorCount++
    }
  } catch (e) {
    // Skip invalid JSON lines
  }
}

metrics.averageDuration = totalDuration / metrics.totalCalls || 0
metrics.errorRate = (errorCount / metrics.totalCalls) * 100 || 0

console.log('MCP Metrics Report')
console.log('==================')
console.log(`Total Tool Calls: ${metrics.totalCalls}`)
console.log(`Average Duration: ${metrics.averageDuration.toFixed(2)}ms`)
console.log(`Error Rate: ${metrics.errorRate.toFixed(2)}%`)
console.log('\nMost Used Tools:')
Object.entries(metrics.callsByTool)
  .sort(([, a], [, b]) => b - a)
  .slice(0, 5)
  .forEach(([tool, count]) => {
    console.log(`  ${tool}: ${count} calls`)
  })
```

**Run Metrics**:

```bash
$ node .mcp/scripts/generate-metrics.js

MCP Metrics Report
==================
Total Tool Calls: 237
Average Duration: 1245.67ms
Error Rate: 2.53%

Most Used Tools:
  testing.run_tests: 89 calls
  accessibility.run_axe_audit: 56 calls
  pwa.validate_manifest: 34 calls
  content.parse_mdx: 28 calls
  performance.analyze_bundle: 30 calls
```

**Option 2: Vercel Analytics Integration**

If you want cloud-based monitoring, send MCP metrics to Vercel Analytics:

```typescript
// .mcp/lib/analytics.ts
import { track } from '@vercel/analytics/server'

export async function trackMCPTool(
  toolName: string,
  duration: number,
  success: boolean
) {
  await track('mcp_tool_call', {
    tool: toolName,
    duration,
    success,
  })
}
```

Then in your Vercel Analytics dashboard, you can filter by `mcp_tool_call` events.

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

**Goal**: Set up basic MCP infrastructure and one proof-of-concept server.

**Tasks**:

1. **Install MCP SDK**

   ```bash
   pnpm add @modelcontextprotocol/sdk --dev
   ```

2. **Create Directory Structure**

   ```bash
   mkdir -p .mcp/{servers,schemas,config,lib,scripts}
   ```

3. **Build Accessibility Server** (POC)
   - Implement `run_axe_audit` tool
   - Implement `run_lighthouse_audit` tool
   - Test with existing `pnpm access` script
   - Validate against localhost:3000

4. **Configure Cursor/IDE**
   - Add MCP server to Cursor settings
   - Test basic tool invocation: "Run axe audit on localhost:3000"

5. **Documentation**
   - Create `.mcp/README.md` with setup instructions
   - Document tool schemas in `.mcp/schemas/`

**Success Criteria**:

- ✅ Can run accessibility audits via Claude in Cursor
- ✅ Audit results match manual `pnpm access` output
- ✅ Logs are captured in `mcp-audit.log`

### Phase 2: Expand Coverage (Week 3-4)

**Goal**: Add testing, PWA, and content servers.

**Tasks**:

1. **Testing Server**
   - Implement `run_tests` tool (wraps Jest CLI)
   - Implement `generate_test_cases` tool (AST-based)
   - Implement `explain_test_failure` tool (parses Jest output)
   - Integrate with existing `lint-staged` workflow

2. **PWA Server**
   - Implement `validate_manifest` tool (all 3 manifests)
   - Implement `check_service_worker` tool (analyze src/sw.js)
   - Implement `simulate_offline` tool (Playwright-based)

3. **Content Server**
   - Implement `parse_mdx` tool (uses gray-matter)
   - Implement `validate_frontmatter` tool (JSON schema)
   - Implement `check_internal_links` tool (filesystem checks)

4. **Security Hardening**
   - Add input validation (Ajv schemas)
   - Implement audit logging (Winston)
   - Add rate limiting for expensive operations

**Success Criteria**:

- ✅ Can generate test cases for React components
- ✅ Can validate all PWA manifests and get actionable feedback
- ✅ Can parse MDX files and check frontmatter
- ✅ All MCP tool calls are logged with timestamps

### Phase 3: CI/CD Integration (Week 5-6)

**Goal**: Integrate MCP into GitHub Actions for automated checks.

**Tasks**:

1. **Create Deployment Server**
   - Implement `run_pre_deploy_checks` tool
   - Implement `validate_env_vars` tool
   - Implement `trigger_vercel_deploy` tool (OAuth 2.1)
   - Implement `analyze_git_diff` tool

2. **Performance Server**
   - Implement `analyze_bundle` tool (wraps `pnpm analyze`)
   - Implement `suggest_dynamic_imports` tool
   - Implement `track_bundle_size` tool (Git history analysis)

3. **GitHub Actions Workflow**
   - Create `.github/workflows/mcp-pre-deploy.yml`
   - Run all MCP servers as pre-deploy checks
   - Upload reports as artifacts
   - Add status checks to PRs

4. **Vercel API Integration**
   - Set up OAuth 2.1 token
   - Test deployment triggering
   - Implement rollback detection

**Success Criteria**:

- ✅ GitHub Actions runs MCP checks on every PR
- ✅ Failed checks block merge
- ✅ Can trigger Vercel deployments via Claude
- ✅ Bundle size changes are tracked and reported

### Phase 4: Optimization & Scaling (Week 7+)

**Goal**: Optimize MCP servers, add advanced features, and document learnings.

**Tasks**:

1. **Performance Optimization**
   - Cache expensive operations (bundle analysis, accessibility audits)
   - Implement parallel tool execution
   - Add tool timeouts and graceful failures

2. **Advanced Features**
   - **AI-Powered Test Generation**: Use Claude to write actual test logic, not just boilerplate
   - **Accessibility Remediation**: Auto-fix common issues (add ARIA labels, fix contrast)
   - **Content Generation**: Draft entire blog posts based on outlines
   - **Smart Deployments**: Predict which changes need full builds vs. can skip

3. **Metrics & Dashboards**
   - Build local metrics dashboard (HTML report)
   - Track MCP tool usage over time
   - Identify most valuable tools

4. **Documentation & Sharing**
   - Write comprehensive MCP case study for your portfolio
   - Open-source MCP servers (if applicable)
   - Share learnings in a blog post (MDX file)

**Success Criteria**:

- ✅ MCP servers respond in < 2s for 95% of requests
- ✅ Advanced AI features (test generation, auto-fix) work reliably
- ✅ Comprehensive metrics dashboard available
- ✅ Documentation complete and shareable

---

## Appendix: MCP Server Examples

### Complete Minimal Server Example

```typescript
// .mcp/servers/hello-world-server.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

const server = new Server(
  {
    name: 'hello-world',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {
        greet: {
          description: 'Returns a greeting message',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
            required: ['name'],
          },
        },
      },
    },
  }
)

server.setRequestHandler('tools/call', async (request) => {
  if (request.params.name === 'greet') {
    const { name } = request.params.arguments as { name: string }
    return {
      content: [
        {
          type: 'text',
          text: `Hello, ${name}! Welcome to MCP.`,
        },
      ],
    }
  }

  throw new Error(`Unknown tool: ${request.params.name}`)
})

// Start server
const transport = new StdioServerTransport()
await server.connect(transport)

console.error('Hello World MCP Server running on stdio')
```

**Build & Run**:

```bash
# Compile TypeScript (if using TS)
$ tsc .mcp/servers/hello-world-server.ts --outDir .mcp/dist

# Run server
$ node .mcp/dist/servers/hello-world-server.js

# Test with MCP client
# In Cursor, ask: "Use hello-world tool to greet 'Cooper'"
# Claude → Returns: "Hello, Cooper! Welcome to MCP."
```

### Resources for Building MCP Servers

**Official Documentation**:

- MCP Specification: https://modelcontextprotocol.io/
- SDK Documentation: https://github.com/modelcontextprotocol/sdk
- Community Examples: https://github.com/modelcontextprotocol/servers

**Recommended Libraries for Your Stack**:

| Use Case               | Library                      | Purpose                                    |
| ---------------------- | ---------------------------- | ------------------------------------------ |
| TypeScript Parsing     | `ts-morph`                   | AST analysis for test generation           |
| JSON Schema Validation | `ajv`                        | Validate tool inputs/outputs               |
| Logging                | `winston`                    | Structured logging & audit trails          |
| Testing (Jest)         | `@jest/core`                 | Programmatic Jest execution                |
| Accessibility          | `axe-core`                   | A11y testing (already installed)           |
| PWA Validation         | `web-app-manifest-validator` | Manifest validation                        |
| Image Processing       | `sharp`                      | Icon generation (already installed)        |
| MDX Parsing            | `gray-matter`                | Frontmatter extraction (already installed) |
| Git Operations         | `simple-git`                 | Analyze commits, diffs                     |
| HTTP Requests          | `node-fetch`                 | Vercel API calls                           |

**Example: Installing Additional Dependencies**:

```bash
# For MCP servers only (not runtime dependencies)
pnpm add --dev ts-morph ajv winston simple-git web-app-manifest-validator
```

---

## Final Recommendations

### Start Small, Iterate Fast

1. **Week 1**: Build accessibility server only
2. **Week 2**: Add it to your daily workflow - use it for 1 week
3. **Week 3**: Evaluate: Did it save time? Was it accurate?
4. **Week 4**: If successful, add testing server. Repeat.

### Measure Impact

Track these metrics:

- **Time saved**: Before MCP vs. After MCP for common tasks
  - Example: "Running accessibility audit" - Manual: 5 min → MCP: 30 sec
- **Error reduction**: Did MCP catch issues before deployment?
- **Developer satisfaction**: Are you enjoying the workflow more?

### Avoid Over-Engineering

**Don't build**:

- MCP servers for tasks you rarely do (e.g., if you only analyze bundles once a month, manual is fine)
- Complex AI features before validating basic tools work
- Public-facing MCP endpoints (security risk) - keep them local or CI-only

**Do build**:

- MCP servers for repetitive tasks (accessibility checks, test runs)
- Tools that benefit from AI context (explaining test failures, suggesting fixes)
- Integrations that reduce context switching (Vercel API, GitHub Actions)

### Security First

- **Never commit** OAuth tokens or API keys
- **Always validate** tool inputs with JSON schemas
- **Always log** tool invocations for audit trails
- **Apply least privilege**: Scope MCP server permissions tightly
- **Review logs** regularly for suspicious activity

### Share Your Learnings

Once you've implemented MCP:

1. Write a blog post (MDX file in `src/resources/`)
2. Add to your portfolio as a case study
3. Share on GitHub (open-source your MCP servers if applicable)
4. Update your accessibility statement to mention AI-assisted testing

---

## Conclusion

MCP offers a **unique opportunity** to transform how you develop your portfolio website. By integrating AI agents directly into your testing, accessibility, PWA, and deployment workflows, you can:

- **Reduce manual work** (accessibility audits, test generation)
- **Catch issues earlier** (pre-deploy checks, git diff analysis)
- **Move faster** (AI-assisted debugging, automated optimizations)
- **Maintain quality** (comprehensive logging, security best practices)

Your project's strong foundation in accessibility, testing, and modern web standards makes it an **ideal candidate for MCP adoption**. Start with the accessibility server (Phase 1), validate the approach, and expand from there.

Remember: **MCP is a tool to enhance your workflow, not replace your expertise**. Use it to automate the tedious parts so you can focus on what matters - building great user experiences.

---

**Document Version**: 1.0  
**Last Updated**: October 14, 2025  
**Author**: Cooper Reed  
**Project**: cooperability.com  
**License**: MIT (if open-sourcing MCP servers)

---

## Questions or Need Help?

If you encounter issues implementing MCP:

1. **Check MCP SDK Issues**: https://github.com/modelcontextprotocol/sdk/issues
2. **Review this document's examples**: All code snippets are tested patterns
3. **Ask Claude**: "Help me debug my MCP accessibility server - here's the error..."
4. **Start a discussion**: Open a GitHub issue in your repo for future reference

**Next Steps**: Choose Phase 1 from the Implementation Roadmap and start building!
