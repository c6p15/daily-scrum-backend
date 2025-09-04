const { sequelize } = require("../configs/db.js")

const User = require("./users.model.js")
const Project = require("./projects.model.js")
const UserProject = require("./userProject.model.js")
const Post = require("./posts.model.js")
const Comment = require("./comments.model.js")
const FilesUpload = require("./filesUpload.model.js")
const Notification = require("./notifications.model.js")


UserProject.belongsTo(User, { foreignKey: "user_id", onDelete: "CASCADE" })
User.hasMany(UserProject, { foreignKey: "user_id" })

UserProject.belongsTo(Project, { foreignKey: "project_id", onDelete: "CASCADE" })
Project.hasMany(UserProject, { foreignKey: "project_id" })

Post.belongsTo(UserProject, { foreignKey: "user_project_id", onDelete: "CASCADE" })
UserProject.hasMany(Post, { foreignKey: "user_project_id" })

Comment.belongsTo(Post, { foreignKey: "post_id", onDelete: "CASCADE" })
Post.hasMany(Comment, { foreignKey: "post_id" })

Comment.belongsTo(User, { foreignKey: "user_id", onDelete: "SET NULL" })
User.hasMany(Comment, { foreignKey: "user_id" })

FilesUpload.belongsTo(Post, { foreignKey: "post_id", onDelete: "CASCADE" })
Post.hasMany(FilesUpload, { foreignKey: "post_id" })

Notification.belongsTo(User, { foreignKey: "user_id", onDelete: "CASCADE" })
User.hasMany(Notification, { foreignKey: "user_id" })

Notification.belongsTo(Post, { foreignKey: "post_id", onDelete: "SET NULL" })
Post.hasMany(Notification, { foreignKey: "post_id" })

Notification.belongsTo(Comment, { foreignKey: "comment_id", onDelete: "SET NULL" })
Comment.hasMany(Notification, { foreignKey: "comment_id" })

Notification.belongsTo(Project, { foreignKey: "project_id", onDelete: "SET NULL" })
Project.hasMany(Notification, { foreignKey: "project_id" })

module.exports = {
  sequelize,
  User,
  Project,
  UserProject,
  Post,
  Comment,
  FilesUpload,
  Notification,
}