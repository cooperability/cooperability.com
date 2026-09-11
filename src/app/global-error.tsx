'use client'

// Catches failures in the root layout itself, so it has to supply its own
// <html>/<body> — the layout that would normally provide them is what broke.
export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
          <h1>Something went wrong</h1>
          <p>The site failed to load. Reloading usually fixes it.</p>
          <button type="button" onClick={reset}>
            Try again
          </button>
        </main>
      </body>
    </html>
  )
}
