# Project Structure & Organization Guide

## Current Root Structure Analysis

### ✅ **Files That Should Stay in Root** (Standard Convention)

These files MUST remain in root per tool/framework conventions:

| File                     | Purpose                                   | Required in Root? |
| ------------------------ | ----------------------------------------- | ----------------- |
| `package.json`           | Project dependencies & scripts            | ✅ Yes            |
| `yarn.lock`              | Dependency lockfile                       | ✅ Yes            |
| `.yarnrc.yml`            | Yarn configuration                        | ✅ Yes            |
| `.pnp.cjs`               | Yarn PnP manifest                         | ✅ Yes            |
| `.pnp.loader.mjs`        | Yarn PnP ESM loader                       | ✅ Yes            |
| `next.config.js`         | Next.js configuration                     | ✅ Yes            |
| `next-env.d.ts`          | Next.js type definitions (auto-generated) | ✅ Yes            |
| `tsconfig.json`          | TypeScript base config                    | ✅ Yes            |
| `tsconfig.tsbuildinfo`   | TypeScript build cache (auto-generated)   | ✅ Yes            |
| `tailwind.config.js`     | Tailwind CSS config                       | ✅ Yes            |
| `postcss.config.js`      | PostCSS config (Tailwind dependency)      | ✅ Yes            |
| `eslint.config.mjs`      | ESLint configuration                      | ✅ Yes            |
| `jest.config.js`         | Jest configuration                        | ✅ Yes            |
| `jest.setup.js`          | Jest setup/initialization                 | ✅ Yes            |
| `components.json`        | shadcn/ui configuration                   | ✅ Yes            |
| `next-sitemap.config.js` | Sitemap generation config                 | ✅ Yes            |
| `vercel.json`            | Vercel deployment config                  | ✅ Yes            |
| `.gitignore`             | Git ignore rules                          | ✅ Yes            |
| `.gitattributes`         | Git attributes (line endings, etc.)       | ✅ Yes            |
| `.prettierrc.json`       | Prettier configuration                    | ✅ Yes            |
| `.prettierignore`        | Prettier ignore rules                     | ✅ Yes            |
| `.nvmrc`                 | Node version specification                | ✅ Yes            |
| `README.md`              | Project overview                          | ✅ Yes            |

**Total: 23 files** - All correctly placed ✅

---

## 📋 Recommended Cleanup Actions

### **Optional Actions (Nice-to-Have)**

#### 1. **Create `.editorconfig` for consistency**

```bash
# Create .editorconfig in root
cat > .editorconfig << 'EOF'
root = true

[*]
charset = utf-8
end_of_line = lf
indent_size = 2
indent_style = space
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false

[*.yml]
indent_size = 2

[Makefile]
indent_style = tab
EOF
```

**Benefits:**

- Ensures consistent formatting across editors
- Complements Prettier configuration

#### 2. **Add `.npmrc` for Yarn users**

```bash
# Prevent accidental npm usage
echo "engine-strict=true" > .npmrc
```

**Benefits:**

- Prevents mixing npm and yarn
- Enforces package manager consistency

---

## Architectural Patterns

### Unified Link Components

When building navigation components requiring visual consistency across both internal and external links, use a **conditional render pattern**:

```tsx
interface LinkProps {
  href: string
  external?: boolean
  children: React.ReactNode
}

function UnifiedLink({ href, external, children }: LinkProps) {
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    )
  }
  return <Link href={href}>{children}</Link>
}
```

**Why This Matters:**

- **SEO**: External links need `rel="noopener noreferrer"` to avoid penalties
- **Performance**: Next.js `Link` provides prefetching for internal routes only
- **Consistency**: Single source of truth for all link styling and behavior

**Implementation**: See `src/sections/Sidebar.tsx` for the `SidebarLink` component.

---

## 📁 Ideal Long-Term Structure

```
cooperability.com/
├── .github/                    # GitHub-specific configs
├── .husky/                     # Git hooks
├── .vscode/                    # Editor settings
├── .yarn/                      # Yarn PnP SDKs
├── docs/                       # ✨ Renamed from documentation/
│   ├── DEPLOYMENT-FIXES.md
│   ├── MCP.md
│   ├── PWA.md
│   └── Tooling.md
├── public/                     # Static assets
├── scripts/                    # ✨ Consolidated scripts
│   ├── build-sw.mjs
│   ├── create-report-dir.js   # ✨ Moved from root
│   └── setup-env.sh           # ✨ Moved from root
├── src/                        # Application source
├── [config files]              # All configs in root (necessary)
├── .editorconfig              # Optional: Editor consistency
├── .gitignore
├── .nvmrc
├── .prettierrc.json
├── package.json
├── README.md
├── tsconfig.json
└── yarn.lock
```
