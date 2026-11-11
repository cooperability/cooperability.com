// Wraps a JPEG in a one-page PDF. PDF readers decode JPEG natively
// (DCTDecode), so the image bytes go in untouched and no PDF library is needed.
export function jpegToPdf(
  jpeg: Uint8Array,
  width: number,
  height: number,
  pageWidth = 540
) {
  const pageHeight = Math.round((pageWidth * height) / width)
  // Every non-image byte here is ASCII.
  const ascii = (str: string) => Uint8Array.from(str, (c) => c.charCodeAt(0))
  const parts: Uint8Array[] = []
  const offsets: number[] = []
  let length = 0
  const push = (part: string | Uint8Array) => {
    const bytes = typeof part === 'string' ? ascii(part) : part
    parts.push(bytes)
    length += bytes.length
  }
  const obj = (body: string, stream?: Uint8Array) => {
    offsets.push(length)
    push(`${offsets.length} 0 obj\n${body}\n`)
    if (stream) {
      push('stream\n')
      push(stream)
      push('\nendstream\n')
    }
    push('endobj\n')
  }

  const content = ascii(`q ${pageWidth} 0 0 ${pageHeight} 0 0 cm /Im0 Do Q`)
  push('%PDF-1.4\n')
  obj('<< /Type /Catalog /Pages 2 0 R >>')
  obj('<< /Type /Pages /Kids [3 0 R] /Count 1 >>')
  obj(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] ` +
      '/Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>'
  )
  obj(
    `<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} ` +
      '/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode ' +
      `/Length ${jpeg.length} >>`,
    jpeg
  )
  obj(`<< /Length ${content.length} >>`, content)

  const xref = length
  push(
    `xref\n0 ${offsets.length + 1}\n0000000000 65535 f \n` +
      offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('') +
      `trailer\n<< /Size ${offsets.length + 1} /Root 1 0 R >>\n` +
      `startxref\n${xref}\n%%EOF`
  )

  const out = new Uint8Array(length)
  let at = 0
  for (const part of parts) {
    out.set(part, at)
    at += part.length
  }
  return out
}
