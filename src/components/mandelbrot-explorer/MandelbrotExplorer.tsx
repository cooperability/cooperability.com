import { useState, useRef, useEffect, useCallback } from 'react'
import styles from './MandelbrotExplorer.module.css'
import { Button } from '../Button'
import {
  mandelbrotIterations,
  pixelToComplex,
  iterationsToColor,
  DEFAULT_VIEWPORT,
} from './utils/calculations'

interface Viewport {
  minReal: number
  maxReal: number
  minImag: number
  maxImag: number
}

const MandelbrotExplorer = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [viewport, setViewport] = useState<Viewport>(DEFAULT_VIEWPORT)
  const [isRendering, setIsRendering] = useState(false)
  const [maxIterations, setMaxIterations] = useState(256)
  const [canvasSize] = useState(500)
  const [progress, setProgress] = useState(0)

  /**
   * Renders the Mandelbrot set to the canvas using progressive rendering.
   * Processes 10 rows at a time via requestAnimationFrame to keep the UI responsive.
   * 
   * For each pixel:
   * 1. Map (x, y) pixel coordinates to complex plane (real, imaginary)
   * 2. Iterate z = z² + c until divergence or max iterations reached
   * 3. Color based on iteration count: white if bounded, gradient if diverges
   */
  const renderMandelbrot = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    setIsRendering(true)
    setProgress(0)

    // Create ImageData for direct pixel manipulation (more efficient than drawing operations)
    const imageData = ctx.createImageData(canvasSize, canvasSize)
    const data = imageData.data

    let pixelsProcessed = 0
    const totalPixels = canvasSize * canvasSize

    // Progressive rendering: process in chunks to prevent UI freezing
    const renderChunk = (startY: number) => {
      const rowsPerChunk = 10 // Balance between speed and responsiveness
      const endY = Math.min(startY + rowsPerChunk, canvasSize)

      for (let py = startY; py < endY; py++) {
        for (let px = 0; px < canvasSize; px++) {
          // Map pixel to complex plane
          const cx = pixelToComplex(
            px,
            canvasSize,
            viewport.minReal,
            viewport.maxReal
          )
          const cy = pixelToComplex(
            py,
            canvasSize,
            viewport.minImag,
            viewport.maxImag
          )

          // Calculate iterations for this point
          const iterations = mandelbrotIterations(cx, cy, maxIterations)

          // Get color based on iteration count
          const [r, g, b] = iterationsToColor(iterations, maxIterations)

          // Set pixel in ImageData
          const index = (py * canvasSize + px) * 4
          data[index] = r // Red
          data[index + 1] = g // Green
          data[index + 2] = b // Blue
          data[index + 3] = 255 // Alpha

          pixelsProcessed++
        }
      }

      // Update canvas with current progress
      ctx.putImageData(imageData, 0, 0)

      // Update progress
      const currentProgress = Math.floor((pixelsProcessed / totalPixels) * 100)
      setProgress(currentProgress)

      // Continue rendering or finish
      if (endY < canvasSize) {
        requestAnimationFrame(() => renderChunk(endY))
      } else {
        setIsRendering(false)
        setProgress(100)
      }
    }

    // Start rendering from top
    renderChunk(0)
  }, [viewport, maxIterations, canvasSize])

  /**
   * Handles canvas clicks to zoom into the Mandelbrot set.
   * Zooms 2× centered on the clicked point, revealing more detail.
   */
  const handleCanvasClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (isRendering) return

      const canvas = canvasRef.current
      if (!canvas) return

      // Convert browser coordinates to canvas pixel coordinates
      const rect = canvas.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      const px = (x / rect.width) * canvasSize
      const py = (y / rect.height) * canvasSize

      // Map the clicked pixel to its position in the complex plane
      const clickReal = pixelToComplex(
        px,
        canvasSize,
        viewport.minReal,
        viewport.maxReal
      )
      const clickImag = pixelToComplex(
        py,
        canvasSize,
        viewport.minImag,
        viewport.maxImag
      )

      // Create new viewport: 2× zoom centered on click point
      // (divide range by 2, so we're zooming in by 2×)
      const rangeReal = viewport.maxReal - viewport.minReal
      const rangeImag = viewport.maxImag - viewport.minImag

      setViewport({
        minReal: clickReal - rangeReal / 4,
        maxReal: clickReal + rangeReal / 4,
        minImag: clickImag - rangeImag / 4,
        maxImag: clickImag + rangeImag / 4,
      })
    },
    [viewport, canvasSize, isRendering]
  )

  /**
   * Resets the viewport to show the classic Mandelbrot set view.
   */
  const handleReset = useCallback(() => {
    setViewport(DEFAULT_VIEWPORT)
    setMaxIterations(256)
  }, [])

  /**
   * Render when viewport or iterations change
   */
  useEffect(() => {
    renderMandelbrot()
  }, [renderMandelbrot])

  return (
    <div className={styles.explorer}>
      <div className={styles.header}>
        <h1 className={styles.title}>Mandelbrot Explorer</h1>
        <p className={styles.subtitle}>
          Interactive visualization of the equation: z<sub>n+1</sub> = z<sub>n</sub>
          <sup>2</sup> + c
        </p>
      </div>

      <div className={styles.canvasContainer}>
        <canvas
          ref={canvasRef}
          width={canvasSize}
          height={canvasSize}
          className={styles.canvas}
          onClick={handleCanvasClick}
          style={{ cursor: isRendering ? 'wait' : 'crosshair' }}
        />
        {isRendering && (
          <div className={styles.progressOverlay}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className={styles.progressText}>Rendering: {progress}%</span>
          </div>
        )}
      </div>

      <div className={styles.controls}>
        <div className={styles.info}>
          <div className={styles.infoRow}>
            <span className={styles.label}>Real:</span>
            <span className={styles.value}>
              [{viewport.minReal.toFixed(4)}, {viewport.maxReal.toFixed(4)}]
            </span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Imaginary:</span>
            <span className={styles.value}>
              [{viewport.minImag.toFixed(4)}, {viewport.maxImag.toFixed(4)}]
            </span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Max Iterations:</span>
            <span className={styles.value}>{maxIterations}</span>
          </div>
        </div>

        <div className={styles.buttonGroup}>
          <div className={styles.iterationControls}>
            <Button
              variant="dark"
              onClick={() => setMaxIterations((prev) => Math.max(50, prev - 50))}
              disabled={isRendering || maxIterations <= 50}
              className={styles.button}
            >
              <b>- Iterations</b>
            </Button>
            <Button
              variant="dark"
              onClick={() => setMaxIterations((prev) => Math.min(1000, prev + 50))}
              disabled={isRendering || maxIterations >= 1000}
              className={styles.button}
            >
              <b>+ Iterations</b>
            </Button>
          </div>
          <Button
            variant="dark"
            onClick={handleReset}
            disabled={isRendering}
            className={styles.resetButton}
          >
            <b>Reset View</b>
          </Button>
        </div>

        <div className={styles.instructions}>
          <p>
            <b>Click</b> on the canvas to zoom in 2x at that point.
          </p>
          <p>
            <b>White pixels</b> are bounded (in the set), <b>dark pixels</b>{' '}
            diverge to infinity.
          </p>
        </div>
      </div>
    </div>
  )
}

export default MandelbrotExplorer

