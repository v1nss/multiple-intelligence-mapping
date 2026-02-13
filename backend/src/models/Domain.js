import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Domain = sequelize.define('Domain', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING(10),
    allowNull: false,
    validate: { isIn: [['MI', 'RIASEC']] },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  max_value: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5,
    comment: 'Maximum Likert scale value for questions in this domain (5 for MI, 3 for RIASEC)',
  },
}, {
  tableName: 'domains',
  timestamps: false,
  indexes: [
    { unique: true, fields: ['name', 'type'] },
  ],
});

export default Domain;
