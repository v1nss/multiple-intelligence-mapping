import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Response = sequelize.define('Response', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  assessment_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  question_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  value: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 5 }, // MIPQ uses 1-5, RIASEC uses 1-3; controller validates per domain
  },
}, {
  tableName: 'responses',
  timestamps: false,
  indexes: [
    { unique: true, fields: ['assessment_id', 'question_id'] },
  ],
});

export default Response;
