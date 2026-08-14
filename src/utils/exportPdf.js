import { datedFilename } from './exportCsv.js'

export async function buildPdfReport({
  reportTitle,
  columns,
  rows,
  filterSummary,
  orientation = 'portrait',
  generatedAt = new Date(),
}) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])
  const document = new jsPDF({ orientation, unit: 'pt', format: 'a4' })

  document.setProperties({
    title: `Migrant Health Support Hub - ${reportTitle}`,
    subject: 'Filtered administration data export',
    author: 'Migrant Health Support Hub',
  })
  document.setFont('helvetica', 'bold')
  document.setFontSize(16)
  document.text('Migrant Health Support Hub', 40, 42)
  document.setFontSize(13)
  document.text(reportTitle, 40, 62)
  document.setFont('helvetica', 'normal')
  document.setFontSize(9)
  document.text(`Generated: ${generatedAt.toLocaleString()}`, 40, 80)
  const summaryLines = document.splitTextToSize(`Filters: ${filterSummary}`, orientation === 'landscape' ? 750 : 510)
  document.text(summaryLines, 40, 96)

  autoTable(document, {
    startY: 108 + Math.max(0, summaryLines.length - 1) * 10,
    head: [columns.map((column) => column.header)],
    body: rows.map((row) => columns.map((column) => String(column.value(row) ?? ''))),
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 4,
      overflow: 'linebreak',
      textColor: [31, 41, 51],
    },
    headStyles: {
      fillColor: [15, 118, 110],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: { fillColor: [247, 250, 248] },
    margin: { top: 40, right: 32, bottom: 36, left: 32 },
    didDrawPage: ({ pageNumber }) => {
      const pageHeight = document.internal.pageSize.getHeight()
      document.setFontSize(8)
      document.setTextColor(93, 107, 117)
      document.text(`Page ${pageNumber}`, document.internal.pageSize.getWidth() - 64, pageHeight - 18)
    },
  })

  return document
}

export async function downloadPdfReport(options, filenamePrefix) {
  const document = await buildPdfReport(options)
  document.save(datedFilename(filenamePrefix, 'pdf'))
}
