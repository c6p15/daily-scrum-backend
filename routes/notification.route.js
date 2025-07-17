const express = require('express')
const router = express.Router()
const notificationController = require('../controllers/notifications.controller.js')
const auth = require("../middleware/auth.js")

router.use(auth)

router.get('/', notificationController.getNotifications)
router.get('/:id', notificationController.getNotificationById)
router.post('/', notificationController.createNotification)
router.patch('/:id', notificationController.markAsRead)
router.delete('/:id', notificationController.deleteNotification)

module.exports = router