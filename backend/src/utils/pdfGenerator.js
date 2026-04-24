import PDFDocument from 'pdfkit';

/**
 * Layout constants — single source of truth so columns stay aligned and
 * page-break math matches the drawable area (PDFKit uses points, 72/in).
 */
const LAYOUT = {
  /** Horizontal inset for body content (matches PDFDocument margin option). */
  marginX: 50,
  /** Keep this much space free at the bottom before starting a new page. */
  bottomReserve: 72,
  /** Typography scale — use these sizes everywhere for a consistent report. */
  font: {
    title: 22,
    subtitle: 12,
    section: 14,
    body: 10,
    callout: 11,
    meta: 9,
    footer: 8,
  },
  /** Score / strand bar geometry */
  barHeight: 12,
  /** Gap between stacked rows (tables, strand list, careers). */
  rowGap: 6,
};

/**
 * Generate a PDF report buffer for a student's assessment results.
 * Uses PDFKit programmatic drawing (not HTML/CSS) — layout is controlled by
 * explicit coordinates and measured text heights.
 */
export async function generatePDFReport(studentInfo, results, meta) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: LAYOUT.marginX });
    const buffers = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const pageWidth = doc.page.width - LAYOUT.marginX * 2;

    // ── Header ───────────────────────────────────────────────────────────
    doc
      .fontSize(LAYOUT.font.title)
      .font('Helvetica-Bold')
      .text('Multiple Intelligence Mapping', { align: 'center' });

    doc
      .fontSize(LAYOUT.font.subtitle)
      .font('Helvetica')
      .text('Assessment Report', { align: 'center' });

    doc.moveDown(0.5);
    doc
      .moveTo(LAYOUT.marginX, doc.y)
      .lineTo(LAYOUT.marginX + pageWidth, doc.y)
      .stroke('#333333');
    doc.moveDown(1);

    // ── Student info ─────────────────────────────────────────────────────
    doc.fontSize(LAYOUT.font.section).font('Helvetica-Bold').text('Student Information');
    doc.moveDown(0.35);
    doc.fontSize(LAYOUT.font.body).font('Helvetica');
    doc.text(`Name: ${studentInfo.first_name} ${studentInfo.last_name}`);
    doc.text(`Email: ${studentInfo.email}`);
    if (studentInfo.gender) doc.text(`Gender: ${studentInfo.gender}`);
    if (studentInfo.birthdate) doc.text(`Birthdate: ${new Date(studentInfo.birthdate).toLocaleDateString()}`);
    doc.text(`Assessment Version: ${meta.version_name}`);
    doc.text(`Completed: ${new Date(meta.completed_at).toLocaleString()}`);

    doc.moveDown(1);
    doc.moveTo(LAYOUT.marginX, doc.y).lineTo(LAYOUT.marginX + pageWidth, doc.y).stroke('#cccccc');
    doc.moveDown(1);

    // ── MI scores ────────────────────────────────────────────────────────
    doc.fontSize(LAYOUT.font.section).font('Helvetica-Bold').text('Multiple Intelligence Scores');
    doc.moveDown(0.35);
    drawScoreTable(doc, results.mi_scores, pageWidth);
    doc.moveDown(1);

    if (results.mi_scores.length > 0) {
      doc.fontSize(LAYOUT.font.callout).font('Helvetica-Bold')
        .text(`Dominant Intelligence: ${results.mi_scores[0].domain}`, { continued: true })
        .font('Helvetica')
        .text(` (${(results.mi_scores[0].normalized_score * 100).toFixed(1)}%)`);
      doc.moveDown(1);
    }

    // ── RIASEC ─────────────────────────────────────────────────────────────
    doc.fontSize(LAYOUT.font.section).font('Helvetica-Bold').text('RIASEC Scores');
    doc.moveDown(0.35);
    drawScoreTable(doc, results.riasec_scores, pageWidth);
    doc.moveDown(1);

    if (results.riasec_scores.length > 0) {
      const topThree = results.riasec_scores.slice(0, 3).map(r => r.domain[0]).join('');
      doc.fontSize(LAYOUT.font.callout).font('Helvetica-Bold').text(`RIASEC Code: ${topThree}`);
      doc.moveDown(1);
    }

    // ── Strand ranking (bars + labels — needs per-row page breaks) ───────
    ensureVerticalSpace(doc, LAYOUT.font.section + LAYOUT.rowGap * 4);
    doc.fontSize(LAYOUT.font.section).font('Helvetica-Bold').text('SHS Strand Ranking');
    doc.moveDown(0.35);
    drawStrandRanking(doc, results.strand_ranking, pageWidth);

    if (results.tie_notes?.strand || results.tie_notes?.career) {
      doc.moveDown(0.5);
      const bits = [];
      if (results.tie_notes.strand) bits.push('top two SHS strands');
      if (results.tie_notes.career) bits.push('top two career matches');
      const noteText =
        `Note: Your ${bits.join(' and ')} show the same rounded match percentage; consider exploring each option and retaking later if you want a clearer ranking.`;
      drawWrappedCallout(doc, noteText, pageWidth, '#92400e', LAYOUT.font.meta);
    }

    doc.moveDown(1);

    // ── Careers (descriptions can be long — measure before drawing) ──────
    ensureVerticalSpace(doc, LAYOUT.font.section + LAYOUT.rowGap * 6);
    doc.fontSize(LAYOUT.font.section).font('Helvetica-Bold').fillColor('#000000').text('Career Recommendations');
    doc.moveDown(0.35);
    drawCareerSuggestions(doc, results.career_suggestions, pageWidth);

    // ── Footer ─────────────────────────────────────────────────────────────
    ensureVerticalSpace(doc, 36);
    doc.moveDown(1.25);
    doc.moveTo(LAYOUT.marginX, doc.y).lineTo(LAYOUT.marginX + pageWidth, doc.y).stroke('#cccccc');
    doc.moveDown(0.5);
    doc.fontSize(LAYOUT.font.footer).fillColor('#999999').font('Helvetica')
      .text(`Generated on ${new Date().toLocaleString()} | MIM System`, { align: 'center' });

    doc.end();
  });
}

/**
 * If the next block would cross the safe bottom, start a new page.
 * Resets doc.x to the left margin after a break so wrapped text measures correctly.
 */
function ensureVerticalSpace(doc, minHeight) {
  const limit = doc.page.height - LAYOUT.bottomReserve;
  if (doc.y + minHeight > limit) {
    doc.addPage();
    doc.x = LAYOUT.marginX;
  }
}

/**
 * Estimates total height of a wrapped paragraph at the current font settings.
 * Sets doc.x to the content margin before measuring (PDFKit wraps using current x).
 */
function measureWrappedHeight(doc, text, width) {
  const savedX = doc.x;
  const savedY = doc.y;
  doc.x = LAYOUT.marginX;
  doc.y = savedY;
  const h = doc.heightOfString(text, { width });
  doc.x = savedX;
  doc.y = savedY;
  return h;
}

function drawWrappedCallout(doc, text, pageWidth, color, fontSize) {
  doc.fontSize(fontSize).font('Helvetica').fillColor(color);
  const h = measureWrappedHeight(doc, text, pageWidth);
  ensureVerticalSpace(doc, h + LAYOUT.rowGap);
  doc.text(text, LAYOUT.marginX, doc.y, { width: pageWidth });
  doc.fillColor('#000000').fontSize(LAYOUT.font.body).font('Helvetica');
}

/**
 * Score rows: domain label (may wrap), bar, raw/normalized scores.
 * Previously each row used doc.y + a fixed 12px bar but only moveDown(0.5),
 * so wrapped domains overlapped the next row. Row height is now max(bar, label).
 */
function drawScoreTable(doc, scores, pageWidth) {
  const domainColWidth = 142;
  const barX = 200;
  const scoreColumnReserve = 92;
  const maxBarWidth = Math.max(
    24,
    LAYOUT.marginX + pageWidth - barX - scoreColumnReserve,
  );

  doc.fontSize(LAYOUT.font.body).font('Helvetica');

  scores.forEach(s => {
    doc.fontSize(LAYOUT.font.body).font('Helvetica').fillColor('#000000');
    doc.x = LAYOUT.marginX;
    const domainH = doc.heightOfString(String(s.domain), { width: domainColWidth });
    const rowHeight = Math.max(LAYOUT.barHeight + 6, domainH + 4);

    ensureVerticalSpace(doc, rowHeight + LAYOUT.rowGap);

    const y = doc.y;
    const barWidth = Math.max(
      2,
      Math.min(maxBarWidth, s.normalized_score * maxBarWidth),
    );

    doc.text(String(s.domain), LAYOUT.marginX, y, { width: domainColWidth, lineGap: 1 });

    const barY = y + (rowHeight - LAYOUT.barHeight) / 2;
    doc.rect(barX, barY, barWidth, LAYOUT.barHeight).fill(getDomainColor(s.domain));

    const scoreLabel = `${s.raw_score} (${(s.normalized_score * 100).toFixed(1)}%)`;
    doc.fillColor('#000000').font('Helvetica');
    const lineH = doc.currentLineHeight(true);
    const scoreY = y + (rowHeight - lineH) / 2;
    doc.text(scoreLabel, barX + barWidth + 6, scoreY, { width: scoreColumnReserve, lineBreak: false });

    doc.y = y + rowHeight + LAYOUT.rowGap;
    doc.x = LAYOUT.marginX;
  });
}

/**
 * Strand list uses the same wrapping + explicit row advance pattern as the score table.
 */
function drawStrandRanking(doc, strandRanking, pageWidth) {
  const labelWidth = 118;
  const barX = 178;
  const pctReserve = 56;
  const maxBarWidth = Math.max(
    20,
    LAYOUT.marginX + pageWidth - barX - pctReserve,
  );

  doc.fontSize(LAYOUT.font.body).font('Helvetica').fillColor('#000000');

  strandRanking.forEach((s, i) => {
    const rankLabel = `${i + 1}. ${s.strand}`;
    doc.x = LAYOUT.marginX;
    const domainH = doc.heightOfString(rankLabel, { width: labelWidth });
    const rowHeight = Math.max(LAYOUT.barHeight + 6, domainH + 4);

    ensureVerticalSpace(doc, rowHeight + LAYOUT.rowGap);

    const y = doc.y;
    const barWidth = Math.max(2, Math.min(maxBarWidth, s.score * maxBarWidth));

    doc.text(rankLabel, LAYOUT.marginX, y, { width: labelWidth, lineGap: 1 });

    const barY = y + (rowHeight - LAYOUT.barHeight) / 2;
    doc.rect(barX, barY, barWidth, LAYOUT.barHeight).fill(getColor(i));

    const pct = `${(s.score * 100).toFixed(1)}%`;
    doc.fillColor('#000000').font('Helvetica');
    const lineH = doc.currentLineHeight(true);
    const pctY = y + (rowHeight - lineH) / 2;
    doc.text(pct, barX + barWidth + 6, pctY, { lineBreak: false });

    doc.y = y + rowHeight + LAYOUT.rowGap;
    doc.x = LAYOUT.marginX;
  });
}

/**
 * Each career: title + match on one flow, optional description as a measured block.
 * Fixed 40pt page-break reserve was too small for multi-line descriptions.
 */
function drawCareerSuggestions(doc, careers, pageWidth) {
  const descIndent = LAYOUT.marginX + 12;
  const descWidth = pageWidth - 12;

  careers.forEach((c, i) => {
    doc.fontSize(LAYOUT.font.body).font('Helvetica-Bold').fillColor('#000000');
    const titleLine = `${i + 1}. ${c.career}`;
    const matchFragment = ` — Match: ${(c.score * 100).toFixed(1)}%`;
    doc.x = LAYOUT.marginX;
    const titleBlockH = doc.heightOfString(`${titleLine}${matchFragment}`, { width: pageWidth });

    let estimated = titleBlockH + LAYOUT.rowGap;
    if (c.description) {
      doc.font('Helvetica').fontSize(LAYOUT.font.meta).fillColor('#555555');
      estimated += measureWrappedHeight(doc, c.description, descWidth) + 6;
    }
    doc.fontSize(LAYOUT.font.body).fillColor('#000000').font('Helvetica-Bold');

    ensureVerticalSpace(doc, estimated + LAYOUT.rowGap);

    doc.font('Helvetica-Bold').fontSize(LAYOUT.font.body).fillColor('#000000')
      .text(titleLine, LAYOUT.marginX, doc.y, { width: pageWidth, continued: true });
    doc.font('Helvetica').text(matchFragment);

    if (c.description) {
      doc.moveDown(0.2);
      doc.fontSize(LAYOUT.font.meta).fillColor('#555555').font('Helvetica')
        .text(c.description, descIndent, doc.y, { width: descWidth, align: 'left' });
      doc.fillColor('#000000').fontSize(LAYOUT.font.body);
    }

    doc.moveDown(0.45);
  });
}

const COLORS = ['#4F46E5', '#0891B2', '#059669', '#D97706', '#DC2626', '#7C3AED', '#DB2777'];

function getColor(index) {
  return COLORS[index % COLORS.length];
}

function getDomainColor(name) {
  const map = {
    'Linguistic': '#4F46E5',
    'Logical-Mathematical': '#0891B2',
    'Musical': '#7C3AED',
    'Bodily-Kinesthetic': '#DC2626',
    'Spatial': '#059669',
    'Interpersonal': '#D97706',
    'Intrapersonal': '#DB2777',
    'Naturalistic': '#16A34A',
    'Existential': '#6366F1',
    'Realistic': '#B45309',
    'Investigative': '#0E7490',
    'Artistic': '#A21CAF',
    'Social': '#15803D',
    'Enterprising': '#B91C1C',
    'Conventional': '#4338CA',
  };
  return map[name] || '#6B7280';
}
