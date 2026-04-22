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
import { fn, col } from 'sequelize';

async function buildDomainMeta(versionId) {
  const [domains, questionRows] = await Promise.all([
    Domain.findAll({
      attributes: ['id', 'name', 'type', 'max_value'],
      raw: true,
    }),
    Question.findAll({
      attributes: [
        'domain_id',
        [fn('COUNT', col('id')), 'question_count'],
      ],
      where: { version_id: versionId, is_active: true },
      group: ['domain_id'],
      raw: true,
    }),
  ]);

  const domainLookup = {};
  domains.forEach(d => {
    domainLookup[d.id] = d;
  });

  const questionCountMap = {};
  questionRows.forEach(row => {
    questionCountMap[row.domain_id] = parseInt(row.question_count, 10);
  });

  return { domainLookup, questionCountMap };
}

function attachDomainTotals(domainScores, domainLookup, questionCountMap) {
  return domainScores.map(ds => {
    const domain = domainLookup[ds.domain_id];
    const maxValue = domain?.max_value || 5;
    const questionCount = questionCountMap[ds.domain_id] || ds.question_count || 0;
    const totalPossibleScore = questionCount * maxValue;

    return {
      domain_id: ds.domain_id,
      domain: domain?.name || 'Unknown',
      type: domain?.type || 'Unknown',
      raw_score: ds.raw_score,
      normalized_score: ds.normalized_score,
      question_count: questionCount,
      max_value: maxValue,
      total_possible_score: totalPossibleScore,
    };
  });
}

function buildDomainScoreMap(domainScores) {
  const scoreMap = {};
  domainScores.forEach(ds => {
    scoreMap[ds.domain_id] = {
      normalized_score: ds.normalized_score,
      raw_score: ds.raw_score,
      total_possible_score: ds.total_possible_score || null,
    };
  });
  return scoreMap;
}

async function attachCareerBreakdowns(careerScores, domainScoreMap) {
  if (!careerScores.length) return careerScores;

  const careerIds = careerScores.map(c => c.career_id);
  const weightRows = await CareerWeight.findAll({
    where: { career_id: careerIds },
    include: [{
      model: Domain,
      as: 'domain',
      attributes: ['name', 'type', 'description', 'max_value'],
    }],
    raw: true,
    nest: true,
  });

  const breakdownByCareer = {};
  for (const row of weightRows) {
    const careerId = row.career_id;
    const studentDomainScore = domainScoreMap[row.domain_id] || {};
    const normalizedScore = studentDomainScore.normalized_score || 0;
    const contribution = parseFloat((normalizedScore * row.weight).toFixed(4));

    if (!breakdownByCareer[careerId]) breakdownByCareer[careerId] = [];
    breakdownByCareer[careerId].push({
      domain_id: row.domain_id,
      domain: row.domain?.name || 'Unknown',
      type: row.domain?.type || 'Unknown',
      domain_description: row.domain?.description || '',
      weight: parseFloat(row.weight),
      student_normalized_score: parseFloat(normalizedScore.toFixed(4)),
      student_raw_score: studentDomainScore.raw_score ?? null,
      student_total_possible_score: studentDomainScore.total_possible_score ?? null,
      contribution,
    });
  }

  return careerScores.map(career => {
    const breakdown = (breakdownByCareer[career.career_id] || [])
      .sort((a, b) => b.contribution - a.contribution);
    return { ...career, breakdown };
  });
}

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
  const domainScoreMap = buildDomainScoreMap(domainScores);

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
      score += (domainScoreMap[w.domain_id]?.normalized_score || 0) * w.weight;
    }
    return { career_id: parseInt(careerId), career: career.name, description: career.description, score: parseFloat(score.toFixed(4)) };
  });

  careerScores.sort((a, b) => b.score - a.score);
  return attachCareerBreakdowns(careerScores, domainScoreMap);
}

/** Top-two tie by same rounded % as the web UI (Math.round(score * 100)). */
function buildTieNotes(strandRanking, careerSuggestions) {
  const displayPct = (score) => Math.round(Number(score) * 100);
  const strand =
    Array.isArray(strandRanking) &&
    strandRanking.length >= 2 &&
    displayPct(strandRanking[0]?.score) === displayPct(strandRanking[1]?.score);
  const career =
    Array.isArray(careerSuggestions) &&
    careerSuggestions.length >= 2 &&
    displayPct(careerSuggestions[0]?.score) === displayPct(careerSuggestions[1]?.score);
  return { strand, career };
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

    const assessment = await Assessment.findByPk(assessmentId, {
      attributes: ['version_id'],
      raw: true,
    });

    const { domainLookup, questionCountMap } = await buildDomainMeta(assessment.version_id);
    const detailedScores = attachDomainTotals(domainScores, domainLookup, questionCountMap);

    // Read-only aggregations
    const strandRanking = await computeStrandRanking(domainScores);
    const careerMatching = await computeCareerMatching(domainScores);

    const miScores = detailedScores.filter(ds => ds.type === 'MI');
    const riasecScores = detailedScores.filter(ds => ds.type === 'RIASEC');
    miScores.sort((a, b) => b.normalized_score - a.normalized_score);
    riasecScores.sort((a, b) => b.normalized_score - a.normalized_score);

    const careerTop = careerMatching.slice(0, 10);
    return {
      mi_scores: miScores,
      riasec_scores: riasecScores,
      strand_ranking: strandRanking,
      career_suggestions: careerTop,
      tie_notes: buildTieNotes(strandRanking, careerTop),
    };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

// ─────────────────────────────────────────────
// 6. Retrieve stored results
// ─────────────────────────────────────────────
export async function getAssessmentResults(assessmentId) {
  const assessment = await Assessment.findByPk(assessmentId, {
    attributes: ['version_id', 'status'],
    raw: true,
  });
  if (!assessment || assessment.status !== 'completed') return null;

  // Recompute from responses + current question→domain mapping so raw_score,
  // normalized_score, and total_possible_score stay aligned (e.g. after MIPQ edits).
  const domainScores = await computeDomainScores(assessmentId);
  if (domainScores.length === 0) return null;
  const { domainLookup, questionCountMap } = await buildDomainMeta(assessment.version_id);
  const detailedScores = attachDomainTotals(domainScores, domainLookup, questionCountMap);
  const miScores = detailedScores
    .filter(s => s.type === 'MI')
    .sort((a, b) => b.normalized_score - a.normalized_score);
  const riasecScores = detailedScores
    .filter(s => s.type === 'RIASEC')
    .sort((a, b) => b.normalized_score - a.normalized_score);

  const strandRanking = await computeStrandRanking(domainScores);
  const careerMatching = await computeCareerMatching(domainScores);
  const careerTop = careerMatching.slice(0, 10);

  return {
    mi_scores: miScores,
    riasec_scores: riasecScores,
    strand_ranking: strandRanking,
    career_suggestions: careerTop,
    tie_notes: buildTieNotes(strandRanking, careerTop),
  };
}
