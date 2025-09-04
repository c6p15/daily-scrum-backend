const { DataTypes } = require("sequelize")
const { sequelize } = require("../configs/db.js")

const Post = sequelize.define("Post", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  type: {
    type: DataTypes.ENUM("daily", "weekly"),
    allowNull: false,
  },
  today_task: DataTypes.TEXT,
  problem: DataTypes.TEXT,
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
  tableName: "posts",
  timestamps: false,
})

module.exports = Post