import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const CareerWeight = sequelize.define('CareerWeight', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  career_id: {
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
  tableName: 'career_weights',
  timestamps: false,
  indexes: [
    { unique: true, fields: ['career_id', 'domain_id'] },
  ],
});

export default CareerWeight;
