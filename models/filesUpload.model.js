const { DataTypes } = require("sequelize")
const { sequelize } = require("../configs/db")

const FileUpload = sequelize.define("FileUpload", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  daily_scrum_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  file_url: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  file_name: DataTypes.STRING(255),
  mime_type: DataTypes.STRING(100),
  file_size: DataTypes.INTEGER,
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: "files_upload",
  timestamps: false,
})

module.exports = FileUpload
