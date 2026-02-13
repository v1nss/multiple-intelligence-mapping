import bcrypt from 'bcrypt';
import {
  sequelize,
  User,
  AssessmentVersion,
  Domain,
  Question,
  Assessment,
  Response,
} from '../models/index.js';
import { runFullScoringPipeline } from '../services/scoringService.js';

// ──────────────────────────────────────────────────────────
// Deterministic pseudo-random (seeded) so re-runs are safe
// ──────────────────────────────────────────────────────────
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(42);

/** Random int in [min, max] */
function randInt(min, max) {
  return Math.floor(rand() * (max - min + 1)) + min;
}

/** Pick a biased value: higher probability for values near `center` */
function biasedValue(min, max, center) {
  // Triangular-ish distribution around center
  const r1 = rand();
  const r2 = rand();
  const avg = (r1 + r2) / 2; // tends toward 0.5
  const range = max - min;
  const raw = min + avg * range;
  // Blend 60% toward center, 40% random
  const blended = raw * 0.4 + center * 0.6;
  return Math.max(min, Math.min(max, Math.round(blended)));
}

// ──────────────────────────────────────────────────────────
// Student Profiles — each has biases toward certain domains
// ──────────────────────────────────────────────────────────
const STUDENT_PROFILES = [
  {
    first_name: 'Maria', last_name: 'Santos', email: 'maria.santos@school.edu',
    gender: 'female', birthdate: '2008-03-15',
    // STEM-leaning: high logical-math, spatial, realistic, investigative
    bias: { 'Logical-Mathematical': 5, 'Spatial': 4, 'Realistic': 3, 'Investigative': 3, 'Naturalistic': 3 },
  },
  {
    first_name: 'Juan', last_name: 'Dela Cruz', email: 'juan.delacruz@school.edu',
    gender: 'male', birthdate: '2008-07-22',
    // HUMSS-leaning: high linguistic, interpersonal, social, existential
    bias: { 'Linguistic': 5, 'Interpersonal': 4, 'Existential': 4, 'Social': 3, 'Intrapersonal': 4 },
  },
  {
    first_name: 'Angela', last_name: 'Reyes', email: 'angela.reyes@school.edu',
    gender: 'female', birthdate: '2008-11-03',
    // ABM-leaning: high logical-math, enterprising, conventional
    bias: { 'Logical-Mathematical': 4, 'Interpersonal': 4, 'Enterprising': 3, 'Conventional': 3, 'Linguistic': 3 },
  },
  {
    first_name: 'Carlos', last_name: 'Garcia', email: 'carlos.garcia@school.edu',
    gender: 'male', birthdate: '2009-01-18',
    // Arts-leaning: high musical, spatial, artistic
    bias: { 'Musical': 5, 'Spatial': 4, 'Artistic': 3, 'Existential': 4, 'Intrapersonal': 3 },
  },
  {
    first_name: 'Sofia', last_name: 'Mendoza', email: 'sofia.mendoza@school.edu',
    gender: 'female', birthdate: '2008-05-28',
    // Sports-leaning: high bodily-kinesthetic, realistic, interpersonal
    bias: { 'Bodily-Kinesthetic': 5, 'Interpersonal': 4, 'Realistic': 3, 'Social': 3, 'Naturalistic': 3 },
  },
  {
    first_name: 'Miguel', last_name: 'Torres', email: 'miguel.torres@school.edu',
    gender: 'male', birthdate: '2008-09-10',
    // TVL-leaning: high bodily-kinesthetic, spatial, realistic, conventional
    bias: { 'Bodily-Kinesthetic': 4, 'Spatial': 4, 'Realistic': 3, 'Conventional': 3, 'Naturalistic': 3 },
  },
  {
    first_name: 'Isabella', last_name: 'Cruz', email: 'isabella.cruz@school.edu',
    gender: 'female', birthdate: '2009-02-14',
    // GAS all-rounder: moderate across all
    bias: { 'Linguistic': 4, 'Logical-Mathematical': 3, 'Interpersonal': 4, 'Investigative': 3, 'Social': 3 },
  },
  {
    first_name: 'Rafael', last_name: 'Bautista', email: 'rafael.bautista@school.edu',
    gender: 'male', birthdate: '2008-12-05',
    // Strong STEM: very high logical-math and investigative
    bias: { 'Logical-Mathematical': 5, 'Naturalistic': 4, 'Investigative': 3, 'Realistic': 3, 'Intrapersonal': 4 },
  },
  {
    first_name: 'Patricia', last_name: 'Villanueva', email: 'patricia.villanueva@school.edu',
    gender: 'female', birthdate: '2008-08-20',
    // Social-oriented: high interpersonal, linguistic, social
    bias: { 'Interpersonal': 5, 'Linguistic': 4, 'Existential': 4, 'Social': 3, 'Artistic': 3 },
  },
  {
    first_name: 'Diego', last_name: 'Ramos', email: 'diego.ramos@school.edu',
    gender: 'male', birthdate: '2009-04-12',
    // Enterprising-Business: high enterprising, interpersonal, logical-math
    bias: { 'Interpersonal': 4, 'Logical-Mathematical': 4, 'Linguistic': 3, 'Enterprising': 3, 'Conventional': 3 },
  },
  {
    first_name: 'Camille', last_name: 'Aquino', email: 'camille.aquino@school.edu',
    gender: 'female', birthdate: '2008-06-30',
    // Artistic-Musical: high musical, artistic, spatial, existential
    bias: { 'Musical': 5, 'Spatial': 5, 'Existential': 4, 'Artistic': 3, 'Intrapersonal': 4 },
  },
  {
    first_name: 'Andrei', last_name: 'Navarro', email: 'andrei.navarro@school.edu',
    gender: 'male', birthdate: '2008-10-08',
    // Nature-Science: high naturalistic, investigative, realistic
    bias: { 'Naturalistic': 5, 'Logical-Mathematical': 3, 'Investigative': 3, 'Realistic': 3, 'Intrapersonal': 3 },
  },
];

/**
 * Generate a response value for a question based on the student's bias profile.
 * @param {object} profile - student profile with bias map
 * @param {string} domainName - the domain name of the question
 * @param {number} maxValue - max Likert value (5 for MI, 3 for RIASEC)
 */
function generateResponse(profile, domainName, maxValue) {
  const biasCenter = profile.bias[domainName];
  if (biasCenter !== undefined) {
    // Strong bias — center responses around biasCenter (scaled to maxValue)
    const scaledCenter = maxValue === 3
      ? Math.min(3, Math.max(1, Math.round((biasCenter / 5) * 3)))
      : biasCenter;
    return biasedValue(1, maxValue, scaledCenter);
  }
  // No specific bias — random value leaning slightly below center
  const center = maxValue === 3 ? 2 : 3;
  return biasedValue(1, maxValue, center);
}

/**
 * Generate slightly varied responses for a second/third assessment.
 * Shifts bias centers by ±1 to simulate natural variation.
 */
function varyProfile(profile, variation) {
  const newBias = { ...profile.bias };
  for (const key of Object.keys(newBias)) {
    const shift = variation === 1 ? randInt(-1, 1) : randInt(-1, 0);
    newBias[key] = Math.max(1, Math.min(5, newBias[key] + shift));
  }
  return { ...profile, bias: newBias };
}

// ──────────────────────────────────────────────────────────
// Main seeder
// ──────────────────────────────────────────────────────────
export async function seedUsersWithResults() {
  // Check if seed users already exist
  const existingCount = await User.count({
    where: { email: STUDENT_PROFILES[0].email },
  });
  if (existingCount > 0) {
    console.log('Seed users already exist — skipping user seeder.');
    return;
  }

  console.log('Seeding demo users with assessment results...');

  const version = await AssessmentVersion.findOne({ where: { is_active: true } });
  if (!version) {
    console.error('No active assessment version found — cannot seed users.');
    return;
  }

  // Load all questions grouped by domain
  const questions = await Question.findAll({
    where: { version_id: version.id, is_active: true },
    include: [{ model: Domain, as: 'domain', attributes: ['name', 'type', 'max_value'] }],
    order: [['order_index', 'ASC']],
  });

  if (questions.length === 0) {
    console.error('No questions found — cannot seed users.');
    return;
  }

  const passwordHash = await bcrypt.hash('Student123!', 10);

  // How many assessments each student takes (1, 2, or 3)
  const assessmentCounts = [2, 1, 3, 2, 1, 2, 1, 3, 2, 1, 2, 1];

  let totalUsers = 0;
  let totalAssessments = 0;

  for (let i = 0; i < STUDENT_PROFILES.length; i++) {
    const profile = STUDENT_PROFILES[i];
    const numAssessments = assessmentCounts[i] || 1;

    // Create user
    const user = await User.create({
      email: profile.email,
      password_hash: passwordHash,
      first_name: profile.first_name,
      last_name: profile.last_name,
      gender: profile.gender,
      birthdate: profile.birthdate,
      role: 'student',
    });
    totalUsers++;

    // Create assessments
    for (let a = 0; a < numAssessments; a++) {
      const variedProfile = a === 0 ? profile : varyProfile(profile, a);

      // Stagger dates: first assessment 30+ days ago, subsequent ones more recent
      const daysAgo = Math.max(1, 30 - (a * 12) - randInt(0, 5));
      const startedAt = new Date();
      startedAt.setDate(startedAt.getDate() - daysAgo);
      startedAt.setHours(randInt(8, 17), randInt(0, 59), randInt(0, 59));

      const assessment = await Assessment.create({
        user_id: user.id,
        version_id: version.id,
        status: 'in_progress',
        started_at: startedAt,
      });

      // Generate responses for every question
      const responseData = questions.map(q => ({
        assessment_id: assessment.id,
        question_id: q.id,
        value: generateResponse(variedProfile, q.domain.name, q.domain.max_value),
      }));

      await Response.bulkCreate(responseData);

      // Run full scoring pipeline (computes scores, marks completed)
      await runFullScoringPipeline(assessment.id);

      // Fix the completed_at date to match our staggered timeline
      const completedAt = new Date(startedAt);
      completedAt.setMinutes(completedAt.getMinutes() + randInt(15, 45));
      await Assessment.update(
        { completed_at: completedAt },
        { where: { id: assessment.id } },
      );

      totalAssessments++;
    }

    console.log(`  ✓ ${profile.first_name} ${profile.last_name} — ${numAssessments} assessment(s)`);
  }

  console.log(`Seeding complete: ${totalUsers} users, ${totalAssessments} assessments.`);
}
