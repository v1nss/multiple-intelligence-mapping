import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Strand = sequelize.define('Strand', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'strands',
  timestamps: false,
});

export default Strand;
