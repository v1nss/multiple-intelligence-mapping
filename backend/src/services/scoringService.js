import {
  sequelize,
  Response,
  Question,
  Domain,
  ComputedScore,
  Assessment,
  Strand,
  StrandWeight,
  Career,
  CareerWeight,
} from '../models/index.js';
import { fn, col, literal } from 'sequelize';

// ─────────────────────────────────────────────
// 1. Compute raw and normalized domain scores
// ─────────────────────────────────────────────
export async function computeDomainScores(assessmentId, transaction = null) {
  const opts = transaction ? { transaction } : {};

  const assessment = await Assessment.findByPk(assessmentId, opts);
  const versionId = assessment.version_id;

  // Look up max_value per domain
  const allDomains = await Domain.findAll({ raw: true, ...opts });
  const domainMaxMap = {};
  allDomains.forEach(d => { domainMaxMap[d.id] = d.max_value || 5; });

  const rawScores = await Response.findAll({
    attributes: [
      [col('question.domain_id'), 'domain_id'],
      [fn('SUM', col('value')), 'raw_score'],
      [fn('COUNT', col('Response.id')), 'question_count'],
    ],
    include: [{
      model: Question,
      as: 'question',
      attributes: [],
      where: { version_id: versionId },
    }],
    where: { assessment_id: assessmentId },
    group: ['question.domain_id'],
    raw: true,
    ...opts,
  });

  return rawScores.map(row => {
    const maxVal = domainMaxMap[row.domain_id] || 5;
    return {
      domain_id: row.domain_id,
      raw_score: parseFloat(row.raw_score),
      normalized_score: parseFloat((row.raw_score / (row.question_count * maxVal)).toFixed(4)),
      question_count: parseInt(row.question_count),
    };
  });
}

// ─────────────────────────────────────────────
// 2. Store computed scores
// ─────────────────────────────────────────────
export async function storeComputedScores(assessmentId, domainScores, transaction = null) {
  const opts = transaction ? { transaction } : {};

  await ComputedScore.destroy({ where: { assessment_id: assessmentId }, ...opts });

  await ComputedScore.bulkCreate(
    domainScores.map(s => ({
      assessment_id: assessmentId,
      domain_id: s.domain_id,
      raw_score: s.raw_score,
      normalized_score: s.normalized_score,
    })),
    opts,
  );
}

// ─────────────────────────────────────────────
// 3. Compute strand rankings
// ─────────────────────────────────────────────
export async function computeStrandRanking(domainScores) {
  const scoreMap = {};
  domainScores.forEach(ds => { scoreMap[ds.domain_id] = ds.normalized_score; });

  const weights = await StrandWeight.findAll({
    include: [{ model: Strand, as: 'strand', attributes: ['name'] }],
    raw: true,
    nest: true,
  });

  const strandMap = {};
  for (const w of weights) {
    const sid = w.strand_id;
    if (!strandMap[sid]) strandMap[sid] = { name: w.strand.name, weights: [] };
    strandMap[sid].weights.push({ domain_id: w.domain_id, weight: w.weight });
  }

  const strandScores = Object.entries(strandMap).map(([strandId, strand]) => {
    let score = 0;
    for (const w of strand.weights) {
      score += (scoreMap[w.domain_id] || 0) * w.weight;
    }
    return { strand_id: parseInt(strandId), strand: strand.name, score: parseFloat(score.toFixed(4)) };
  });

  strandScores.sort((a, b) => b.score - a.score);
  return strandScores;
}

// ─────────────────────────────────────────────
// 4. Compute career matching
// ─────────────────────────────────────────────
export async function computeCareerMatching(domainScores) {
  const scoreMap = {};
  domainScores.forEach(ds => { scoreMap[ds.domain_id] = ds.normalized_score; });

  const weights = await CareerWeight.findAll({
    include: [{ model: Career, as: 'career', attributes: ['name', 'description'] }],
    raw: true,
    nest: true,
  });

  const careerMap = {};
  for (const w of weights) {
    const cid = w.career_id;
    if (!careerMap[cid]) careerMap[cid] = { name: w.career.name, description: w.career.description, weights: [] };
    careerMap[cid].weights.push({ domain_id: w.domain_id, weight: w.weight });
  }

  const careerScores = Object.entries(careerMap).map(([careerId, career]) => {
    let score = 0;
    for (const w of career.weights) {
      score += (scoreMap[w.domain_id] || 0) * w.weight;
    }
    return { career_id: parseInt(careerId), career: career.name, description: career.description, score: parseFloat(score.toFixed(4)) };
  });

  careerScores.sort((a, b) => b.score - a.score);
  return careerScores;
}

// ─────────────────────────────────────────────
// 5. Full scoring pipeline (transactional)
// ─────────────────────────────────────────────
export async function runFullScoringPipeline(assessmentId) {
  const transaction = await sequelize.transaction();
  try {
    const domainScores = await computeDomainScores(assessmentId, transaction);
    await storeComputedScores(assessmentId, domainScores, transaction);

    await Assessment.update(
      { status: 'completed', completed_at: new Date() },
      { where: { id: assessmentId }, transaction },
    );

    await transaction.commit();

    // Read-only aggregations
    const strandRanking = await computeStrandRanking(domainScores);
    const careerMatching = await computeCareerMatching(domainScores);

    // Separate MI vs RIASEC
    const allDomains = await Domain.findAll({ raw: true });
    const domainLookup = {};
    allDomains.forEach(d => { domainLookup[d.id] = d; });

    const miScores = [];
    const riasecScores = [];
    for (const ds of domainScores) {
      const d = domainLookup[ds.domain_id];
      const entry = { domain_id: ds.domain_id, domain: d?.name || 'Unknown', raw_score: ds.raw_score, normalized_score: ds.normalized_score };
      if (d?.type === 'MI') miScores.push(entry); else riasecScores.push(entry);
    }
    miScores.sort((a, b) => b.normalized_score - a.normalized_score);
    riasecScores.sort((a, b) => b.normalized_score - a.normalized_score);

    return { mi_scores: miScores, riasec_scores: riasecScores, strand_ranking: strandRanking, career_suggestions: careerMatching.slice(0, 10) };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

// ─────────────────────────────────────────────
// 6. Retrieve stored results
// ─────────────────────────────────────────────
export async function getAssessmentResults(assessmentId) {
  const scores = await ComputedScore.findAll({
    where: { assessment_id: assessmentId },
    include: [{ model: Domain, as: 'domain', attributes: ['name', 'type'] }],
  });

  if (scores.length === 0) return null;

  const domainScores = scores.map(s => ({
    domain_id: s.domain_id,
    raw_score: parseFloat(s.raw_score),
    normalized_score: parseFloat(s.normalized_score),
  }));

  const miScores = scores
    .filter(s => s.domain.type === 'MI')
    .map(s => ({ domain_id: s.domain_id, domain: s.domain.name, raw_score: parseFloat(s.raw_score), normalized_score: parseFloat(s.normalized_score) }))
    .sort((a, b) => b.normalized_score - a.normalized_score);

  const riasecScores = scores
    .filter(s => s.domain.type === 'RIASEC')
    .map(s => ({ domain_id: s.domain_id, domain: s.domain.name, raw_score: parseFloat(s.raw_score), normalized_score: parseFloat(s.normalized_score) }))
    .sort((a, b) => b.normalized_score - a.normalized_score);

  const strandRanking = await computeStrandRanking(domainScores);
  const careerMatching = await computeCareerMatching(domainScores);

  return { mi_scores: miScores, riasec_scores: riasecScores, strand_ranking: strandRanking, career_suggestions: careerMatching.slice(0, 10) };
}
