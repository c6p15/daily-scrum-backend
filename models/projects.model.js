const { DataTypes } = require("sequelize")
const { sequelize } = require("../configs/db")

const Project = sequelize.define("Project", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: DataTypes.TEXT,
  deadline_date: DataTypes.DATEONLY,
  scrum_time: DataTypes.TIME,
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: "projects",
  timestamps: false,
})

module.exports = Project
