const { Sequelize } = require('sequelize');
const sequelize = require('../index');

const Report = sequelize.define('reports', {
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  reasonId: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  objectId: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  detail: {
    type: Sequelize.STRING,
    defaultValue: '',
  },
}, {
  charset: 'utf8mb4',
  timestamps: false,
});

Report.sync();

module.exports = Report;