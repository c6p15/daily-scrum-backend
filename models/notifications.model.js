const { DataTypes } = require("sequelize")
const { sequelize } = require("../configs/db")

const Notification = sequelize.define("Notification", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM("reminder", "missed", "new_comment"),
    allowNull: false,
  },
  daily_scrum_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  comment_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM("unread", "read"),
    defaultValue: "unread",
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: "notifications",
  timestamps: false,
})

module.exports = Notification
