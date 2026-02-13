import { Op, fn, col, literal } from 'sequelize';
import {
  User,
  Assessment,
  AssessmentVersion,
  ComputedScore,
  Domain,
  Question,
  Strand,
  StrandWeight,
} from '../models/index.js';

/**
 * GET /admin/users
 */
export const getUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    const where = role ? { role } : {};

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password_hash'] },
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    res.json({ users: rows, total: count, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error('Admin getUsers error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * GET /admin/analytics
 */
export const getAnalytics = async (req, res) => {
  try {
    const totalStudents = await User.count({ where: { role: 'student' } });
    const totalAssessments = await Assessment.count();
    const completedAssessments = await Assessment.count({ where: { status: 'completed' } });
    const participationRate = totalStudents > 0 ? parseFloat(((completedAssessments / totalStudents) * 100).toFixed(1)) : 0;

    // Most common dominant MI
    const dominantMI = await ComputedScore.findAll({
      attributes: [
        'assessment_id',
        [fn('MAX', col('normalized_score')), 'max_score'],
      ],
      group: ['assessment_id'],
      raw: true,
    });

    // For each assessment, find the domain with the highest MI score
    const dominantCounts = {};
    for (const row of dominantMI) {
      const topScore = await ComputedScore.findOne({
        where: { assessment_id: row.assessment_id, normalized_score: row.max_score },
        include: [{ model: Domain, as: 'domain', where: { type: 'MI' }, attributes: ['name'] }],
      });
      if (topScore?.domain) {
        const name = topScore.domain.name;
        dominantCounts[name] = (dominantCounts[name] || 0) + 1;
      }
    }
    const dominantMIResult = Object.entries(dominantCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Strand distribution
    const strandDistribution = [];
    // Simplified: compute top strand for each completed assessment
    const completedIds = await Assessment.findAll({
      where: { status: 'completed' },
      attributes: ['id'],
      raw: true,
    });

    const strandCounts = {};
    const allWeights = await StrandWeight.findAll({ include: [{ model: Strand, as: 'strand', attributes: ['name'] }], raw: true, nest: true });

    for (const { id } of completedIds) {
      const scores = await ComputedScore.findAll({ where: { assessment_id: id }, raw: true });
      const scoreMap = {};
      scores.forEach(s => { scoreMap[s.domain_id] = parseFloat(s.normalized_score); });

      let bestStrand = null;
      let bestScore = -1;
      const strandScoreMap = {};

      for (const w of allWeights) {
        const sid = w.strand_id;
        if (!strandScoreMap[sid]) strandScoreMap[sid] = { name: w.strand.name, score: 0 };
        strandScoreMap[sid].score += (scoreMap[w.domain_id] || 0) * w.weight;
      }

      for (const [, s] of Object.entries(strandScoreMap)) {
        if (s.score > bestScore) { bestScore = s.score; bestStrand = s.name; }
      }
      if (bestStrand) strandCounts[bestStrand] = (strandCounts[bestStrand] || 0) + 1;
    }

    const strandDistResult = Object.entries(strandCounts)
      .map(([strand, count]) => ({ strand, count }))
      .sort((a, b) => b.count - a.count);

    // Average MI scores
    const avgMIScores = await ComputedScore.findAll({
      attributes: [[fn('AVG', col('normalized_score')), 'avg_score']],
      include: [{ model: Domain, as: 'domain', where: { type: 'MI' }, attributes: ['name'] }],
      group: ['domain.id', 'domain.name'],
      raw: true,
      nest: true,
    });

    // Average RIASEC scores
    const avgRIASECScores = await ComputedScore.findAll({
      attributes: [[fn('AVG', col('normalized_score')), 'avg_score']],
      include: [{ model: Domain, as: 'domain', where: { type: 'RIASEC' }, attributes: ['name'] }],
      group: ['domain.id', 'domain.name'],
      raw: true,
      nest: true,
    });

    // Gender-based trends
    // Use attributes: [] on User to prevent Sequelize from auto-adding the PK,
    // and reference gender via col() in the main attributes instead.
    const genderTrends = await ComputedScore.findAll({
      attributes: [
        [fn('AVG', col('ComputedScore.normalized_score')), 'avg_score'],
        [col('assessment->user.gender'), 'gender'],
      ],
      include: [
        { model: Domain, as: 'domain', attributes: ['name', 'type'] },
        {
          model: Assessment, as: 'assessment', attributes: [],
          include: [{
            model: User, as: 'user', attributes: [],
            where: { gender: { [Op.ne]: null } },
          }],
        },
      ],
      group: ['domain.id', 'domain.name', 'domain.type', 'assessment->user.gender'],
      raw: true,
      nest: true,
      subQuery: false,
    });

    // Recent assessments
    const recentAssessments = await Assessment.findAll({
      include: [{ model: User, as: 'user', attributes: ['first_name', 'last_name', 'email'] }],
      order: [['started_at', 'DESC']],
      limit: 20,
    });

    res.json({
      summary: { total_students: totalStudents, total_assessments: totalAssessments, completed_assessments: completedAssessments, participation_rate: participationRate },
      dominant_mi: dominantMIResult,
      strand_distribution: strandDistResult,
      avg_mi_scores: avgMIScores.map(r => ({ name: r.domain.name, avg_score: parseFloat(parseFloat(r.avg_score).toFixed(4)) })),
      avg_riasec_scores: avgRIASECScores.map(r => ({ name: r.domain.name, avg_score: parseFloat(parseFloat(r.avg_score).toFixed(4)) })),
      gender_trends: genderTrends.map(r => ({
        gender: r.gender || 'Unknown',
        domain: r.domain.name,
        type: r.domain.type,
        avg_score: parseFloat(parseFloat(r.avg_score).toFixed(4)),
      })),
      recent_assessments: recentAssessments.map(a => ({
        id: a.id, status: a.status, started_at: a.started_at, completed_at: a.completed_at,
        first_name: a.user.first_name, last_name: a.user.last_name, email: a.user.email,
      })),
    });
  } catch (err) {
    console.error('Admin analytics error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * POST /admin/questions
 */
export const createQuestion = async (req, res) => {
  try {
    const { version_id, domain_id, question_text, order_index } = req.body;
    if (!version_id || !domain_id || !question_text || order_index == null) {
      return res.status(400).json({ error: 'version_id, domain_id, question_text, and order_index are required' });
    }
    const question = await Question.create({ version_id, domain_id, question_text, order_index });
    res.status(201).json({ question });
  } catch (err) {
    console.error('Create question error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * PUT /admin/questions/:id
 */
export const updateQuestion = async (req, res) => {
  try {
    const question = await Question.findByPk(req.params.id);
    if (!question) return res.status(404).json({ error: 'Question not found' });

    const { question_text, domain_id, order_index, is_active } = req.body;
    if (question_text !== undefined) question.question_text = question_text;
    if (domain_id !== undefined) question.domain_id = domain_id;
    if (order_index !== undefined) question.order_index = order_index;
    if (is_active !== undefined) question.is_active = is_active;

    await question.save();
    res.json({ question });
  } catch (err) {
    console.error('Update question error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * DELETE /admin/questions/:id (soft delete)
 */
export const deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findByPk(req.params.id);
    if (!question) return res.status(404).json({ error: 'Question not found' });
    question.is_active = false;
    await question.save();
    res.json({ message: 'Question deactivated', question });
  } catch (err) {
    console.error('Delete question error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * GET /admin/questions
 */
export const getQuestions = async (req, res) => {
  try {
    const { version_id, domain_id, is_active } = req.query;
    const where = {};
    if (version_id) where.version_id = version_id;
    if (domain_id) where.domain_id = domain_id;
    if (is_active !== undefined) where.is_active = is_active === 'true';

    const questions = await Question.findAll({
      where,
      include: [{ model: Domain, as: 'domain', attributes: ['name', 'type'] }],
      order: [['order_index', 'ASC']],
    });

    res.json({
      questions: questions.map(q => ({
        ...q.toJSON(),
        domain_name: q.domain.name,
        domain_type: q.domain.type,
      })),
    });
  } catch (err) {
    console.error('Get questions error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * GET /admin/domains
 */
export const getDomains = async (req, res) => {
  try {
    const domains = await Domain.findAll({ order: [['type', 'ASC'], ['id', 'ASC']] });
    res.json({ domains });
  } catch (err) {
    console.error('Get domains error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * GET /admin/versions
 */
export const getVersions = async (req, res) => {
  try {
    const versions = await AssessmentVersion.findAll({ order: [['id', 'DESC']] });
    res.json({ versions });
  } catch (err) {
    console.error('Get versions error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
