export function safeSpreadsheetText(value) {
  const text = String(value ?? '')
  return /^[=+\-@\t\r\n]/.test(text) ? `'${text}` : text
}

export function csvCell(value) {
  const safeValue = safeSpreadsheetText(value)
  return `"${safeValue.replaceAll('"', '""')}"`
}

export function buildCsv(columns, rows) {
  const header = columns.map((column) => csvCell(column.header)).join(',')
  const body = rows.map((row) =>
    columns.map((column) => csvCell(column.value(row))).join(','),
  )

  return `\uFEFF${[header, ...body].join('\r\n')}`
}

export function datedFilename(prefix, extension, date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${prefix}-${year}-${month}-${day}.${extension}`
}

export function downloadCsv(columns, rows, prefix) {
  const blob = new Blob([buildCsv(columns, rows)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = datedFilename(prefix, 'csv')
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
