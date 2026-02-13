import {
  Assessment,
  AssessmentVersion,
  Question,
  Response as ResponseModel,
  Domain,
  User,
} from '../models/index.js';
import { runFullScoringPipeline, getAssessmentResults } from '../services/scoringService.js';

/**
 * POST /assessments/start
 */
export const startAssessment = async (req, res) => {
  try {
    const userId = req.user.id;

    const existing = await Assessment.findOne({
      where: { user_id: userId, status: 'in_progress' },
    });
    if (existing) {
      return res.status(409).json({ error: 'You already have an in-progress assessment', assessment_id: existing.id });
    }

    const version = await AssessmentVersion.findOne({
      where: { is_active: true },
      order: [['id', 'DESC']],
    });
    if (!version) {
      return res.status(500).json({ error: 'No active assessment version found' });
    }

    const assessment = await Assessment.create({
      user_id: userId,
      version_id: version.id,
      status: 'in_progress',
    });

    const totalQuestions = await Question.count({
      where: { version_id: version.id, is_active: true },
    });

    res.status(201).json({
      message: 'Assessment started',
      assessment: { id: assessment.id, version_id: assessment.version_id, started_at: assessment.started_at, status: assessment.status, total_questions: totalQuestions },
    });
  } catch (err) {
    console.error('Start assessment error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * GET /assessments/:id/questions
 */
export const getQuestions = async (req, res) => {
  try {
    const assessment = await Assessment.findByPk(req.params.id);
    if (!assessment) return res.status(404).json({ error: 'Assessment not found' });

    const questions = await Question.findAll({
      where: { version_id: assessment.version_id, is_active: true },
      include: [{ model: Domain, as: 'domain', attributes: ['name', 'type', 'max_value'] }],
      order: [['order_index', 'ASC']],
    });

    const responses = await ResponseModel.findAll({
      where: { assessment_id: assessment.id },
      raw: true,
    });
    const responseMap = {};
    responses.forEach(r => { responseMap[r.question_id] = r.value; });

    res.json({
      assessment_id: assessment.id,
      status: assessment.status,
      questions: questions.map(q => ({
        id: q.id,
        question_text: q.question_text,
        order_index: q.order_index,
        domain_name: q.domain.name,
        domain_type: q.domain.type,
        max_value: q.domain.max_value,
        current_answer: responseMap[q.id] || null,
      })),
    });
  } catch (err) {
    console.error('Get questions error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * POST /assessments/:id/submit
 */
export const submitAssessment = async (req, res) => {
  try {
    const assessmentId = req.params.id;
    const { responses } = req.body;

    if (!responses || !Array.isArray(responses)) {
      return res.status(400).json({ error: 'Responses array is required' });
    }

    const assessment = await Assessment.findByPk(assessmentId);
    if (!assessment) return res.status(404).json({ error: 'Assessment not found' });
    if (assessment.status === 'completed') return res.status(409).json({ error: 'Assessment already completed' });

    // Fetch questions with their domain's max_value for validation
    const expectedQuestions = await Question.findAll({
      where: { version_id: assessment.version_id, is_active: true },
      attributes: ['id', 'domain_id'],
      include: [{ model: Domain, as: 'domain', attributes: ['max_value'] }],
      raw: true,
      nest: true,
    });
    const expectedIds = new Set(expectedQuestions.map(q => q.id));
    const questionMaxMap = {};
    expectedQuestions.forEach(q => { questionMaxMap[q.id] = q.domain?.max_value || 5; });
    const submittedIds = new Set(responses.map(r => r.question_id));

    // Validate all questions answered
    for (const qId of expectedIds) {
      if (!submittedIds.has(qId)) return res.status(400).json({ error: `Missing response for question ${qId}` });
    }
    for (const r of responses) {
      if (!expectedIds.has(r.question_id)) return res.status(400).json({ error: `Invalid question_id: ${r.question_id}` });
      const maxVal = questionMaxMap[r.question_id] || 5;
      if (r.value < 1 || r.value > maxVal || !Number.isInteger(r.value)) {
        return res.status(400).json({ error: `Invalid value for question ${r.question_id}: must be integer 1-${maxVal}` });
      }
    }
    if (responses.length !== submittedIds.size) return res.status(400).json({ error: 'Duplicate question_ids in submission' });

    // Upsert responses
    await ResponseModel.destroy({ where: { assessment_id: assessmentId } });
    await ResponseModel.bulkCreate(
      responses.map(r => ({ assessment_id: assessmentId, question_id: r.question_id, value: r.value })),
    );

    // Run scoring pipeline
    const results = await runFullScoringPipeline(assessmentId);

    res.json({ message: 'Assessment submitted and scored successfully', results });
  } catch (err) {
    console.error('Submit assessment error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * GET /assessments/:id/result
 */
export const getResult = async (req, res) => {
  try {
    const assessment = await Assessment.findByPk(req.params.id, {
      include: [{ model: User, as: 'user', attributes: ['first_name', 'last_name', 'email', 'gender'] }],
    });
    if (!assessment) return res.status(404).json({ error: 'Assessment not found' });
    if (assessment.status !== 'completed') return res.status(400).json({ error: 'Assessment not yet completed' });

    const results = await getAssessmentResults(assessment.id);
    if (!results) return res.status(404).json({ error: 'No results found' });

    res.json({
      assessment: { id: assessment.id, status: assessment.status, started_at: assessment.started_at, completed_at: assessment.completed_at },
      student: { first_name: assessment.user.first_name, last_name: assessment.user.last_name, email: assessment.user.email, gender: assessment.user.gender },
      ...results,
    });
  } catch (err) {
    console.error('Get result error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * GET /assessments/history
 */
export const getHistory = async (req, res) => {
  try {
    const assessments = await Assessment.findAll({
      where: { user_id: req.user.id },
      include: [{ model: AssessmentVersion, as: 'version', attributes: ['version_name'] }],
      order: [['started_at', 'DESC']],
    });

    res.json({
      assessments: assessments.map(a => ({
        id: a.id, status: a.status, started_at: a.started_at, completed_at: a.completed_at, version_name: a.version.version_name,
      })),
    });
  } catch (err) {
    console.error('Get history error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
