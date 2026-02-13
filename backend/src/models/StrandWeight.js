import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const StrandWeight = sequelize.define('StrandWeight', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  strand_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  domain_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  weight: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
}, {
  tableName: 'strand_weights',
  timestamps: false,
  indexes: [
    { unique: true, fields: ['strand_id', 'domain_id'] },
  ],
});

export default StrandWeight;
