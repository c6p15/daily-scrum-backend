const { DataTypes } = require("sequelize")
const { sequelize } = require("../configs/db")

const DailyScrum = sequelize.define("DailyScrum", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  type: {
    type: DataTypes.ENUM("daily", "friday", "retrospective"),
    allowNull: false,
  },
  today_task: DataTypes.TEXT,
  problem: DataTypes.TEXT,
  problem_level: DataTypes.ENUM("minor", "moderate", "critical"),
  tomorrow_task: DataTypes.TEXT,
  good: DataTypes.TEXT,
  bad: DataTypes.TEXT,
  try: DataTypes.TEXT,
  next_sprint: DataTypes.TEXT,
  user_project_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: "daily_scrum",
  timestamps: false,
})

module.exports = DailyScrum
