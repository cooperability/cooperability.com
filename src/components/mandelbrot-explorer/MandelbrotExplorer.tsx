import { useState, useRef, useEffect, useCallback } from 'react'
import styles from './MandelbrotExplorer.module.css'
import { Button } from '@/components/ui/button'
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
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const [viewport, setViewport] = useState<Viewport>(DEFAULT_VIEWPORT)
  const [isRendering, setIsRendering] = useState(false)
  const [maxIterations, setMaxIterations] = useState(256)
  const [canvasSize] = useState(500)
  const [progress, setProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(
    null
  )
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  })
  const [lastTapTime, setLastTapTime] = useState(0)
  const [pinchDistance, setPinchDistance] = useState<number | null>(null)

  /**
   * Redraws the canvas with the current drag offset (without re-rendering the fractal)
   */
  const redrawWithOffset = useCallback(
    (offsetX: number, offsetY: number) => {
      const canvas = canvasRef.current
      const offscreenCanvas = offscreenCanvasRef.current
      if (!canvas || !offscreenCanvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Clear the canvas
      ctx.clearRect(0, 0, canvasSize, canvasSize)

      // Draw the offscreen canvas with offset
      ctx.drawImage(offscreenCanvas, offsetX, offsetY)
    },
    [canvasSize]
  )

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

    // Create offscreen canvas if it doesn't exist
    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement('canvas')
      offscreenCanvasRef.current.width = canvasSize
      offscreenCanvasRef.current.height = canvasSize
    }

    const offscreenCanvas = offscreenCanvasRef.current
    const offscreenCtx = offscreenCanvas.getContext('2d')
    if (!offscreenCtx) return

    setIsRendering(true)
    setProgress(0)

    // Create ImageData for direct pixel manipulation (more efficient than drawing operations)
    const imageData = offscreenCtx.createImageData(canvasSize, canvasSize)
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

      // Update offscreen canvas with current progress
      offscreenCtx.putImageData(imageData, 0, 0)

      // Copy to visible canvas
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvasSize, canvasSize)
        ctx.drawImage(offscreenCanvas, 0, 0)
      }

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
   * Handles mouse down event to start panning.
   * Records the starting position for drag calculation.
   */
  const handleMouseDown = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (isRendering) return

      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      setIsDragging(true)
      setDragStart({ x, y })
      setDragOffset({ x: 0, y: 0 })
    },
    [isRendering]
  )

  /**
   * Handles mouse move event to visually pan the canvas.
   * Only updates the visual offset without re-rendering the fractal.
   */
  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDragging || !dragStart) return

      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      // Calculate drag offset in pixels
      const offsetX = x - dragStart.x
      const offsetY = y - dragStart.y

      // Update drag offset state and redraw with offset
      setDragOffset({ x: offsetX, y: offsetY })
      redrawWithOffset(offsetX, offsetY)
    },
    [isDragging, dragStart, redrawWithOffset]
  )

  /**
   * Handles mouse up event to end panning.
   * Calculates the new viewport based on the drag and triggers re-render.
   * Only updates viewport if there was significant movement (not a click).
   */
  const handleMouseUp = useCallback(() => {
    if (!isDragging || !dragStart) {
      setIsDragging(false)
      setDragStart(null)
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return

    // Check if this was a significant drag (threshold: 5 pixels)
    const dragDistance = Math.sqrt(dragOffset.x ** 2 + dragOffset.y ** 2)
    const isSignificantDrag = dragDistance > 5

    if (isSignificantDrag) {
      const rect = canvas.getBoundingClientRect()

      // Convert pixel offset to complex plane delta
      const rangeReal = viewport.maxReal - viewport.minReal
      const rangeImag = viewport.maxImag - viewport.minImag
      const deltaReal = -(dragOffset.x / rect.width) * rangeReal
      const deltaImag = -(dragOffset.y / rect.height) * rangeImag

      // Update viewport by shifting it based on drag
      setViewport({
        minReal: viewport.minReal + deltaReal,
        maxReal: viewport.maxReal + deltaReal,
        minImag: viewport.minImag + deltaImag,
        maxImag: viewport.maxImag + deltaImag,
      })
    } else {
      // Was just a click, redraw without offset
      redrawWithOffset(0, 0)
    }

    // Reset drag state
    setIsDragging(false)
    setDragStart(null)
    setDragOffset({ x: 0, y: 0 })
  }, [isDragging, dragStart, dragOffset, viewport, redrawWithOffset])

  /**
   * Handles double-click to zoom into the Mandelbrot set.
   * Zooms 2× centered on the clicked point, revealing more detail.
   */
  const handleDoubleClick = useCallback(
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
   * Handles touch start - supports both single-finger pan and two-finger pinch
   */
  const handleTouchStart = useCallback(
    (event: React.TouchEvent<HTMLCanvasElement>) => {
      if (isRendering) return

      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const touches = event.touches

      if (touches.length === 1) {
        // Single finger - check for double-tap
        const now = Date.now()
        const timeSinceLastTap = now - lastTapTime

        const touch = touches[0]
        const x = touch.clientX - rect.left
        const y = touch.clientY - rect.top

        if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
          // Double-tap detected - zoom in
          const px = (x / rect.width) * canvasSize
          const py = (y / rect.height) * canvasSize

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

          const rangeReal = viewport.maxReal - viewport.minReal
          const rangeImag = viewport.maxImag - viewport.minImag

          setViewport({
            minReal: clickReal - rangeReal / 4,
            maxReal: clickReal + rangeReal / 4,
            minImag: clickImag - rangeImag / 4,
            maxImag: clickImag + rangeImag / 4,
          })

          setLastTapTime(0) // Reset to prevent triple-tap
        } else {
          // Single tap - start drag
          setIsDragging(true)
          setDragStart({ x, y })
          setDragOffset({ x: 0, y: 0 })
          setLastTapTime(now)
        }
      } else if (touches.length === 2) {
        // Two fingers - start pinch
        const dx = touches[0].clientX - touches[1].clientX
        const dy = touches[0].clientY - touches[1].clientY
        const distance = Math.sqrt(dx * dx + dy * dy)
        setPinchDistance(distance)
        setIsDragging(false)
      }
    },
    [isRendering, lastTapTime, viewport, canvasSize]
  )

  /**
   * Handles touch move - supports pan and pinch-to-zoom
   */
  const handleTouchMove = useCallback(
    (event: React.TouchEvent<HTMLCanvasElement>) => {
      event.preventDefault() // Prevent scrolling while touching canvas

      if (isRendering) return

      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const touches = event.touches

      if (touches.length === 1 && isDragging && dragStart) {
        // Single finger drag
        const touch = touches[0]
        const x = touch.clientX - rect.left
        const y = touch.clientY - rect.top

        const offsetX = x - dragStart.x
        const offsetY = y - dragStart.y

        setDragOffset({ x: offsetX, y: offsetY })
        redrawWithOffset(offsetX, offsetY)
      } else if (touches.length === 2 && pinchDistance !== null) {
        // Two finger pinch
        const dx = touches[0].clientX - touches[1].clientX
        const dy = touches[0].clientY - touches[1].clientY
        const distance = Math.sqrt(dx * dx + dy * dy)

        const scale = distance / pinchDistance

        // Only apply zoom if significant change (> 10%)
        if (Math.abs(scale - 1) > 0.1) {
          // Calculate center point between fingers
          const centerX =
            (touches[0].clientX + touches[1].clientX) / 2 - rect.left
          const centerY =
            (touches[0].clientY + touches[1].clientY) / 2 - rect.top
          const px = (centerX / rect.width) * canvasSize
          const py = (centerY / rect.height) * canvasSize

          const centerReal = pixelToComplex(
            px,
            canvasSize,
            viewport.minReal,
            viewport.maxReal
          )
          const centerImag = pixelToComplex(
            py,
            canvasSize,
            viewport.minImag,
            viewport.maxImag
          )

          // Zoom in if pinching out (scale > 1), zoom out if pinching in (scale < 1)
          const rangeReal = viewport.maxReal - viewport.minReal
          const rangeImag = viewport.maxImag - viewport.minImag
          const zoomFactor = 1 / scale

          setViewport({
            minReal: centerReal - (rangeReal * zoomFactor) / 2,
            maxReal: centerReal + (rangeReal * zoomFactor) / 2,
            minImag: centerImag - (rangeImag * zoomFactor) / 2,
            maxImag: centerImag + (rangeImag * zoomFactor) / 2,
          })

          setPinchDistance(distance)
        }
      }
    },
    [
      isDragging,
      dragStart,
      pinchDistance,
      viewport,
      canvasSize,
      isRendering,
      redrawWithOffset,
    ]
  )

  /**
   * Handles touch end - finalizes pan or pinch
   */
  const handleTouchEnd = useCallback(() => {
    if (isDragging && dragStart) {
      // Check if this was a significant drag
      const dragDistance = Math.sqrt(dragOffset.x ** 2 + dragOffset.y ** 2)
      const isSignificantDrag = dragDistance > 5

      if (isSignificantDrag) {
        const canvas = canvasRef.current
        if (canvas) {
          const rect = canvas.getBoundingClientRect()

          const rangeReal = viewport.maxReal - viewport.minReal
          const rangeImag = viewport.maxImag - viewport.minImag
          const deltaReal = -(dragOffset.x / rect.width) * rangeReal
          const deltaImag = -(dragOffset.y / rect.height) * rangeImag

          setViewport({
            minReal: viewport.minReal + deltaReal,
            maxReal: viewport.maxReal + deltaReal,
            minImag: viewport.minImag + deltaImag,
            maxImag: viewport.maxImag + deltaImag,
          })
        }
      } else {
        // Was just a tap, redraw without offset
        redrawWithOffset(0, 0)
      }
    }

    // Reset drag and pinch state
    setIsDragging(false)
    setDragStart(null)
    setDragOffset({ x: 0, y: 0 })
    setPinchDistance(null)
  }, [isDragging, dragStart, dragOffset, viewport, redrawWithOffset])

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
        <div className={styles.instructions}>
          <p>
            <b>Click or tap</b> + <b>drag</b> to pan, <b>double-click</b> to
            zoom 2×.
          </p>
        </div>
      </div>

      <div className={styles.canvasContainer}>
        <canvas
          ref={canvasRef}
          width={canvasSize}
          height={canvasSize}
          className={styles.canvas}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDoubleClick={handleDoubleClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            cursor: isRendering ? 'wait' : isDragging ? 'grabbing' : 'grab',
            touchAction: 'none', // Prevent default touch behaviors
          }}
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
        <div className={styles.buttonGroup}>
          <div className={styles.iterationControls}>
            <Button
              onClick={() =>
                setMaxIterations((prev) => Math.max(50, prev - 50))
              }
              disabled={isRendering || maxIterations <= 50}
              className={styles.button}
            >
              <b>- Iterations</b>
            </Button>
            <Button
              onClick={() =>
                setMaxIterations((prev) => Math.min(1000, prev + 50))
              }
              disabled={isRendering || maxIterations >= 1000}
              className={styles.button}
            >
              <b>+ Iterations</b>
            </Button>
          </div>
          <Button
            onClick={handleReset}
            disabled={isRendering}
            className={styles.resetButton}
          >
            <b>Reset View</b>
          </Button>
        </div>
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

        <p>
          This visualizes the equation: z<sub>n+1</sub> = z<sub>n</sub>
          <sup>2</sup> + c
          <br />
          <b>White pixels</b> are bounded (in the set), <b>dark pixels</b>{' '}
          diverge to infinity.
        </p>
      </div>
    </div>
  )
}

export default MandelbrotExplorer
