import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const AssessmentVersion = sequelize.define('AssessmentVersion', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  version_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'assessment_versions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

export default AssessmentVersion;
