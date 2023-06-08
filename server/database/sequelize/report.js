const { Sequelize } = require('sequelize');
const sequelize = require('../index');

const Report = sequelize.define('reports', {
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  reason: {
    type: Sequelize.STRING,
    allowNull: false
  },
}, {
  charset: 'utf8mb4',
  timestamps: false,
});

Report.sync();

module.exports = Report;