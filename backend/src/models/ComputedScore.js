import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const ComputedScore = sequelize.define('ComputedScore', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  assessment_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  domain_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  raw_score: {
    type: DataTypes.DECIMAL,
    allowNull: false,
  },
  normalized_score: {
    type: DataTypes.DECIMAL,
    allowNull: false,
  },
}, {
  tableName: 'computed_scores',
  timestamps: false,
  indexes: [
    { unique: true, fields: ['assessment_id', 'domain_id'] },
  ],
});

export default ComputedScore;
