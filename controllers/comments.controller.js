const { Comment, DailyScrum, Notification, User, UserProject } = require("../models/index.js")
const { getFromCache, saveToCache, deleteFromCache } = require("../services/redis.service.js")
const { getObjectSignedUrl } = require("../services/storage.service.js")

exports.getAllComments = async (req, res) => {
  const { daily_scrum_id } = req.params
  const cacheKey = `comments:scrum:${daily_scrum_id}`

  try {
    const cached = await getFromCache(cacheKey)
    if (cached) return res.json({ message: "Fetch comments successfully!", status: 200, comments: cached })

    const comments = await Comment.findAll({
      where: { daily_scrum_id },
      include: {
        model: User,
        attributes: ["id", "firstname", "lastname", "profile_pic"],
      },
      order: [["created_at", "ASC"]],
    })

    for (const comment of comments) {
      const pic = comment.User?.profile_pic
      if (pic) {
        comment.User.profile_pic = await getObjectSignedUrl(pic)
      }
    }

    await saveToCache(cacheKey, comments)
    res.status(200).json({
      message: "Fetch comments successfully!",
      status: 200,
      comments,
    })
  } catch (err) {
    res.status(500).json({ error: "Fetch failed", details: err.message })
  }
}

exports.getCommentById = async (req, res) => {
  const { id } = req.params

  try {
    const comment = await Comment.findOne({
      where: { id },
      include: {
        model: User,
        attributes: ["id", "firstname", "lastname", "profile_pic"],
      },
    })

    if (!comment)
      return res.status(404).json({ error: "Comment not found" })

    const pic = comment.User?.profile_pic
    if (pic) {
      comment.User.profile_pic = await getObjectSignedUrl(pic)
    }

    res.status(200).json({
      message: "Fetch comment successfully!",
      status: 200,
      comment,
    })
  } catch (err) {
    res.status(500).json({ error: "Fetch failed", details: err.message })
  }
}

exports.createComment = async (req, res) => {
  const { daily_scrum_id } = req.params
  const { comment } = req.body
  const userId = req.user.id

  try {
    const dailyScrum = await DailyScrum.findByPk(daily_scrum_id)
    if (!dailyScrum) {
      return res.status(404).json({ error: "Daily scrum not found" })
    }

    const user = await User.findByPk(userId, {
      attributes: ["firstname", "lastname"]
    })

    if (!user) {
      return res.status(404).json({ error: "User not found" })
    } 

    const newComment = await Comment.create({
      daily_scrum_id,
      user_id: userId,
      comment,
    })

    await deleteFromCache(`comments:scrum:${daily_scrum_id}`)

    const userProject = await UserProject.findByPk(dailyScrum.user_project_id, {
      include: ["Project"],
    })

    if (userProject && userProject.user_id !== userId) {
      const projectTitle = userProject.Project?.title || "your project"

      const notification = await Notification.create({
        user_id: userProject.user_id,
        message: `${user.firstname} ${user.lastname} แสดงความคิดเห็นใน scrum ของคุณที่ ${projectTitle}`,
        type: "new_comment",
        daily_scrum_id,
        comment_id: newComment.id,
      })

      await deleteFromCache(`notifications:user:${userProject.user_id}`)

      if (global._io) {
        global._io.to(userProject.user_id.toString()).emit("notification", notification.toJSON())
        global._io.to(userProject.user_id.toString()).emit("notification:update")
      }
    }

    const createdComment = await Comment.findByPk(newComment.id, {
      include: { model: User, attributes: ["id", "firstname", "lastname", "profile_pic"] },
    })

    if (createdComment?.User?.profile_pic) {
      createdComment.User.profile_pic = await getObjectSignedUrl(createdComment.User.profile_pic)
    }

    res.status(201).json({
      message: "Create comment successfully!",
      status: 201,
      comment: createdComment,
    })
  } catch (err) {
    res.status(500).json({ error: "Create failed", details: err.message })
  }
}

exports.updateComment = async (req, res) => {
  const { id } = req.params
  const userId = req.user.id
  const { comment } = req.body

  try {
    const existingComment = await Comment.findByPk(id)

    if (!existingComment)
      return res.status(404).json({ error: "Comment not found" })
    if (existingComment.user_id !== userId)
      return res.status(403).json({ error: "Unauthorized" })

    await existingComment.update({ comment })

    await deleteFromCache(`comments:scrum:${existingComment.daily_scrum_id}`)

    const updatedComment = await Comment.findByPk(id, {
      include: {
        model: User,
        attributes: ["id", "firstname", "lastname", "profile_pic"]
      }
    })

    if (updatedComment?.User?.profile_pic) {
      updatedComment.User.profile_pic = await getObjectSignedUrl(updatedComment.User.profile_pic)
    }

    res.status(200).json({
      message: "Update comment successfully!",
      status: 200,
      comment: updatedComment
    })
  } catch (err) {
    res.status(500).json({
      error: "Update failed",
      details: err.message
    })
  }
}

exports.deleteComment = async (req, res) => {
  const { id } = req.params
  const userId = req.user.id

  try {
    const comment = await Comment.findByPk(id)

    if (!comment) return res.status(404).json({ error: "Comment not found" })
    if (comment.user_id !== userId)
      return res.status(403).json({ error: "Unauthorized" })

    const dailyScrumId = comment.daily_scrum_id

    await comment.destroy()
    await deleteFromCache(`comments:scrum:${dailyScrumId}`)

    res.status(200).json({
      message: "Delete comment successfully!",
      status: 200
    })
  } catch (err) {
    res.status(500).json({
      error: "Delete failed",
      details: err.message
    })
  }
}