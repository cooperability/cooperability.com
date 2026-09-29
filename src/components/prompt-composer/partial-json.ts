/**
 * Reads a JSON document that is still arriving. The review streams as
 * structured output, so after any chunk the text is a valid prefix of a JSON
 * object. Closing whatever is open turns most prefixes into valid JSON; the
 * rest (a half-written key, `tru`, a split escape) parse once a few trailing
 * characters are dropped.
 *
 * Returns undefined when nothing usable has arrived yet.
 */

// Closes an open string and any open containers, and drops a dangling
// separator that would leave the result invalid.
function close(prefix: string): string {
  const stack: string[] = []
  let inString = false
  let escaped = false

  for (const ch of prefix) {
    if (inString) {
      if (escaped) escaped = false
      else if (ch === '\\') escaped = true
      else if (ch === '"') inString = false
      continue
    }
    if (ch === '"') inString = true
    else if (ch === '{') stack.push('}')
    else if (ch === '[') stack.push(']')
    else if (ch === '}' || ch === ']') stack.pop()
  }

  let out = prefix
  if (inString) {
    if (escaped) out = out.slice(0, -1)
    out += '"'
  } else {
    out = out.replace(/[\s,:]+$/, '')
  }
  return out + stack.reverse().join('')
}

// Trailing characters that may need dropping: at most a key name or a
// literal, which are short. Bounded so a malformed document cannot spin.
const MAX_BACKTRACK = 64

export function parsePartialJson(text: string): unknown {
  const trimmed = text.trimStart()
  if (!trimmed) return undefined

  for (let cut = 0; cut <= MAX_BACKTRACK && cut < trimmed.length; cut++) {
    try {
      return JSON.parse(close(trimmed.slice(0, trimmed.length - cut)))
    } catch {
      // Drop one more character and try again.
    }
  }
  return undefined
}
