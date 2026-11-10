const PDFDocument = require('pdfkit');

/**
 * Convert JSON array to CSV string safely
 * @param {Array<Object>} data
 * @param {Array<{ label: string, key: string }>} fields
 * @returns {string} CSV formatted content
 */
const generateCSV = (data, fields) => {
  if (!data || data.length === 0) {
    return fields.map((f) => `"${f.label}"`).join(',') + '\n';
  }

  const header = fields.map((f) => `"${f.label.replace(/"/g, '""')}"`).join(',');

  const rows = data.map((row) => {
    return fields
      .map((f) => {
        let val = row[f.key];
        if (val === undefined || val === null) val = '';
        if (val instanceof Date) val = val.toISOString().split('T')[0];
        val = String(val).replace(/"/g, '""');
        return `"${val}"`;
      })
      .join(',');
  });

  return [header, ...rows].join('\n');
};

/**
 * Generate a PDF document stream for library reports
 * @param {Object} options
 * @param {string} options.title - Report Title
 * @param {string} options.subtitle - Secondary description or date range
 * @param {Array<{ label: string, key: string, width?: number }>} options.columns - Table headers
 * @param {Array<Object>} options.data - Rows
 * @param {Array<string>} [options.summaryNotes] - Key metric callouts
 * @returns {PDFDocument} - PDFKit stream
 */
const generatePDFReport = ({ title, subtitle, columns, data, summaryNotes = [] }) => {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  // Header Banner
  doc
    .fillColor('#0f172a')
    .fontSize(20)
    .font('Helvetica-Bold')
    .text('CENTRAL LIBRARY MANAGEMENT SYSTEM', 40, 40);

  doc
    .fillColor('#10b981')
    .fontSize(14)
    .font('Helvetica-Bold')
    .text(title.toUpperCase(), 40, 68);

  doc
    .fillColor('#64748b')
    .fontSize(10)
    .font('Helvetica')
    .text(subtitle || `Report Generated: ${new Date().toLocaleString()}`, 40, 88);

  // Divider
  doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(40, 105).lineTo(555, 105).stroke();

  let y = 120;

  // Summary callouts if present
  if (summaryNotes && summaryNotes.length > 0) {
    doc.fillColor('#1e293b').fontSize(10).font('Helvetica-Bold').text('Executive Summary:', 40, y);
    y += 16;
    summaryNotes.forEach((note) => {
      doc.fillColor('#475569').fontSize(9).font('Helvetica').text(`• ${note}`, 50, y);
      y += 14;
    });
    y += 10;
  }

  // Calculate dynamic column widths
  const availableWidth = 515;
  const colCount = columns.length;
  const defaultWidth = Math.floor(availableWidth / colCount);

  // Table Header Background
  doc.rect(40, y, availableWidth, 22).fill('#f1f5f9');

  // Table Header Text
  let x = 45;
  columns.forEach((col) => {
    const colWidth = col.width || defaultWidth;
    doc
      .fillColor('#0f172a')
      .fontSize(9)
      .font('Helvetica-Bold')
      .text(col.label, x, y + 6, { width: colWidth - 8, truncate: true });
    x += colWidth;
  });

  y += 24;

  // Render Rows
  data.forEach((row, index) => {
    // Add page if near bottom
    if (y > 750) {
      doc.addPage();
      y = 40;
    }

    // Alternating row background
    if (index % 2 === 1) {
      doc.rect(40, y, availableWidth, 20).fill('#f8fafc');
    }

    x = 45;
    columns.forEach((col) => {
      const colWidth = col.width || defaultWidth;
      let cellValue = row[col.key];
      if (cellValue === undefined || cellValue === null) cellValue = '-';
      if (cellValue instanceof Date) cellValue = cellValue.toISOString().split('T')[0];

      doc
        .fillColor('#334155')
        .fontSize(8.5)
        .font('Helvetica')
        .text(String(cellValue), x, y + 5, { width: colWidth - 8, truncate: true });

      x += colWidth;
    });

    y += 20;
  });

  // Footer / Page numbers
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);
    doc
      .fillColor('#94a3b8')
      .fontSize(8)
      .text(
        `Central Library Automated Report • Page ${i + 1} of ${pages.count}`,
        40,
        800,
        { align: 'center', width: 515 }
      );
  }

  return doc;
};

module.exports = { generateCSV, generatePDFReport };
