const { DataTypes } = require("sequelize");
const { sequelize } = require("../configs/db");

const UserProject = sequelize.define("UserProject", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  project_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  position: DataTypes.STRING(100),
  scrum_point: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: "user_project",
  timestamps: false,
});

module.exports = UserProject;
