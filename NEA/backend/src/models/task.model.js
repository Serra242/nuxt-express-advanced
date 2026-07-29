const { DataTypes } = require('sequelize')
const {
  sequelize,
} = require('../database/sequelize')

const Task = sequelize.define(
  'Task',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    done: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: 'tasks',
    timestamps: true,
    underscored: true,
  },
)

module.exports = Task