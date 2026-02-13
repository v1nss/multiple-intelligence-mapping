import PDFDocument from 'pdfkit';

/**
 * Generate a PDF report buffer for a student's assessment results.
 */
export async function generatePDFReport(studentInfo, results, meta) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const buffers = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const pageWidth = doc.page.width - 100; // minus margins

    // ──────────────────────────────────────────
    // HEADER
    // ──────────────────────────────────────────
    doc
      .fontSize(22)
      .font('Helvetica-Bold')
      .text('Multiple Intelligence Mapping', { align: 'center' });

    doc
      .fontSize(12)
      .font('Helvetica')
      .text('Assessment Report', { align: 'center' });

    doc.moveDown(0.5);
    doc
      .moveTo(50, doc.y)
      .lineTo(50 + pageWidth, doc.y)
      .stroke('#333333');
    doc.moveDown(1);

    // ──────────────────────────────────────────
    // STUDENT INFO
    // ──────────────────────────────────────────
    doc.fontSize(14).font('Helvetica-Bold').text('Student Information');
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica');
    doc.text(`Name: ${studentInfo.first_name} ${studentInfo.last_name}`);
    doc.text(`Email: ${studentInfo.email}`);
    if (studentInfo.gender) doc.text(`Gender: ${studentInfo.gender}`);
    if (studentInfo.birthdate) doc.text(`Birthdate: ${new Date(studentInfo.birthdate).toLocaleDateString()}`);
    doc.text(`Assessment Version: ${meta.version_name}`);
    doc.text(`Completed: ${new Date(meta.completed_at).toLocaleString()}`);

    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(50 + pageWidth, doc.y).stroke('#cccccc');
    doc.moveDown(1);

    // ──────────────────────────────────────────
    // MI SCORES
    // ──────────────────────────────────────────
    doc.fontSize(14).font('Helvetica-Bold').text('Multiple Intelligence Scores');
    doc.moveDown(0.3);

    drawScoreTable(doc, results.mi_scores, pageWidth);
    doc.moveDown(1);

    // Dominant MI
    if (results.mi_scores.length > 0) {
      doc.fontSize(11).font('Helvetica-Bold')
        .text(`Dominant Intelligence: ${results.mi_scores[0].domain}`, { continued: true })
        .font('Helvetica')
        .text(` (${(results.mi_scores[0].normalized_score * 100).toFixed(1)}%)`);
      doc.moveDown(1);
    }

    // ──────────────────────────────────────────
    // RIASEC SCORES
    // ──────────────────────────────────────────
    doc.fontSize(14).font('Helvetica-Bold').text('RIASEC Scores');
    doc.moveDown(0.3);

    drawScoreTable(doc, results.riasec_scores, pageWidth);
    doc.moveDown(1);

    // Top RIASEC
    if (results.riasec_scores.length > 0) {
      const topThree = results.riasec_scores.slice(0, 3).map(r => r.domain[0]).join('');
      doc.fontSize(11).font('Helvetica-Bold')
        .text(`RIASEC Code: ${topThree}`);
      doc.moveDown(1);
    }

    // ──────────────────────────────────────────
    // STRAND RANKING
    // ──────────────────────────────────────────
    checkPageBreak(doc, 200);
    doc.fontSize(14).font('Helvetica-Bold').text('SHS Strand Ranking');
    doc.moveDown(0.3);

    doc.fontSize(10).font('Helvetica');
    results.strand_ranking.forEach((s, i) => {
      const barWidth = s.score * (pageWidth - 150);
      const y = doc.y;
      doc.text(`${i + 1}. ${s.strand}`, 50, y, { width: 120 });
      doc.rect(170, y, barWidth, 12).fill(getColor(i));
      doc.fillColor('#000000').text(`${(s.score * 100).toFixed(1)}%`, 170 + barWidth + 5, y);
      doc.moveDown(0.5);
    });

    doc.moveDown(1);

    // ──────────────────────────────────────────
    // CAREER RECOMMENDATIONS
    // ──────────────────────────────────────────
    checkPageBreak(doc, 250);
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#000000').text('Career Recommendations');
    doc.moveDown(0.3);

    doc.fontSize(10).font('Helvetica');
    results.career_suggestions.forEach((c, i) => {
      checkPageBreak(doc, 40);
      doc.font('Helvetica-Bold').text(`${i + 1}. ${c.career}`, { continued: true });
      doc.font('Helvetica').text(` — Match: ${(c.score * 100).toFixed(1)}%`);
      if (c.description) {
        doc.fontSize(9).fillColor('#555555').text(`   ${c.description}`);
        doc.fillColor('#000000').fontSize(10);
      }
      doc.moveDown(0.3);
    });

    // ──────────────────────────────────────────
    // FOOTER
    // ──────────────────────────────────────────
    doc.moveDown(2);
    doc.moveTo(50, doc.y).lineTo(50 + pageWidth, doc.y).stroke('#cccccc');
    doc.moveDown(0.5);
    doc.fontSize(8).fillColor('#999999').font('Helvetica')
      .text(`Generated on ${new Date().toLocaleString()} | MIM System`, { align: 'center' });

    doc.end();
  });
}

function drawScoreTable(doc, scores, pageWidth) {
  doc.fontSize(10).font('Helvetica');
  scores.forEach(s => {
    const y = doc.y;
    const barWidth = s.normalized_score * (pageWidth - 200);
    doc.text(s.domain, 50, y, { width: 150 });
    doc.rect(200, y, barWidth, 12).fill(getDomainColor(s.domain));
    doc.fillColor('#000000').text(
      `${s.raw_score} (${(s.normalized_score * 100).toFixed(1)}%)`,
      200 + barWidth + 5,
      y
    );
    doc.moveDown(0.5);
  });
}

function checkPageBreak(doc, requiredSpace) {
  if (doc.y + requiredSpace > doc.page.height - 80) {
    doc.addPage();
  }
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
