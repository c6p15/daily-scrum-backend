const { Notification, User } = require('../models/index.js')
const { getFromCache, saveToCache, deleteFromCache } = require('../services/redis.service.js')

exports.getNotifications = async (req, res) => {
  const userId = req.user.id
  const cacheKey = `notifications:user:${userId}`

  try {
    const cached = await getFromCache(cacheKey)
    if (cached) return res.status(200).json({ notifications: JSON.parse(cached) })

    const notifications = await Notification.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
    })

    await saveToCache(cacheKey, JSON.stringify(notifications))
    res.status(200).json({ message: "Fetch notifications succesfully!", status: 200, notifications })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications', details: err.message })
  }
}

exports.getNotificationById = async (req, res) => {
  const { id } = req.params
  const userId = req.user.id

  try {
    const notification = await Notification.findByPk(id)

    if (!notification) return res.status(404).json({ error: 'Notification not found' })

    if (notification.user_id !== userId) {
      return res.status(403).json({ error: "Doesn't have access to this notification." });
    }

    res.status(200).json({ message: "Fetch notification successfully!", status: 200, notification })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notification', details: err.message })
  }
}

exports.createNotification = async (req, res) => {
  const { user_id, message, type, related_id } = req.body

  try {
    const notification = await Notification.create({
      user_id,
      message,
      type,
      related_id,
    })

    await deleteFromCache(`notifications:user:${user_id}`)
    res.status(201).json({ message: 'Create notification successfully!', status: 201, notification })
  } catch (err) {
    res.status(500).json({ error: 'Failed to create notification', details: err.message })
  }
}

exports.markAsRead = async (req, res) => {
  const { id } = req.params
  const userId = req.user.id

  try {
    const notification = await Notification.findByPk(id)

    if (!notification) return res.status(404).json({ error: 'Notification not found' })

    if (notification.user_id !== userId) {
      return res.status(403).json({ error: "Doesn't have access to this notification." })
    }

    notification.status = 'read'
    await notification.save()

    await deleteFromCache(`notifications:user:${userId}`)
    res.status(200).json({ message: 'Notification marked as read', status: 200, notification })
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notification', details: err.message })
  }
}

exports.deleteNotification = async (req, res) => {
  const { id } = req.params
  const userId = req.user.id

  try {
    const notification = await Notification.findByPk(id)

    if (!notification) return res.status(404).json({ error: 'Notification not found' })

    if (notification.user_id !== userId) {
      return res.status(403).json({ error: "Doesn't have access to this notification." })
    }

    await notification.destroy()
    await deleteFromCache(`notifications:user:${userId}`)
    res.status(200).json({ message: 'Delete notification successfully!', status: 200 })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete notification', details: err.message })
  }
}
