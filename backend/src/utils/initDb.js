import {
  sequelize,
  AssessmentVersion,
  Domain,
  Strand,
  StrandWeight,
  Career,
  CareerWeight,
  Question,
} from '../models/index.js';

/**
 * Initialize the database: sync models + seed reference data.
 */
export async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Sync all models (creates tables if not exist)
    await sequelize.sync({ alter: true });
    console.log('All models synchronized.');

    // Seed reference data (idempotent)
    await seedDomains();
    await seedAssessmentVersion();
    await seedStrands();
    await seedStrandWeights();
    await seedCareers();
    await seedCareerWeights();
    await seedQuestions();

    console.log('Seed data loaded.');
    return true;
  } catch (err) {
    console.error('Database initialization error:', err.message);
    throw err;
  }
}

// ── Seed helpers (findOrCreate = idempotent) ──────────────

async function seedAssessmentVersion() {
  await AssessmentVersion.findOrCreate({
    where: { version_name: 'MIPQ III + RIASEC v1.0' },
    defaults: { is_active: true },
  });
}

async function seedDomains() {
  const domains = [
    // MI (9 domains) — Likert scale 1-5
    { name: 'Linguistic', type: 'MI', max_value: 5, description: 'Ability to use words effectively, both orally and in writing.' },
    { name: 'Logical-Mathematical', type: 'MI', max_value: 5, description: 'Capacity to use numbers effectively and reason well.' },
    { name: 'Spatial', type: 'MI', max_value: 5, description: 'Ability to perceive the visual-spatial world accurately.' },
    { name: 'Bodily-Kinesthetic', type: 'MI', max_value: 5, description: 'Expertise in using the whole body to express ideas and feelings.' },
    { name: 'Musical', type: 'MI', max_value: 5, description: 'Capacity to perceive, discriminate, transform, and express musical forms.' },
    { name: 'Interpersonal', type: 'MI', max_value: 5, description: 'Ability to perceive and make distinctions in the moods and intentions of others.' },
    { name: 'Intrapersonal', type: 'MI', max_value: 5, description: 'Self-knowledge and ability to act adaptively on the basis of that knowledge.' },
    { name: 'Existential', type: 'MI', max_value: 5, description: 'Sensitivity and capacity to tackle deep questions about human existence.' },
    { name: 'Naturalistic', type: 'MI', max_value: 5, description: 'Expertise in recognizing and classifying flora and fauna.' },
    // RIASEC (6 domains) — Likert scale 1-3 (Like / Not Sure / Dislike)
    { name: 'Realistic', type: 'RIASEC', max_value: 3, description: 'Prefers physical activities that require skill, strength, and coordination.' },
    { name: 'Investigative', type: 'RIASEC', max_value: 3, description: 'Prefers activities involving thinking, organizing, and understanding.' },
    { name: 'Artistic', type: 'RIASEC', max_value: 3, description: 'Prefers ambiguous, free, unsystematized activities for creative expression.' },
    { name: 'Social', type: 'RIASEC', max_value: 3, description: 'Prefers activities that involve helping and developing others.' },
    { name: 'Enterprising', type: 'RIASEC', max_value: 3, description: 'Prefers activities that involve influencing others to attain goals.' },
    { name: 'Conventional', type: 'RIASEC', max_value: 3, description: 'Prefers activities that involve systematic manipulation of data, records, or materials.' },
  ];
  for (const d of domains) {
    const [domain, created] = await Domain.findOrCreate({
      where: { name: d.name, type: d.type },
      defaults: d,
    });
    // Update max_value if domain already exists
    if (!created && domain.max_value !== d.max_value) {
      await domain.update({ max_value: d.max_value });
    }
  }
}

async function seedStrands() {
  const strands = [
    { name: 'STEM', description: 'Science, Technology, Engineering, and Mathematics' },
    { name: 'ABM', description: 'Accountancy, Business, and Management' },
    { name: 'HUMSS', description: 'Humanities and Social Sciences' },
    { name: 'GAS', description: 'General Academic Strand' },
    { name: 'TVL', description: 'Technical-Vocational-Livelihood' },
    { name: 'Sports', description: 'Sports Track' },
    { name: 'Arts and Design', description: 'Arts and Design Track' },
  ];
  for (const s of strands) {
    await Strand.findOrCreate({ where: { name: s.name }, defaults: s });
  }
}

async function seedStrandWeights() {
  const existing = await StrandWeight.count();
  if (existing > 0) return;

  const domainMap = {};
  (await Domain.findAll()).forEach(d => { domainMap[d.name] = d.id; });

  const strandMap = {};
  (await Strand.findAll()).forEach(s => { strandMap[s.name] = s.id; });

  const weights = [
    // STEM
    { strand: 'STEM', domain: 'Logical-Mathematical', weight: 0.25 },
    { strand: 'STEM', domain: 'Spatial', weight: 0.15 },
    { strand: 'STEM', domain: 'Naturalistic', weight: 0.10 },
    { strand: 'STEM', domain: 'Intrapersonal', weight: 0.05 },
    { strand: 'STEM', domain: 'Realistic', weight: 0.15 },
    { strand: 'STEM', domain: 'Investigative', weight: 0.25 },
    { strand: 'STEM', domain: 'Conventional', weight: 0.05 },
    // ABM
    { strand: 'ABM', domain: 'Logical-Mathematical', weight: 0.20 },
    { strand: 'ABM', domain: 'Linguistic', weight: 0.10 },
    { strand: 'ABM', domain: 'Interpersonal', weight: 0.10 },
    { strand: 'ABM', domain: 'Intrapersonal', weight: 0.05 },
    { strand: 'ABM', domain: 'Enterprising', weight: 0.25 },
    { strand: 'ABM', domain: 'Conventional', weight: 0.20 },
    { strand: 'ABM', domain: 'Social', weight: 0.10 },
    // HUMSS
    { strand: 'HUMSS', domain: 'Linguistic', weight: 0.25 },
    { strand: 'HUMSS', domain: 'Interpersonal', weight: 0.15 },
    { strand: 'HUMSS', domain: 'Existential', weight: 0.15 },
    { strand: 'HUMSS', domain: 'Intrapersonal', weight: 0.10 },
    { strand: 'HUMSS', domain: 'Social', weight: 0.20 },
    { strand: 'HUMSS', domain: 'Artistic', weight: 0.10 },
    { strand: 'HUMSS', domain: 'Enterprising', weight: 0.05 },
    // GAS
    { strand: 'GAS', domain: 'Linguistic', weight: 0.12 },
    { strand: 'GAS', domain: 'Logical-Mathematical', weight: 0.12 },
    { strand: 'GAS', domain: 'Interpersonal', weight: 0.12 },
    { strand: 'GAS', domain: 'Intrapersonal', weight: 0.10 },
    { strand: 'GAS', domain: 'Existential', weight: 0.08 },
    { strand: 'GAS', domain: 'Investigative', weight: 0.12 },
    { strand: 'GAS', domain: 'Social', weight: 0.12 },
    { strand: 'GAS', domain: 'Enterprising', weight: 0.12 },
    { strand: 'GAS', domain: 'Conventional', weight: 0.10 },
    // TVL
    { strand: 'TVL', domain: 'Bodily-Kinesthetic', weight: 0.20 },
    { strand: 'TVL', domain: 'Spatial', weight: 0.15 },
    { strand: 'TVL', domain: 'Naturalistic', weight: 0.10 },
    { strand: 'TVL', domain: 'Realistic', weight: 0.25 },
    { strand: 'TVL', domain: 'Conventional', weight: 0.15 },
    { strand: 'TVL', domain: 'Investigative', weight: 0.10 },
    { strand: 'TVL', domain: 'Intrapersonal', weight: 0.05 },
    // Sports
    { strand: 'Sports', domain: 'Bodily-Kinesthetic', weight: 0.30 },
    { strand: 'Sports', domain: 'Interpersonal', weight: 0.15 },
    { strand: 'Sports', domain: 'Intrapersonal', weight: 0.10 },
    { strand: 'Sports', domain: 'Naturalistic', weight: 0.10 },
    { strand: 'Sports', domain: 'Realistic', weight: 0.20 },
    { strand: 'Sports', domain: 'Social', weight: 0.10 },
    { strand: 'Sports', domain: 'Enterprising', weight: 0.05 },
    // Arts and Design
    { strand: 'Arts and Design', domain: 'Musical', weight: 0.25 },
    { strand: 'Arts and Design', domain: 'Spatial', weight: 0.20 },
    { strand: 'Arts and Design', domain: 'Bodily-Kinesthetic', weight: 0.10 },
    { strand: 'Arts and Design', domain: 'Existential', weight: 0.10 },
    { strand: 'Arts and Design', domain: 'Artistic', weight: 0.25 },
    { strand: 'Arts and Design', domain: 'Intrapersonal', weight: 0.05 },
    { strand: 'Arts and Design', domain: 'Interpersonal', weight: 0.05 },
  ];

  for (const w of weights) {
    await StrandWeight.create({
      strand_id: strandMap[w.strand],
      domain_id: domainMap[w.domain],
      weight: w.weight,
    });
  }
}

async function seedCareers() {
  const careers = [
    { name: 'Software Engineer', description: 'Designs, develops, and maintains software systems and applications.' },
    { name: 'Data Scientist', description: 'Analyzes complex data to help organizations make better decisions.' },
    { name: 'Civil Engineer', description: 'Designs and oversees construction of infrastructure projects.' },
    { name: 'Doctor / Physician', description: 'Diagnoses and treats illnesses and injuries in patients.' },
    { name: 'Nurse', description: 'Provides patient care, health education, and medical support.' },
    { name: 'Accountant', description: 'Manages financial records, audits, and tax compliance.' },
    { name: 'Entrepreneur', description: 'Starts and manages businesses, identifying market opportunities.' },
    { name: 'Lawyer', description: 'Advises and represents clients in legal matters.' },
    { name: 'Teacher', description: 'Educates students and facilitates learning in academic settings.' },
    { name: 'Psychologist', description: 'Studies mental processes and behavior, provides counseling.' },
    { name: 'Journalist', description: 'Researches, writes, and reports on news and current events.' },
    { name: 'Graphic Designer', description: 'Creates visual concepts for communications using design tools.' },
    { name: 'Musician / Composer', description: 'Creates, performs, and produces music.' },
    { name: 'Architect', description: 'Designs buildings and structures, plans spatial environments.' },
    { name: 'Environmental Scientist', description: 'Studies the environment and develops solutions to environmental problems.' },
    { name: 'Marketing Manager', description: 'Plans and executes marketing strategies for products or services.' },
    { name: 'Social Worker', description: 'Helps individuals and communities cope with challenges.' },
    { name: 'Athlete / Sports Coach', description: 'Competes in sports or coaches athletes to improve performance.' },
    { name: 'Chef / Culinary Artist', description: 'Prepares food and manages kitchen operations creatively.' },
    { name: 'Mechanical Engineer', description: 'Designs and develops mechanical systems and devices.' },
    { name: 'Financial Analyst', description: 'Evaluates financial data and provides investment recommendations.' },
    { name: 'Diplomat / Foreign Service', description: 'Represents country in international relations and negotiations.' },
    { name: 'Biologist', description: 'Studies living organisms and their relationships to the environment.' },
    { name: 'Animator / Multimedia Artist', description: 'Creates visual effects, animations, and multimedia content.' },
    { name: 'Counselor', description: 'Provides guidance and support for personal and professional development.' },
  ];
  for (const c of careers) {
    await Career.findOrCreate({ where: { name: c.name }, defaults: c });
  }
}

async function seedCareerWeights() {
  const existing = await CareerWeight.count();
  if (existing > 0) return;

  const domainMap = {};
  (await Domain.findAll()).forEach(d => { domainMap[d.name] = d.id; });

  const careerMap = {};
  (await Career.findAll()).forEach(c => { careerMap[c.name] = c.id; });

  const weights = [
    { career: 'Software Engineer', domain: 'Logical-Mathematical', weight: 0.30 },
    { career: 'Software Engineer', domain: 'Spatial', weight: 0.15 },
    { career: 'Software Engineer', domain: 'Intrapersonal', weight: 0.10 },
    { career: 'Software Engineer', domain: 'Investigative', weight: 0.25 },
    { career: 'Software Engineer', domain: 'Realistic', weight: 0.15 },
    { career: 'Software Engineer', domain: 'Conventional', weight: 0.05 },
    { career: 'Data Scientist', domain: 'Logical-Mathematical', weight: 0.30 },
    { career: 'Data Scientist', domain: 'Intrapersonal', weight: 0.10 },
    { career: 'Data Scientist', domain: 'Linguistic', weight: 0.10 },
    { career: 'Data Scientist', domain: 'Investigative', weight: 0.30 },
    { career: 'Data Scientist', domain: 'Conventional', weight: 0.10 },
    { career: 'Data Scientist', domain: 'Realistic', weight: 0.10 },
    { career: 'Civil Engineer', domain: 'Logical-Mathematical', weight: 0.20 },
    { career: 'Civil Engineer', domain: 'Spatial', weight: 0.25 },
    { career: 'Civil Engineer', domain: 'Bodily-Kinesthetic', weight: 0.10 },
    { career: 'Civil Engineer', domain: 'Realistic', weight: 0.25 },
    { career: 'Civil Engineer', domain: 'Investigative', weight: 0.15 },
    { career: 'Civil Engineer', domain: 'Conventional', weight: 0.05 },
    { career: 'Doctor / Physician', domain: 'Logical-Mathematical', weight: 0.15 },
    { career: 'Doctor / Physician', domain: 'Naturalistic', weight: 0.15 },
    { career: 'Doctor / Physician', domain: 'Interpersonal', weight: 0.15 },
    { career: 'Doctor / Physician', domain: 'Intrapersonal', weight: 0.10 },
    { career: 'Doctor / Physician', domain: 'Investigative', weight: 0.25 },
    { career: 'Doctor / Physician', domain: 'Social', weight: 0.20 },
    { career: 'Nurse', domain: 'Interpersonal', weight: 0.20 },
    { career: 'Nurse', domain: 'Bodily-Kinesthetic', weight: 0.10 },
    { career: 'Nurse', domain: 'Naturalistic', weight: 0.10 },
    { career: 'Nurse', domain: 'Social', weight: 0.30 },
    { career: 'Nurse', domain: 'Investigative', weight: 0.15 },
    { career: 'Nurse', domain: 'Realistic', weight: 0.15 },
    { career: 'Accountant', domain: 'Logical-Mathematical', weight: 0.30 },
    { career: 'Accountant', domain: 'Intrapersonal', weight: 0.10 },
    { career: 'Accountant', domain: 'Conventional', weight: 0.35 },
    { career: 'Accountant', domain: 'Enterprising', weight: 0.10 },
    { career: 'Accountant', domain: 'Investigative', weight: 0.10 },
    { career: 'Accountant', domain: 'Linguistic', weight: 0.05 },
    { career: 'Entrepreneur', domain: 'Interpersonal', weight: 0.15 },
    { career: 'Entrepreneur', domain: 'Linguistic', weight: 0.10 },
    { career: 'Entrepreneur', domain: 'Logical-Mathematical', weight: 0.10 },
    { career: 'Entrepreneur', domain: 'Intrapersonal', weight: 0.10 },
    { career: 'Entrepreneur', domain: 'Enterprising', weight: 0.35 },
    { career: 'Entrepreneur', domain: 'Social', weight: 0.10 },
    { career: 'Entrepreneur', domain: 'Artistic', weight: 0.10 },
    { career: 'Lawyer', domain: 'Linguistic', weight: 0.30 },
    { career: 'Lawyer', domain: 'Interpersonal', weight: 0.15 },
    { career: 'Lawyer', domain: 'Existential', weight: 0.10 },
    { career: 'Lawyer', domain: 'Intrapersonal', weight: 0.10 },
    { career: 'Lawyer', domain: 'Enterprising', weight: 0.20 },
    { career: 'Lawyer', domain: 'Social', weight: 0.15 },
    { career: 'Teacher', domain: 'Linguistic', weight: 0.20 },
    { career: 'Teacher', domain: 'Interpersonal', weight: 0.20 },
    { career: 'Teacher', domain: 'Existential', weight: 0.10 },
    { career: 'Teacher', domain: 'Social', weight: 0.30 },
    { career: 'Teacher', domain: 'Artistic', weight: 0.10 },
    { career: 'Teacher', domain: 'Enterprising', weight: 0.10 },
    { career: 'Psychologist', domain: 'Intrapersonal', weight: 0.20 },
    { career: 'Psychologist', domain: 'Interpersonal', weight: 0.20 },
    { career: 'Psychologist', domain: 'Existential', weight: 0.15 },
    { career: 'Psychologist', domain: 'Linguistic', weight: 0.10 },
    { career: 'Psychologist', domain: 'Social', weight: 0.20 },
    { career: 'Psychologist', domain: 'Investigative', weight: 0.15 },
    { career: 'Journalist', domain: 'Linguistic', weight: 0.35 },
    { career: 'Journalist', domain: 'Interpersonal', weight: 0.10 },
    { career: 'Journalist', domain: 'Existential', weight: 0.10 },
    { career: 'Journalist', domain: 'Intrapersonal', weight: 0.10 },
    { career: 'Journalist', domain: 'Artistic', weight: 0.15 },
    { career: 'Journalist', domain: 'Investigative', weight: 0.10 },
    { career: 'Journalist', domain: 'Enterprising', weight: 0.10 },
    { career: 'Graphic Designer', domain: 'Spatial', weight: 0.30 },
    { career: 'Graphic Designer', domain: 'Musical', weight: 0.10 },
    { career: 'Graphic Designer', domain: 'Intrapersonal', weight: 0.05 },
    { career: 'Graphic Designer', domain: 'Artistic', weight: 0.35 },
    { career: 'Graphic Designer', domain: 'Realistic', weight: 0.10 },
    { career: 'Graphic Designer', domain: 'Investigative', weight: 0.10 },
    { career: 'Musician / Composer', domain: 'Musical', weight: 0.40 },
    { career: 'Musician / Composer', domain: 'Intrapersonal', weight: 0.10 },
    { career: 'Musician / Composer', domain: 'Existential', weight: 0.10 },
    { career: 'Musician / Composer', domain: 'Artistic', weight: 0.30 },
    { career: 'Musician / Composer', domain: 'Social', weight: 0.05 },
    { career: 'Musician / Composer', domain: 'Enterprising', weight: 0.05 },
    { career: 'Architect', domain: 'Spatial', weight: 0.30 },
    { career: 'Architect', domain: 'Logical-Mathematical', weight: 0.15 },
    { career: 'Architect', domain: 'Musical', weight: 0.10 },
    { career: 'Architect', domain: 'Artistic', weight: 0.20 },
    { career: 'Architect', domain: 'Realistic', weight: 0.15 },
    { career: 'Architect', domain: 'Investigative', weight: 0.10 },
    { career: 'Environmental Scientist', domain: 'Naturalistic', weight: 0.30 },
    { career: 'Environmental Scientist', domain: 'Logical-Mathematical', weight: 0.15 },
    { career: 'Environmental Scientist', domain: 'Existential', weight: 0.10 },
    { career: 'Environmental Scientist', domain: 'Investigative', weight: 0.25 },
    { career: 'Environmental Scientist', domain: 'Realistic', weight: 0.15 },
    { career: 'Environmental Scientist', domain: 'Social', weight: 0.05 },
    { career: 'Marketing Manager', domain: 'Linguistic', weight: 0.15 },
    { career: 'Marketing Manager', domain: 'Interpersonal', weight: 0.15 },
    { career: 'Marketing Manager', domain: 'Spatial', weight: 0.10 },
    { career: 'Marketing Manager', domain: 'Enterprising', weight: 0.30 },
    { career: 'Marketing Manager', domain: 'Social', weight: 0.15 },
    { career: 'Marketing Manager', domain: 'Artistic', weight: 0.15 },
    { career: 'Social Worker', domain: 'Interpersonal', weight: 0.25 },
    { career: 'Social Worker', domain: 'Existential', weight: 0.15 },
    { career: 'Social Worker', domain: 'Intrapersonal', weight: 0.15 },
    { career: 'Social Worker', domain: 'Social', weight: 0.30 },
    { career: 'Social Worker', domain: 'Artistic', weight: 0.05 },
    { career: 'Social Worker', domain: 'Enterprising', weight: 0.10 },
    { career: 'Athlete / Sports Coach', domain: 'Bodily-Kinesthetic', weight: 0.35 },
    { career: 'Athlete / Sports Coach', domain: 'Interpersonal', weight: 0.15 },
    { career: 'Athlete / Sports Coach', domain: 'Intrapersonal', weight: 0.10 },
    { career: 'Athlete / Sports Coach', domain: 'Realistic', weight: 0.20 },
    { career: 'Athlete / Sports Coach', domain: 'Social', weight: 0.10 },
    { career: 'Athlete / Sports Coach', domain: 'Enterprising', weight: 0.10 },
    { career: 'Chef / Culinary Artist', domain: 'Bodily-Kinesthetic', weight: 0.20 },
    { career: 'Chef / Culinary Artist', domain: 'Naturalistic', weight: 0.15 },
    { career: 'Chef / Culinary Artist', domain: 'Spatial', weight: 0.10 },
    { career: 'Chef / Culinary Artist', domain: 'Artistic', weight: 0.20 },
    { career: 'Chef / Culinary Artist', domain: 'Realistic', weight: 0.25 },
    { career: 'Chef / Culinary Artist', domain: 'Enterprising', weight: 0.10 },
    { career: 'Mechanical Engineer', domain: 'Logical-Mathematical', weight: 0.20 },
    { career: 'Mechanical Engineer', domain: 'Spatial', weight: 0.20 },
    { career: 'Mechanical Engineer', domain: 'Bodily-Kinesthetic', weight: 0.10 },
    { career: 'Mechanical Engineer', domain: 'Realistic', weight: 0.30 },
    { career: 'Mechanical Engineer', domain: 'Investigative', weight: 0.15 },
    { career: 'Mechanical Engineer', domain: 'Conventional', weight: 0.05 },
    { career: 'Financial Analyst', domain: 'Logical-Mathematical', weight: 0.30 },
    { career: 'Financial Analyst', domain: 'Intrapersonal', weight: 0.10 },
    { career: 'Financial Analyst', domain: 'Linguistic', weight: 0.05 },
    { career: 'Financial Analyst', domain: 'Investigative', weight: 0.20 },
    { career: 'Financial Analyst', domain: 'Conventional', weight: 0.25 },
    { career: 'Financial Analyst', domain: 'Enterprising', weight: 0.10 },
    { career: 'Diplomat / Foreign Service', domain: 'Linguistic', weight: 0.20 },
    { career: 'Diplomat / Foreign Service', domain: 'Interpersonal', weight: 0.20 },
    { career: 'Diplomat / Foreign Service', domain: 'Existential', weight: 0.15 },
    { career: 'Diplomat / Foreign Service', domain: 'Enterprising', weight: 0.20 },
    { career: 'Diplomat / Foreign Service', domain: 'Social', weight: 0.15 },
    { career: 'Diplomat / Foreign Service', domain: 'Artistic', weight: 0.10 },
    { career: 'Biologist', domain: 'Naturalistic', weight: 0.30 },
    { career: 'Biologist', domain: 'Logical-Mathematical', weight: 0.15 },
    { career: 'Biologist', domain: 'Intrapersonal', weight: 0.05 },
    { career: 'Biologist', domain: 'Investigative', weight: 0.30 },
    { career: 'Biologist', domain: 'Realistic', weight: 0.15 },
    { career: 'Biologist', domain: 'Social', weight: 0.05 },
    { career: 'Animator / Multimedia Artist', domain: 'Spatial', weight: 0.25 },
    { career: 'Animator / Multimedia Artist', domain: 'Musical', weight: 0.15 },
    { career: 'Animator / Multimedia Artist', domain: 'Bodily-Kinesthetic', weight: 0.05 },
    { career: 'Animator / Multimedia Artist', domain: 'Artistic', weight: 0.30 },
    { career: 'Animator / Multimedia Artist', domain: 'Realistic', weight: 0.15 },
    { career: 'Animator / Multimedia Artist', domain: 'Investigative', weight: 0.10 },
    { career: 'Counselor', domain: 'Interpersonal', weight: 0.25 },
    { career: 'Counselor', domain: 'Intrapersonal', weight: 0.20 },
    { career: 'Counselor', domain: 'Existential', weight: 0.15 },
    { career: 'Counselor', domain: 'Linguistic', weight: 0.10 },
    { career: 'Counselor', domain: 'Social', weight: 0.20 },
    { career: 'Counselor', domain: 'Artistic', weight: 0.10 },
  ];

  for (const w of weights) {
    await CareerWeight.create({
      career_id: careerMap[w.career],
      domain_id: domainMap[w.domain],
      weight: w.weight,
    });
  }
}

async function seedQuestions() {
  const existing = await Question.count();
  if (existing > 0) return;

  const version = await AssessmentVersion.findOne({ where: { is_active: true } });
  const domainMap = {};
  (await Domain.findAll()).forEach(d => { domainMap[d.name] = d.id; });

  // ──────────────────────────────────────────
  // MIPQ III — 35 items, Likert 1-5
  // ──────────────────────────────────────────
  const mipqQuestions = [
    // Linguistic (4 items)
    { domain: 'Linguistic', text: 'Writing is a natural way for me to express myself.', order: 1 },
    { domain: 'Linguistic', text: 'At school, studies in native language or social studies were easier for me than mathematics, physics and chemistry.', order: 2 },
    { domain: 'Linguistic', text: 'I have recently written something that I am especially proud of, or for which I have received recognition.', order: 3 },
    { domain: 'Linguistic', text: 'Metaphors and vivid verbal expressions help me learn efficiently.', order: 4 },
    // Logical-Mathematical (4 items)
    { domain: 'Logical-Mathematical', text: 'At school I was good at mathematics, physics or chemistry.', order: 5 },
    { domain: 'Logical-Mathematical', text: 'I can work with and solve complex problems.', order: 6 },
    { domain: 'Logical-Mathematical', text: 'Mental arithmetic is easy for me.', order: 7 },
    { domain: 'Logical-Mathematical', text: 'I am good at games and problem solving which require logical thinking.', order: 8 },
    // Spatial (4 items)
    { domain: 'Spatial', text: 'At school, geometry and assignments involving spatial perception were easier for me than solving equations.', order: 9 },
    { domain: 'Spatial', text: 'It is easy for me to conceptualize complex and multidimensional patterns.', order: 10 },
    { domain: 'Spatial', text: 'I can easily imagine how a landscape looks from a bird\'s eye view.', order: 11 },
    { domain: 'Spatial', text: 'When I read, I form illustrative pictures or designs in my mind.', order: 12 },
    // Bodily-Kinesthetic (4 items)
    { domain: 'Bodily-Kinesthetic', text: 'I am handy.', order: 13 },
    { domain: 'Bodily-Kinesthetic', text: 'I can easily do something concrete with my hands (e.g. knitting and woodwork).', order: 14 },
    { domain: 'Bodily-Kinesthetic', text: 'I am good at showing how to do something in practice.', order: 15 },
    { domain: 'Bodily-Kinesthetic', text: 'I was good at handicrafts at school.', order: 16 },
    // Musical (4 items)
    { domain: 'Musical', text: 'After hearing a tune once or twice I am able to sing or whistle it quite accurately.', order: 17 },
    { domain: 'Musical', text: 'When listening to music, I am able to discern instruments or recognize melodies.', order: 18 },
    { domain: 'Musical', text: 'I can easily keep the rhythm when drumming a melody.', order: 19 },
    { domain: 'Musical', text: 'I notice immediately if a melody is out of tune.', order: 20 },
    // Interpersonal (4 items)
    { domain: 'Interpersonal', text: 'Even in strange company, I easily find someone to talk to.', order: 21 },
    { domain: 'Interpersonal', text: 'I get along easily with different types of people.', order: 22 },
    { domain: 'Interpersonal', text: 'I make contact easily with other people.', order: 23 },
    { domain: 'Interpersonal', text: 'In negotiations and group work, I am able to support the group to find a consensus.', order: 24 },
    // Intrapersonal (5 items)
    { domain: 'Intrapersonal', text: 'I am able to analyze my own motives and ways of action.', order: 25 },
    { domain: 'Intrapersonal', text: 'I often think about my own feelings and sentiments and seek reasons for them.', order: 26 },
    { domain: 'Intrapersonal', text: 'I spend time regularly reflecting on the important issues in life.', order: 27 },
    { domain: 'Intrapersonal', text: 'I like to read psychological or philosophical literature to increase my self-knowledge.', order: 28 },
    { domain: 'Intrapersonal', text: 'In the midst of busy everyday life I find it important to contemplate.', order: 29 },
    // Existential (3 items)
    { domain: 'Existential', text: 'Even ordinary everyday life is full of miraculous things.', order: 30 },
    { domain: 'Existential', text: 'I often reflect on the meaning of life.', order: 31 },
    { domain: 'Existential', text: 'It is important to me to share a quiet moment with others.', order: 32 },
    // Naturalistic (3 items)
    { domain: 'Naturalistic', text: 'I enjoy the beauty and experiences related to nature.', order: 33 },
    { domain: 'Naturalistic', text: 'Protecting nature is important to me.', order: 34 },
    { domain: 'Naturalistic', text: 'I pay attention to my consumption habits in order to protect the environment.', order: 35 },
  ];

  // ──────────────────────────────────────────
  // RIASEC — 36 items, Likert 1-3 (Dislike=1, Not Sure=2, Like=3)
  // Pattern: every 6 items cycle R-I-A-S-E-C
  // R: 1,7,13,19,25,32  I: 2,8,14,20,26,29
  // A: 3,9,15,21,27,33  S: 4,10,16,22,28,34
  // E: 5,11,17,23,31,35 C: 6,12,18,24,30,36
  // ──────────────────────────────────────────
  const riasecQuestions = [
    { domain: 'Realistic', text: 'Repair a fan, motor, or cycle.', order: 36 },
    { domain: 'Investigative', text: 'Do a science experiment.', order: 37 },
    { domain: 'Artistic', text: 'Write a story or poem.', order: 38 },
    { domain: 'Social', text: 'Help a classmate with studies.', order: 39 },
    { domain: 'Enterprising', text: 'Lead a class project or group.', order: 40 },
    { domain: 'Conventional', text: 'Arrange books or files in order.', order: 41 },
    { domain: 'Realistic', text: 'Build a working model or craft.', order: 42 },
    { domain: 'Investigative', text: 'Solve puzzles and riddles.', order: 43 },
    { domain: 'Artistic', text: 'Design posters or do painting.', order: 44 },
    { domain: 'Social', text: 'Listen to friends\' problems.', order: 45 },
    { domain: 'Enterprising', text: 'Convince someone with ideas.', order: 46 },
    { domain: 'Conventional', text: 'Make a timetable or budget.', order: 47 },
    { domain: 'Realistic', text: 'Use tools to fix things.', order: 48 },
    { domain: 'Investigative', text: 'Study how plants grow.', order: 49 },
    { domain: 'Artistic', text: 'Act in a school play.', order: 50 },
    { domain: 'Social', text: 'Explain a topic to others.', order: 51 },
    { domain: 'Enterprising', text: 'Start a small business.', order: 52 },
    { domain: 'Conventional', text: 'Keep financial records.', order: 53 },
    { domain: 'Realistic', text: 'Work outdoors or with animals.', order: 54 },
    { domain: 'Investigative', text: 'Do science lab work.', order: 55 },
    { domain: 'Artistic', text: 'Make a short film or edit photos.', order: 56 },
    { domain: 'Social', text: 'Volunteer for a social cause.', order: 57 },
    { domain: 'Enterprising', text: 'Organize a school event.', order: 58 },
    { domain: 'Conventional', text: 'Follow step-by-step instructions.', order: 59 },
    { domain: 'Realistic', text: 'Operate machines or equipment.', order: 60 },
    { domain: 'Investigative', text: 'Do research from books or the internet.', order: 61 },
    { domain: 'Artistic', text: 'Compose music or dance.', order: 62 },
    { domain: 'Social', text: 'Support friends during tough times.', order: 63 },
    { domain: 'Investigative', text: 'Draw diagrams, charts, or maps.', order: 64 },
    { domain: 'Conventional', text: 'Plan a school project or activity.', order: 65 },
    { domain: 'Enterprising', text: 'Serve as a class officer or leader.', order: 66 },
    { domain: 'Realistic', text: 'Work on computers or coding tasks.', order: 67 },
    { domain: 'Artistic', text: 'Create crafts, models, or designs.', order: 68 },
    { domain: 'Social', text: 'Help solve conflicts between classmates.', order: 69 },
    { domain: 'Enterprising', text: 'Sell an idea or product.', order: 70 },
    { domain: 'Conventional', text: 'Maintain schedules or calendars.', order: 71 },
  ];

  const allQuestions = [...mipqQuestions, ...riasecQuestions];

  for (const q of allQuestions) {
    await Question.create({
      version_id: version.id,
      domain_id: domainMap[q.domain],
      question_text: q.text,
      order_index: q.order,
    });
  }
}
