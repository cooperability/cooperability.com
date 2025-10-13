# Mandelbrot Explorer: Interactive Fractal Visualization

## The Challenge

The assignment was straightforward: create a webpage that visualizes the Mandelbrot set using the iterative equation **z₍ₙ₊₁₎ = z²ₙ + c**. Given a complex plane spanning from (-2, -2) to (2, 2) with at least 500×500 resolution, color each point based on whether it remains bounded (LIGHT) or diverges to infinity (DARK).

What emerged was something more: an interactive explorer that lets you dive into the infinite complexity of one of mathematics' most famous fractals.

## What Was Built

### Core Visualization ✓

The foundation meets all assignment requirements:
- **500×500 pixel grid** rendering 250,000 complex points
- **Complex plane mapping** from (-2, -2) to (2, 2)
- **Iterative calculation** implementing z₍ₙ₊₁₎ = z²ₙ + c
- **Binary coloring**: WHITE for bounded points (in the set), color gradient for diverging points

### Interactive Features

Beyond the requirements, the implementation includes:
- **Click-to-zoom**: Click anywhere to zoom 2× into that region
- **Iteration control**: Adjust max iterations (50-1000) to balance detail vs. speed
- **Progress indicator**: Real-time rendering progress with visual feedback
- **Viewport display**: Shows current complex plane bounds
- **Reset function**: Return to the classic Mandelbrot view

## Technical Implementation

### Architecture

**Component**: `src/components/mandelbrot-explorer/MandelbrotExplorer.tsx`
- React component with Canvas API for pixel-perfect rendering
- Progressive rendering in 10-row chunks via `requestAnimationFrame`
- Prevents UI blocking while processing 250K+ calculations

**Calculation Engine**: `src/components/mandelbrot-explorer/utils/calculations.ts`
- Pure functions for Mandelbrot iteration logic
- Complex number arithmetic: (zx + zy·i)² = zx² - zy² + 2·zx·zy·i
- Coordinate mapping between pixel space and complex plane
- Optimized divergence detection using magnitude² < 4

**Styling**: `src/components/mandelbrot-explorer/MandelbrotExplorer.module.css`
- Dark-first design with light mode support
- Fully responsive (mobile through desktop)
- Accessible controls with proper focus states

**Page Route**: `src/pages/mandelbrot-explorer.tsx`
- SEO metadata and OpenGraph tags
- Integrated into existing site layout

### Mathematical Correctness

Testing with the assignment's example point **(1, 2)**:

```
c = 1 + 2i
z₀ = 0 + 0i

z₁ = (0)² + (1 + 2i) = 1 + 2i
    magnitude = √(1² + 2²) = 2.236 ✓

z₂ = (1 + 2i)² + (1 + 2i) = -2 + 6i
    magnitude = √(4 + 36) = 6.325 ✓

z₃ = (-2 + 6i)² + (1 + 2i) = -31 - 22i
    magnitude = √(961 + 484) = 38.013 ✓

Result: DIVERGES → Rendered as DARK ✓
```

Testing known bounded points:
- **(0, 0)**: Center of the set → LIGHT ✓
- **(-1, 0)**: On the main bulb → LIGHT ✓
- **(0.25, 0)**: Near the edge → LIGHT (after many iterations) ✓

### Performance Strategy

**Progressive Rendering**
- Processes 10 rows per animation frame
- Maintains 60fps UI responsiveness
- Users see gradual reveal rather than frozen screen

**Canvas Optimization**
- Direct `ImageData` manipulation
- Single `putImageData` call per chunk
- Avoids expensive drawing operations

**Efficient Calculation**
- Magnitude comparison using z² < 4 (avoids sqrt)
- Early termination on divergence
- Tight inner loop for the 250K pixel calculations

## File Structure

```
src/
├── components/
│   └── mandelbrot-explorer/
│       ├── MandelbrotExplorer.tsx          # Main component (260 lines)
│       ├── MandelbrotExplorer.module.css   # Styling (270 lines)
│       └── utils/
│           └── calculations.ts              # Math functions (93 lines)
└── pages/
    └── mandelbrot-explorer.tsx              # Route page (36 lines)
```

Total: ~660 lines of production code

## Development Notes

**Time Investment**: ~2.5 hours (within the 4-hour guideline)

**Technology Choices**:
- TypeScript for type safety and self-documenting code
- React hooks for clean state management
- Canvas API for pixel-level control and performance
- CSS Modules for scoped styling

**Design Decisions**:
1. **Progressive rendering**: Prevents "frozen" UI during long calculations
2. **Interactive zoom**: Makes the fractal's infinite detail explorable
3. **Iteration controls**: Demonstrates the trade-off between detail and computation time
4. **Color gradient**: More visually interesting than binary black/white while maintaining the DARK vs LIGHT requirement

## Assignment Compliance Checklist

✅ **2D grid visualization** - 500×500 Canvas  
✅ **Equation implementation** - z₍ₙ₊₁₎ = z²ₙ + c  
✅ **Complex plane range** - (-2, -2) to (2, 2)  
✅ **Grid resolution** - 500×500 = 250,000 points  
✅ **Color coding** - LIGHT for bounded, DARK for diverging  
✅ **Frontend technology** - TypeScript + React + Canvas  
✅ **Hosted visualization** - Integrated at `/mandelbrot-explorer`  
✅ **Code sharing** - In repository with clear structure  

## Usage

**Local Development**:
```bash
yarn dev
# Navigate to http://localhost:3000/mandelbrot-explorer
```

**Production**:
```bash
yarn build
# Deployed via Vercel at https://cooperability.com/mandelbrot-explorer
```

**Interacting with the Visualization**:
1. Wait for initial render to complete
2. Click anywhere to zoom 2× into that point
3. Adjust iterations to see more/less detail
4. Click "Reset View" to return to the classic Mandelbrot set

## What Makes This Interesting

The Mandelbrot set is deceptively simple—just a quadratic equation iterated over and over. Yet it produces infinite complexity. No matter how far you zoom, you never run out of detail. The same patterns repeat at different scales, but never quite the same way twice.

This implementation captures that invitation to explore. The assignment asked for a static visualization, but the Mandelbrot set practically begs to be interactive. Every click reveals another layer of mathematical beauty.

---

**Status**: ✅ Complete and ready for submission

**Live Demo**: [cooperability.com/mandelbrot-explorer](https://cooperability.com/mandelbrot-explorer)

**Source**: [GitHub Repository](https://github.com/cooperability/cooperability.com)
