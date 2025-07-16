const express = require('express')
const router = express.Router()
const commentController = require('../controllers/comments.controller.js')
const auth = require("../middleware/auth.js")

router.get('/:daily-scrum-id', commentController.getAllComments)
router.post('/:daily-scrum-id', auth, commentController.createComment)

router.get('/:daily-scrum-id/:id', commentController.getCommentById)
router.put('/:daily-scrum-id/:id', auth, commentController.updateComment)
router.delete('/:daily-scrum-id/:id', auth, commentController.deleteComment)

module.exports = router