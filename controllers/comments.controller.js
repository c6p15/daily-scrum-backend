const { Comment, DailyScrum, User } = require("../models/index.js")
const { getFromCache, saveToCache, deleteFromCache } = require("../services/redis.service.js")

exports.getAllComments = async (req, res) => {
  const { daily_scrum_id } = req.params
  const cacheKey = `comments:scrum:${daily_scrum_id}`

  try {
    const cached = await getFromCache(cacheKey)
    if (cached) return res.json({ comments: cached })

    const comments = await Comment.findAll({
      where: { daily_scrum_id },
      include: { model: User, attributes: ["id", "firstname", "lastname"] },
      order: [["created_at", "ASC"]],
    })

    await saveToCache(cacheKey, comments)
    res.status(200).json({ message: 'Fetch comments successfully!', status: 200, comments })
  } catch (err) {
    res.status(500).json({ error: "Fetch failed", details: err.message })
  }
}

exports.getCommentById = async (req, res) => {
  const { daily_scrum_id, id } = req.params

  try {
    const comment = await Comment.findOne({
      where: { id, daily_scrum_id },
      include: { model: User, attributes: ["id", "firstname", "lastname"] },
    })

    if (!comment) return res.status(404).json({ error: "Comment not found" })

    res.status(200).json({ message: 'Fetch comment successfully!', status: 200, comment })
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
    if (!dailyScrum)
      return res.status(404).json({ error: "Daily scrum not found" })

    const newComment = await Comment.create({
      daily_scrum_id,
      user_id: userId,
      comment,
    })

    await deleteFromCache(`comments:scrum:${daily_scrum_id}`)

    res.status(201).json({ message: "Create comment successfully!", status: 201, comment: newComment })
  } catch (err) {
    res.status(500).json({ error: "Create failed", details: err.message })
  }
}

exports.updateComment = async (req, res) => {
  const { daily_scrum_id, id } = req.params
  const userId = req.user.id
  const { comment } = req.body

  try {
    const existingComment = await Comment.findOne({
      where: { id, daily_scrum_id },
    })

    if (!existingComment)
      return res.status(404).json({ error: "Comment not found" })
    if (existingComment.user_id !== userId)
      return res.status(403).json({ error: "Unauthorized" })

    await existingComment.update({ comment })

    await deleteFromCache(`comments:scrum:${daily_scrum_id}`)

    res.status(200).json({ message: "Update comment successfully!", status: 200, comment: existingComment })
  } catch (err) {
    res.status(500).json({ error: "Update failed", details: err.message })
  }
}

exports.deleteComment = async (req, res) => {
  const { daily_scrum_id, id } = req.params
  const userId = req.user.id

  try {
    const comment = await Comment.findOne({ where: { id, daily_scrum_id } })

    if (!comment) return res.status(404).json({ error: "Comment not found" })
    if (comment.user_id !== userId)
      return res.status(403).json({ error: "Unauthorized" })

    await comment.destroy()
    await deleteFromCache(`comments:scrum:${daily_scrum_id}`)

    res.status(200).json({ message: "Delete comment successfully!", status: 200})
  } catch (err) {
    res.status(500).json({ error: "Delete failed", details: err.message })
  }
}
