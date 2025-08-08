const express = require('express')
const router = express.Router()
const commentController = require('../controllers/comments.controller.js')
const auth = require("../middleware/auth.js")

router.get('/:daily_scrum_id', commentController.getAllComments)
router.post('/:daily_scrum_id', auth, commentController.createComment)

router.get(':id', commentController.getCommentById)
router.put('/:id', auth, commentController.updateComment)
router.delete('/:id', auth, commentController.deleteComment)

module.exports = router