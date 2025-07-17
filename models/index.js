const { sequelize } = require("../configs/db.js");

const User = require("./users.model.js");
const Project = require("./projects.model.js");
const UserProject = require("./userProject.model.js");
const DailyScrum = require("./dailyScrum.model.js");
const Comment = require("./comments.model.js");
const FilesUpload = require("./filesUpload.model.js");
const Notification = require("./notifications.model.js");


UserProject.belongsTo(User, { foreignKey: "user_id", onDelete: "CASCADE" });
User.hasMany(UserProject, { foreignKey: "user_id" });

UserProject.belongsTo(Project, { foreignKey: "project_id", onDelete: "CASCADE" });
Project.hasMany(UserProject, { foreignKey: "project_id" });

DailyScrum.belongsTo(UserProject, { foreignKey: "user_project_id", onDelete: "CASCADE" });
UserProject.hasMany(DailyScrum, { foreignKey: "user_project_id" });

Comment.belongsTo(DailyScrum, { foreignKey: "daily_scrum_id", onDelete: "CASCADE" });
DailyScrum.hasMany(Comment, { foreignKey: "daily_scrum_id" });

Comment.belongsTo(User, { foreignKey: "user_id", onDelete: "SET NULL" });
User.hasMany(Comment, { foreignKey: "user_id" });

FilesUpload.belongsTo(DailyScrum, { foreignKey: "daily_scrum_id", onDelete: "CASCADE" });
DailyScrum.hasMany(FilesUpload, { foreignKey: "daily_scrum_id" });

Notification.belongsTo(User, { foreignKey: "user_id", onDelete: "CASCADE" });
User.hasMany(Notification, { foreignKey: "user_id" });

Notification.belongsTo(DailyScrum, { foreignKey: "daily_scrum_id", onDelete: "SET NULL" });
DailyScrum.hasMany(Notification, { foreignKey: "daily_scrum_id" });

Notification.belongsTo(Comment, { foreignKey: "comment_id", onDelete: "SET NULL" });
Comment.hasMany(Notification, { foreignKey: "comment_id" });

module.exports = {
  sequelize,
  User,
  Project,
  UserProject,
  DailyScrum,
  Comment,
  FilesUpload,
  Notification,
};
