import sequelize from '../config/db.js';
import User from './User.js';
import AssessmentVersion from './AssessmentVersion.js';
import Domain from './Domain.js';
import Question from './Question.js';
import Assessment from './Assessment.js';
import Response from './Response.js';
import ComputedScore from './ComputedScore.js';
import Strand from './Strand.js';
import StrandWeight from './StrandWeight.js';
import Career from './Career.js';
import CareerWeight from './CareerWeight.js';

// ── Associations ────────────────────────────────────────

// User → Assessments
User.hasMany(Assessment, { foreignKey: 'user_id', as: 'assessments' });
Assessment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// AssessmentVersion → Questions
AssessmentVersion.hasMany(Question, { foreignKey: 'version_id', as: 'questions' });
Question.belongsTo(AssessmentVersion, { foreignKey: 'version_id', as: 'version' });

// AssessmentVersion → Assessments
AssessmentVersion.hasMany(Assessment, { foreignKey: 'version_id', as: 'assessments' });
Assessment.belongsTo(AssessmentVersion, { foreignKey: 'version_id', as: 'version' });

// Domain → Questions
Domain.hasMany(Question, { foreignKey: 'domain_id', as: 'questions' });
Question.belongsTo(Domain, { foreignKey: 'domain_id', as: 'domain' });

// Assessment → Responses
Assessment.hasMany(Response, { foreignKey: 'assessment_id', as: 'responses' });
Response.belongsTo(Assessment, { foreignKey: 'assessment_id', as: 'assessment' });

// Question → Responses
Question.hasMany(Response, { foreignKey: 'question_id', as: 'responses' });
Response.belongsTo(Question, { foreignKey: 'question_id', as: 'question' });

// Assessment → ComputedScores
Assessment.hasMany(ComputedScore, { foreignKey: 'assessment_id', as: 'computed_scores' });
ComputedScore.belongsTo(Assessment, { foreignKey: 'assessment_id', as: 'assessment' });

// Domain → ComputedScores
Domain.hasMany(ComputedScore, { foreignKey: 'domain_id', as: 'computed_scores' });
ComputedScore.belongsTo(Domain, { foreignKey: 'domain_id', as: 'domain' });

// Strand → StrandWeights
Strand.hasMany(StrandWeight, { foreignKey: 'strand_id', as: 'weights' });
StrandWeight.belongsTo(Strand, { foreignKey: 'strand_id', as: 'strand' });

// Domain → StrandWeights
Domain.hasMany(StrandWeight, { foreignKey: 'domain_id', as: 'strand_weights' });
StrandWeight.belongsTo(Domain, { foreignKey: 'domain_id', as: 'domain' });

// Career → CareerWeights
Career.hasMany(CareerWeight, { foreignKey: 'career_id', as: 'weights' });
CareerWeight.belongsTo(Career, { foreignKey: 'career_id', as: 'career' });

// Domain → CareerWeights
Domain.hasMany(CareerWeight, { foreignKey: 'domain_id', as: 'career_weights' });
CareerWeight.belongsTo(Domain, { foreignKey: 'domain_id', as: 'domain' });

export {
  sequelize,
  User,
  AssessmentVersion,
  Domain,
  Question,
  Assessment,
  Response,
  ComputedScore,
  Strand,
  StrandWeight,
  Career,
  CareerWeight,
};
